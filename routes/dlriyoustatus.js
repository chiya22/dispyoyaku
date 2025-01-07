const log4js = require("log4js");
const logger = log4js.configure('./config/log4js-config.json').getLogger();
const express = require('express');
const ExcelJS = require('exceljs');
const puppeteer = require("puppeteer");
const iconv = require("iconv-lite");
const fs = require("fs");
const common = require("../util/common");


const router = express.Router();
const dlpath = 'C:\\download\\dispyoyakuriyoustatus';

router.get('/', (req,res) => {

  const date = new Date();
  let tmp = '';
  tmp = '' + date.getFullYear();
  tmp += '' + ('0' + (date.getMonth() + 1)).slice(-2);
  tmp += '' + ('0' + date.getDate()).slice(-2);
  
  res.render('dlriyoustatus', {
    target_yyyymmdd: tmp
  });
})  

/**
 * 指定された日付の予約情報をもとに利用状況表エクセルを作成しダウンロードさせる
 */
router.post('/', (req, res) => {

  (async () => {

    const setTimeout = require("node:timers/promises").setTimeout;

    // 当日の会議室予約情報を取得する
    const browser = await puppeteer.launch({ headless: true,args: [
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-setuid-sandbox',
        '--no-first-run',
        '--no-sandbox',
        '--no-zygote',
        '--single-process'
    ]});

    let page = await browser.newPage();

    const URL = process.env.YOYAKU_URL;
    await page.goto(URL, { waitUntil: "domcontentloaded" });

    // ログイン
    await page.type('input[name="in_office"]', process.env.YOYAKU_LOGIN_ID);
    await page.type('input[name="in_opassword"]', process.env.YOYAKU_LOGIN_PASSWORD);
    await page.click(
        "body > table > tbody > tr > td > table > tbody > tr:nth-child(1) > td > form > table:nth-child(2) > tbody > tr > td:nth-child(2) > input"
    );

    // await page.waitForTimeout(1000);
    await setTimeout(1000);
    // await page.waitForNavigation({waitUntil: 'domcontentloaded'});

    // 管理画面から「管理者メニュー」をクリック
    const menu = await page.$(
        "body > table > tbody > tr > td > table > tbody > tr > td > table:nth-child(2) > tbody > tr:nth-child(3) > td:nth-child(2) > input[type=image]:nth-child(6)"
    );
    await menu.click();

    // await page.waitForTimeout(2000);
    await setTimeout(2000);

    // 新しく開いたページを取得
    let newPage = await getNewPage(page);

    // パスワードの設定
    await newPage.type('input[name="in_managerpassword"]', process.env.YOYAKU_LOGIN_PASSWORD);
    const inputElement = await newPage.$("input[type=submit]");
    await inputElement.click();

    // await newPage.waitForTimeout(2000);
    await setTimeout(2000);

    // 「ダウンロード」のクリック
    await newPage.click(
        "body > div:nth-child(3) > table > tbody > tr > th:nth-child(6) > img"
    );

    // await newPage.waitForTimeout(2000);
    await setTimeout(2000);

    // 「予約情報ダウンロード」のクリック
    await newPage.click(
        "#inbody > div > div:nth-child(2) > div:nth-child(2) > div.waku_5 > img"
    );

    // await newPage.waitForTimeout(2000);
    await setTimeout(2000);

    // 新しく開いたページを取得
    let newPageTouroku = await getNewPage(newPage);

    // Promptが出たら必ずOKとする
    newPageTouroku.on('dialog', async dialog => {
        await dialog.accept();
    });

    // 対象日付に画面より渡された日付（yyyymmdd形式）を設定
    const currentYYYYMMDD = req.body.target_yyyymmdd;
    const inYYYY = currentYYYYMMDD.slice(0,4)
    const inMM = currentYYYYMMDD.slice(4, 6)
    const in_DD = currentYYYYMMDD.slice(-2);

    // 開始へ設定する年月
    await newPageTouroku.select('select[name="in_month"]', inYYYY + "-" + inMM);
    await newPageTouroku.select('select[name="in_sday"]', "" + Number(in_DD));
    await newPageTouroku.select('select[name="in_eday"]', "" + Number(in_DD));
    // await newPageTouroku.select('select[name="end_y"]', '2020');
    // await newPageTouroku.select('select[name="end_m"]', '12');

    // 「項目名-全選択」をクリックする
    await newPageTouroku.click(
        "#inbody > table > tbody > tr:nth-child(3) > td.reserve_screen > a:nth-child(2)"
    );
    await newPageTouroku.click(
        "#inbody > table > tbody > tr:nth-child(4) > td.reserve_screen > a:nth-child(2)"
    );

    // 「予約データ」をクリックする
    await newPageTouroku.click(
        "#inbody > p:nth-child(4) > input:nth-child(1)"
    );

    // await newPage.waitForTimeout(2000);
    await setTimeout(2000);

    // 新しく開いたページを取得
    let newPageResult = await getNewPage(newPageTouroku);

    const a_tag = await newPageResult.$('a');
    const hrefs = await newPageResult.$$eval('a', anchors => anchors.map(anchor => anchor.href));
    dlFilename = hrefs[0].split("/").slice(-1);
    if (a_tag) {
        await logger.info(`予約情報をダウンロードしました：${new Date()}`);

        // ダウンロード先の設定
        await page._client.send(
            'Page.setDownloadBehavior',
            { behavior: 'allow', downloadPath: dlpath }
        );
        await a_tag.click();
        // await page.waitForTimeout(10000);
        await setTimeout(10000);

    } else {
        await logger.info(`予約情報がありませんでした：${new Date()}`);
    }

    // await newPage.waitForTimeout(2000);
    await setTimeout(2000);
    await browser.close();

    // テンプレートより新しいワークブック（利用状況表）を作成
    const templatePath = 'public/template/riyoustatus.xlsx';
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);

    // タイトル設定
    const worksheet = workbook.getWorksheet('main');

    const youbi = common.getYoubi(new Date(inYYYY, inMM-1, in_DD))
    worksheet.getCell('A1').value = `${currentYYYYMMDD.slice(0, 4)}年${currentYYYYMMDD.slice(4, 6)}月${currentYYYYMMDD.slice(-2)}日(${youbi}) 会議室予約状況`;
    worksheet.getCell('A41').value = `${currentYYYYMMDD.slice(0, 4)}年${currentYYYYMMDD.slice(4, 6)}月${currentYYYYMMDD.slice(-2)}日(${youbi}) 会議室予約状況`;
    
    // ダウンロードファイルから取得した情報をもとに利用状況表を作成
    // ダウンロードしたファイルを読み込み
    const file = fs.readFileSync(dlpath + "\\" + dlFilename);
    const data = iconv.decode(Buffer.from(file), "Shift_JIS");
    const lines = data.split("\n");

    lines.forEach((line) => {
      let linecontents = line.split(",");

      if (linecontents[0] !== "登録日" && linecontents[0] !== "") {
        
        const roomName = linecontents[4] // 会議室名
        const startTime = linecontents[5].split("～")[0].slice(0,2); // 開始時間
        const endTime = linecontents[5].split("～")[1].slice(0,2); // 終了時間
        const riyoumokuteki = linecontents[13] // 利用目的

        let row
        let startCol
        let endCol
        let targetCell
        // 対象会議室の行数を取得
        row = getRowNumByRoomname(roomName)+1
        startCol = (parseInt(startTime)-9)+3; // 開始時間の列の位置
        endCol = (parseInt(endTime)-10)+3 // 終了時間の列の位置
        for (let i = startCol; endCol >= i; i++) {
          targetCell = r1c1ToA1(row, i);
          worksheet.getCell(targetCell).value = riyoumokuteki;
        }
      }
    });

    // マージ
    // 1ページ目部分
    for (let row = 6; 38 >= row ; row++) {
      rowMergeProc(worksheet, row)
    }
    // 2ページ目部分
    for (let row = 45; 54 >= row ; row++) {
      rowMergeProc(worksheet, row)
    }

    // ファイル名を設定
    const fileName = `riyoustatus_${req.body.target_yyyymmdd}.xlsx`;

    // レスポンスヘッダーを設定
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

    // ファイルをダウンロードさせる
    await workbook.xlsx.write(res);

    res.end();


    /**
     * 新しく開いたページを取得
     * @param {page} page もともと開いていたページ
     * @returns {page} 別タブで開いたページ
     */
    async function getNewPage(page) {
      const pageTarget = await page.target();
      const newTarget = await browser.waitForTarget(
          (target) => target.opener() === pageTarget
      );
      const newPage = await newTarget.page();
      await newPage.waitForSelector("body");
      return newPage;
    }
    /**
     * 会議室名から対象行数を返却する
     * @param {*} roomName 
     * @returns 
     */
    function getRowNumByRoomname(roomName) {
      if (roomName === '会議室500') {
        return 5;
      } else if (roomName === '会議室501') {
        return 7;
      } else if (roomName === '会議室502') {
        return 9;
      } else if (roomName === '会議室503') {
        return 11;
      } else if (roomName === '会議室504') {
        return 13;
      } else if (roomName === '会議室505') {
        return 15;
      } else if (roomName === '会議室506') {
        return 17;
      } else if (roomName === '会議室507') {
        return 19;
      } else if (roomName === '会議室401') {
        return 22;
      } else if (roomName === '会議室402') {
        return 24;
      } else if (roomName === 'ミーティングR001') {
        return 27;
      } else if (roomName === 'ミーティングR002') {
        return 29;
      } else if (roomName === 'ミーティングR003') {
        return 31;
      } else if (roomName === 'ミーティングR004') {
        return 33;
      } else if (roomName === 'ミーティングR005') {
        return 35;
      } else if (roomName === 'プレゼンＲ') {
        return 37;
      } else if (roomName === 'プロジェクトR011') {
        return 45;
      } else if (roomName === 'プロジェクトR012') {
        return 47;
      } else if (roomName === 'プロジェクトR013') {
        return 49;
      } else if (roomName === 'プロジェクトR014') {
        return 51;
      } else if (roomName === 'プロジェクトR015') {
        return 53;
      }
    }

    /**
     * R1C!参照方式をA1参照方式に変換
     */
    function r1c1ToA1(r, c) {
      const columnLetter = (col) => {
          let letter = '';
          while (col > 0) {
              const mod = (col - 1) % 26;
              letter = String.fromCharCode(65 + mod) + letter;
              col = Math.floor((col - mod) / 26);
          }
      return letter;
      };
      return `${columnLetter(c)}${r}`;
    }


    /**
     * 対象シートの対象行において同じ利用者名が設定されているセルをマージする
     * @param {*} worksheet 
     * @param {*} row 
     */
    function rowMergeProc(worksheet, row) {

      let beforeKey = null;
      let key = null;
      let startCell = "";
      let endCell = ""
      let startCell_head = "";
      let endCell_head = ""
  
      // 1行の処理
      startCol = 3
  
      // 9:00（3列目）から22:00（16列目）までのループ
      for (let col = 3; 16 >= col; col++) {

        key = worksheet.getCell(row, col).value
        
        if (beforeKey !== key) {
          if (beforeKey !== null) {

            // マージ
            // 利用者名の上のセル（背景色黒）
            startCell_head = r1c1ToA1(row-1, startCol);
            endCell_head = r1c1ToA1(row-1,col -1);
            worksheet.mergeCells(`${startCell_head}:${endCell_head}`);
            // 利用者名のセル
            startCell = r1c1ToA1(row,startCol);
            endCell = r1c1ToA1(row,col -1);
            worksheet.mergeCells(`${startCell}:${endCell}`);
  
          }
          startCol = col
          beforeKey = key
        }
      }
    }

  })();

  // (async () => {
  //   const target_yyyymmdd = req.body.target_yyyymmdd;

  //   const csv = '';

  //   res.setHeader("Content-disposition", "attachment; filename=yoyakunyukinzumi.csv");
  //   res.setHeader("Content-Type", "text/csv; charset=UTF-8");
  //   res.status(200).send(iconv.encode(csv, "Shift_JIS"));
  // })();
});

module.exports = router;
