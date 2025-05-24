const puppeteer = require('puppeteer');
const ExcelJS = require('exceljs');
const fs = require('fs').promises; // Using promises version of fs
const fsSync = require('fs'); // For sync operations like readFileSync if absolutely needed
const iconv = require('iconv-lite');
const path = require('path');
const { getYoubi } = require('../util/common');
const { getRowNumByRoomname, r1c1ToA1, rowMergeProc } = require('../util/reportUtils');
const log4js = require("log4js"); // For logging
const logger = log4js.configure(path.join(__dirname, '../config/log4js-config.json')).getLogger(); // Ensure path is correct

// Define dlpath here or make it configurable. Using a relative path for better portability.
const DOWNLOAD_BASE_PATH = path.join(__dirname, '../downloads/dispyoyakuriyoustatus');

/**
 * Helper function to get a new page (tab) opened by an action on the current page.
 * This was originally an inner function in routes/dlriyoustatus.js
 */
async function _getNewPage(browser, page) {
  const pageTarget = page.target();
  const newTarget = await browser.waitForTarget(
    (target) => target.opener() === pageTarget
  );
  const newPage = await newTarget.page();
  if (newPage) {
    await newPage.waitForSelector("body", { timeout: 60000 }); // Increased timeout
    return newPage;
  }
  throw new Error("Failed to get new page.");
}

async function downloadReservationData(target_yyyymmdd) {
  logger.info(`[reportService] Starting download process for ${target_yyyymmdd}`);
  let browser;
  let downloadedFilePath = null; // Initialize to null

  try {
    // Ensure download directory exists
    await fs.mkdir(DOWNLOAD_BASE_PATH, { recursive: true });
    logger.info(`[reportService] Ensured download directory exists: ${DOWNLOAD_BASE_PATH}`);

    const setTimeout = require("node:timers/promises").setTimeout; // For async delays

    browser = await puppeteer.launch({
      headless: true, // Consider making this configurable via .env
      args: [
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-setuid-sandbox',
        '--no-first-run',
        '--no-sandbox',
        '--no-zygote',
        // '--single-process' // This can sometimes cause issues, test without it first
      ]
    });
    logger.info('[reportService] Puppeteer browser launched.');

    let page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 960 }); // Recommended for consistency

    const URL = process.env.YOYAKU_URL;
    if (!URL) throw new Error("YOYAKU_URL is not defined in environment variables.");
    logger.info(`[reportService] Navigating to YOYAKU_URL: ${URL}`);
    await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });

    // Login
    if (!process.env.YOYAKU_LOGIN_ID || !process.env.YOYAKU_LOGIN_PASSWORD) {
      throw new Error("YOYAKU_LOGIN_ID or YOYAKU_LOGIN_PASSWORD not defined.");
    }
    await page.type('input[name="in_office"]', process.env.YOYAKU_LOGIN_ID);
    await page.type('input[name="in_opassword"]', process.env.YOYAKU_LOGIN_PASSWORD);
    logger.info('[reportService] Typing login credentials.');
    await page.click(
      "body > table > tbody > tr > td > table > tbody > tr:nth-child(1) > td > form > table:nth-child(2) > tbody > tr > td:nth-child(2) > input"
    );
    logger.info('[reportService] Clicked login button.');

    await setTimeout(1000); // Wait for navigation/login processing

    // Admin menu
    logger.info('[reportService] Clicking admin menu.');
    const menu = await page.$(
      "body > table > tbody > tr > td > table > tbody > tr > td > table:nth-child(2) > tbody > tr:nth-child(3) > td:nth-child(2) > input[type=image]:nth-child(6)"
    );
    if (!menu) throw new Error("Admin menu button not found.");
    await menu.click();
    await setTimeout(2000);

    let newPage = await _getNewPage(browser, page);
    logger.info('[reportService] Switched to new page for admin password.');

    // Manager Password
    if (!process.env.YOYAKU_LOGIN_PASSWORD) { // Assuming manager pass is same as login pass
        throw new Error("YOYAKU_LOGIN_PASSWORD for manager not defined.");
    }
    await newPage.type('input[name="in_managerpassword"]', process.env.YOYAKU_LOGIN_PASSWORD);
    const inputElement = await newPage.$("input[type=submit]");
    if (!inputElement) throw new Error("Manager password submit button not found.");
    await inputElement.click();
    logger.info('[reportService] Submitted manager password.');
    await setTimeout(2000);

    // Click "ダウンロード" (Download)
    logger.info('[reportService] Clicking download main button.');
    await newPage.click(
      "body > div:nth-child(3) > table > tbody > tr > th:nth-child(6) > img"
    );
    await setTimeout(2000);

    // Click "予約情報ダウンロード" (Reservation Info Download)
    logger.info('[reportService] Clicking reservation info download button.');
    await newPage.click(
      "#inbody > div > div:nth-child(2) > div:nth-child(2) > div.waku_5 > img"
    );
    await setTimeout(2000);

    let newPageTouroku = await _getNewPage(browser, newPage);
    logger.info('[reportService] Switched to new page for download criteria.');

    newPageTouroku.on('dialog', async dialog => {
      logger.info(`[reportService] Dialog message: ${dialog.message()}`);
      await dialog.accept();
      logger.info('[reportService] Accepted dialog.');
    });

    const inYYYY = target_yyyymmdd.slice(0, 4);
    const inMM = target_yyyymmdd.slice(4, 6);
    const in_DD = target_yyyymmdd.slice(-2);

    logger.info(`[reportService] Setting date criteria: ${inYYYY}-${inMM}-${in_DD}`);
    await newPageTouroku.select('select[name="in_month"]', `${inYYYY}-${inMM}`);
    await newPageTouroku.select('select[name="in_sday"]', String(Number(in_DD)));
    await newPageTouroku.select('select[name="in_eday"]', String(Number(in_DD)));

    await newPageTouroku.click("#inbody > table > tbody > tr:nth-child(3) > td.reserve_screen > a:nth-child(2)");
    await newPageTouroku.click("#inbody > table > tbody > tr:nth-child(4) > td.reserve_screen > a:nth-child(2)");
    logger.info('[reportService] Selected all items.');

    // This is where the critical part of getting the filename happens
    // We need to know the filename *before* clicking the download button, or intercept the download.
    // The original code gets the filename from a link that appears *after* this click.
    // However, Puppeteer's download handling is better if set up *before* the click.

    // Let's try to get the filename by anticipating the link that will be generated.
    // This is risky. A better way is to use page.waitForEvent('download') if the browser context supports it,
    // or to check the content of the page for the link *after* clicking "予約データ"
    
    // For now, setting up download behavior for the *current* page (newPageTouroku)
    // The actual download might happen on yet another new page or a direct response.
    
    const client = await newPageTouroku.target().createCDPSession();
    await client.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: DOWNLOAD_BASE_PATH
    });
    logger.info(`[reportService] Download path set to: ${DOWNLOAD_BASE_PATH}`);

    await newPageTouroku.click("#inbody > p:nth-child(4) > input:nth-child(1)"); // Click "予約データ" (Reservation Data)
    logger.info('[reportService] Clicked "Reservation Data" button, expecting download trigger or new page with link.');
    
    await setTimeout(5000); // Wait for download processing or new page to load

    // Check if a new page opened with the download link (original logic)
    let newPageResult;
    try {
        newPageResult = await _getNewPage(browser, newPageTouroku);
        logger.info('[reportService] Switched to new page for download link.');
    } catch(e) {
        logger.warn('[reportService] No new page for download link, assuming direct download started or failed. Error: ' + e.message);
        // If no new page, the download might have started directly. We need to guess the filename or find another way.
        // This part is tricky and highly dependent on site behavior.
        // For now, we'll assume the original logic of finding a link is primary.
    }

    let dlFilename = '';
    if (newPageResult) {
        const hrefs = await newPageResult.$$eval('a', anchors => anchors.map(anchor => anchor.href));
        if (hrefs.length > 0 && hrefs[0]) {
            dlFilename = hrefs[0].split("/").pop(); // Get the last part of the URL path
            logger.info(`[reportService] Extracted potential filename from link: ${dlFilename}`);
            // The original code then clicked this link. If setDownloadBehavior worked, this might not be needed.
            // However, to be safe and mimic original:
            const a_tag = await newPageResult.$('a');
            if (a_tag) {
                logger.info('[reportService] Clicking the download link on the result page.');
                await a_tag.click();
                await setTimeout(10000); // Wait for download initiated by link click
            } else {
                 logger.warn('[reportService] Download link tag not found on result page.');
            }
        } else {
            logger.warn('[reportService] No download links found on the result page.');
        }
    }

    // If dlFilename is still empty, we have a problem. Try to find the latest file in download dir.
    // This is a fallback and less reliable.
    if (!dlFilename) {
        logger.warn('[reportService] Filename not extracted from a link. Attempting to find latest CSV in download directory.');
        const files = await fs.readdir(DOWNLOAD_BASE_PATH);
        const csvFiles = files.filter(f => f.endsWith('.csv') || f.endsWith('.CSV')) // Assuming CSV
                               .sort((a, b) => fsSync.statSync(path.join(DOWNLOAD_BASE_PATH, b)).mtime.getTime() - 
                                               fsSync.statSync(path.join(DOWNLOAD_BASE_PATH, a)).mtime.getTime());
        if (csvFiles.length > 0) {
            dlFilename = csvFiles[0]; // Pick the most recently modified CSV
            logger.info(`[reportService] Found latest CSV: ${dlFilename} (heuristic).`);
        } else {
            throw new Error("Download failed: No CSV file found in download directory and no link provided.");
        }
    }
    
    downloadedFilePath = path.join(DOWNLOAD_BASE_PATH, dlFilename);
    logger.info(`[reportService] Full path to downloaded file: ${downloadedFilePath}`);

    // Verify file exists
    await fs.access(downloadedFilePath); // Throws error if not found
    logger.info(`[reportService] Successfully verified downloaded file exists: ${downloadedFilePath}`);

    return downloadedFilePath;

  } catch (error) {
    logger.error(`[reportService] Error in downloadReservationData for ${target_yyyymmdd}:`, error);
    // Clean up partial downloads?
    throw error;
  } finally {
    if (browser) {
      logger.info("[reportService] Closing browser.");
      await browser.close();
    }
  }
}

async function generateReportExcel(downloadedFilePath, target_yyyymmdd) {
  logger.info(`[reportService] Starting Excel report generation for ${target_yyyymmdd} using ${downloadedFilePath}`);
  try {
    const templatePath = path.join(__dirname, '../public/template/riyoustatus.xlsx');
    logger.info(`[reportService] Reading Excel template from: ${templatePath}`);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);
    const worksheet = workbook.getWorksheet('main'); // Original sheet name was 'main'

    if (!worksheet) {
        throw new Error("Worksheet 'main' not found in the template. Check template structure and sheet name.");
    }

    const inYYYY = target_yyyymmdd.slice(0, 4);
    const inMM = target_yyyymmdd.slice(4, 6);
    const in_DD = target_yyyymmdd.slice(-2);
    const dateObj = new Date(parseInt(inYYYY, 10), parseInt(inMM, 10) - 1, parseInt(in_DD, 10));
    const youbi = getYoubi(dateObj); // From util/common.js

    const title = `${inYYYY}年${inMM}月${in_DD}日(${youbi}) 会議室予約状況`;
    worksheet.getCell('A1').value = title;
    worksheet.getCell('A41').value = title; // Assuming this is for a second page or footer
    logger.info(`[reportService] Set titles in worksheet: ${title}`);

    // Read and parse CSV data
    logger.info(`[reportService] Reading downloaded CSV file: ${downloadedFilePath}`);
    const csvDataBuffer = await fs.readFile(downloadedFilePath);
    // The original code used fs.readFileSync, so using that here for consistency for now.
    // const csvDataBuffer = fsSync.readFileSync(downloadedFilePath); 
    const csvDataString = iconv.decode(csvDataBuffer, 'Shift_JIS');
    const records = csvDataString.split(/\r\n|\n/); // Split by new lines (Windows or Unix)
    logger.info(`[reportService] Read ${records.length} lines from CSV.`);

    records.forEach((line, index) => {
      if (index === 0 && line.includes("登録日")) return; // Skip header if it contains "登録日"
      if (line.trim() === "") return; // Skip empty lines

      let linecontents = line.split(",");

      // Check if linecontents has enough elements, crucial for data integrity
      if (linecontents.length < 14) { // Original code accesses up to index 13
          logger.warn(`[reportService] Skipping malformed CSV line (not enough columns): ${line}`);
          return;
      }

      // Original indices: roomName[4], timeRange[5], purpose[13]
      const roomName = linecontents[4]?.trim();
      const timeRange = linecontents[5]?.trim();
      const riyoumokuteki = linecontents[13]?.trim();

      if (!roomName || !timeRange) {
        logger.warn(`[reportService] Skipping CSV line with missing roomName or timeRange: ${line}`);
        return;
      }
      
      let baseRowNum = getRowNumByRoomname(roomName); // From reportUtils.js
      if (baseRowNum === null) {
        logger.warn(`[reportService] Room name "${roomName}" not found in mapping. Skipping line: ${line}`);
        return;
      }
      let targetExcelRow = baseRowNum + 1; // Original logic added 1

      const timeParts = timeRange.split("～");
      if (timeParts.length !== 2) {
        logger.warn(`[reportService] Invalid time range format "${timeRange}". Skipping line: ${line}`);
        return;
      }
      const startTime = timeParts[0].slice(0, 2); // "09" from "09:00"
      const endTime = timeParts[1].slice(0, 2);   // "17" from "17:00"

      // Original column calculation: (parseInt(startTime)-9)+3
      // This means 09:00 -> (9-9)+3 = col 3 (C)
      // 10:00 -> (10-9)+3 = col 4 (D)
      // ...
      // endTime was (parseInt(endTime)-10)+3
      // This means for a 09:00-10:00 slot, endCol was (10-10)+3 = 3. Loop was `for (let i = startCol; endCol >= i; i++)`
      // This implies cells were filled for each hour *within* the range.
      
      let startCol = (parseInt(startTime, 10) - 9) + 3;
      // For the loop to cover the end hour, endCol should be for the start of the last hour.
      // Example: 09:00-11:00 should fill 09:00 cell and 10:00 cell.
      // startTime 09 -> col 3. endTime 11.
      // Loop needs to go up to the column for 10:00.
      // Column for hour X is (X-9)+3. So for 10:00, it's (10-9)+3 = 4.
      // The loop should go from startCol to (parseInt(endTime, 10) - 1 - 9) + 3
      let endHourForLoop = parseInt(endTime, 10) -1; // If ends at 11:00, last filled slot is 10:00-11:00
      let endCol = (endHourForLoop - 9) + 3;


      if (startCol < 3 || endCol < startCol || endCol > 16 /* P column, 22:00 slot */) {
          logger.warn(`[reportService] Invalid start/end column calculation for time ${timeRange} (startCol: ${startCol}, endCol: ${endCol}). Skipping.`);
          return;
      }
      
      for (let c = startCol; c <= endCol; c++) {
        const cellA1 = r1c1ToA1(targetExcelRow, c); // From reportUtils.js
        worksheet.getCell(cellA1).value = riyoumokuteki;
        // Alignment is handled by rowMergeProc later or can be set here if needed per cell
      }
    });
    logger.info(`[reportService] Finished populating data from CSV.`);

    // Merging cells - Original logic
    logger.info(`[reportService] Starting row merge process (page 1).`);
    for (let r = 6; r <= 38; r++) { // These are direct Excel row numbers
      rowMergeProc(worksheet, r); // From reportUtils.js
    }
    logger.info(`[reportService] Starting row merge process (page 2).`);
    for (let r = 45; r <= 54; r++) { // These are direct Excel row numbers
      rowMergeProc(worksheet, r);
    }
    logger.info(`[reportService] Row merge process completed.`);

    return workbook;
  } catch (error) {
    logger.error(`[reportService] Error in generateReportExcel for ${target_yyyymmdd}:`, error);
    throw error;
  }
}

module.exports = {
  downloadReservationData,
  generateReportExcel,
};
