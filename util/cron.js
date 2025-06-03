const log4js = require("log4js");
const logger = log4js.configure('./config/log4js-config.json').getLogger();

const cron = require('node-cron');
const iconv = require("iconv-lite");
const puppeteer = require("puppeteer");
const fs = require("node:fs");
const dispyoyaku = require("../model/dispyoyaku.js");
const mailzumi = require("../model/mailzumi.js");
const mailsend = require("./mailsend.js");

const dlpath = 'C:\\download\\dispyoyaku';

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

// cron設定
const startcron = () => {

    // 会議室　予約情報ダウンロード
    cron.schedule(process.env.CRON_YOYAKUDL, () => {

        (async () => {

            const browser = await puppeteer.launch({ headless: true,args: [
                '--disable-gpu',
                '--disable-dev-shm-usage',
                '--disable-setuid-sandbox',
                '--no-first-run',
                '--no-sandbox',
                '--no-zygote',
                '--single-process'
              ]
            });

            const page = await browser.newPage();

            const url = process.env.YOYAKU_URL;
            await page.goto(url, { waitUntil: "domcontentloaded" });

            // ログイン
            await page.type('input[name="in_office"]', process.env.YOYAKU_LOGIN_ID);
            await page.type('input[name="in_opassword"]', process.env.YOYAKU_LOGIN_PASSWORD);
            await page.click(
                "body > table > tbody > tr > td > table > tbody > tr:nth-child(1) > td > form > table:nth-child(2) > tbody > tr > td:nth-child(2) > input"
            );

            await page.waitForTimeout(1000);
            // await page.waitForNavigation({waitUntil: 'domcontentloaded'});

            // 管理画面から「管理者メニュー」をクリック
            const menu = await page.$(
                "body > table > tbody > tr > td > table > tbody > tr > td > table:nth-child(2) > tbody > tr:nth-child(3) > td:nth-child(2) > input[type=image]:nth-child(6)"
            );
            await menu.click();

            await page.waitForTimeout(2000);

            // 新しく開いたページを取得
            const newPage = await getNewPage(page);

            // パスワードの設定
            await newPage.type('input[name="in_managerpassword"]', process.env.YOYAKU_LOGIN_PASSWORD);
            const inputElement = await newPage.$("input[type=submit]");
            await inputElement.click();

            await newPage.waitForTimeout(2000);

            // 「ダウンロード」のクリック
            await newPage.click(
                "body > div:nth-child(3) > table > tbody > tr > th:nth-child(6) > img"
            );

            await newPage.waitForTimeout(2000);

            // 「予約情報ダウンロード」のクリック
            await newPage.click(
                "#inbody > div > div:nth-child(2) > div:nth-child(2) > div.waku_5 > img"
            );

            await newPage.waitForTimeout(2000);

            // 新しく開いたページを取得
            const newPageTouroku = await getNewPage(newPage);

            // Promptが出たら必ずOKとする
            newPageTouroku.on('dialog', async dialog => {
                await dialog.accept();
            });

            const currentYyyymmdd = getCurrentYyyymmdd();
            const inYyyymm = `${currentYyyymmdd.slice(0, 4)}-${currentYyyymmdd.slice(4, 6)}`
            const inDd = currentYyyymmdd.slice(-2);

            // 開始へ設定する年月
            await newPageTouroku.select('select[name="in_month"]', inYyyymm);
            await newPageTouroku.select('select[name="in_sday"]', `${Number(inDd)}`);
            await newPageTouroku.select('select[name="in_eday"]', `${Number(inDd)}`);
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

            await newPage.waitForTimeout(2000);

            // 新しく開いたページを取得
            const newPageResult = await getNewPage(newPageTouroku);

            const aTag = await newPageResult.$('a');
            if (aTag) {
                await logger.info(`予約情報をダウンロードしました：${new Date()}`);

                // ダウンロード先の設定
                await page._client.send(
                    'Page.setDownloadBehavior',
                    { behavior: 'allow', downloadPath: dlpath }
                );
                await aTag.click();
                await page.waitForTimeout(10000);

            } else {
                await logger.info(`予約情報がありませんでした：${new Date()}`);
            }

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

            await browser.close();

        })();
    })

    // 会議室　予約情報取込
    cron.schedule(process.env.CRON_TORIKOMI, () => {

        // ダウンロードディレクトリにあるcsvファイルを取得する
        let targetfilename = "";
        // biome-ignore lint/complexity/noForEach: <explanation>
        fs.readdirSync(dlpath).forEach((filename) => {
            // *mdl.csvのファイルの場合処理をする
            if (filename.slice(-7) === "rdl.csv") {

                dispyoyaku.deleteAll((err) => {
                    if (err) { throw err };
                    targetfilename = filename;
                    // csvファイルはShift-JISのため
                    const src = fs
                        .createReadStream(`${dlpath}\\${filename}`)
                        .pipe(iconv.decodeStream("Shift_JIS"));

                    src.on("data", (chunk) => {
                        const lines = chunk.split("\n");
                        // biome-ignore lint/complexity/noForEach: <explanation>
                        lines.forEach((line) => {
                            const linecontents = line.split(",");
                            if ((linecontents[0] !== '登録日') && (linecontents[0] !== '')) {

                                const inObj = {};
                                let noRoom = 0;

                                // linecontentsの項目
                                // 00:登録日
                                // 01:利用日
                                // 02:変更日
                                // 03:施設名
                                // 04:名称
                                // 05:予約時間
                                // 06:施設管理番号
                                // 07:利用者
                                // 08:ひらがな
                                // 09:郵便番号
                                // 10:住所
                                // 11:E-Mail
                                // 12:電話番号
                                // 13:利用目的
                                // 14:受付者
                                // 15:利用人数
                                // 16:利用料金
                                // 17:施設特記事項

                                inObj.ymd_riyou = linecontents[1].replace(/-/g, '');;
                                inObj.nm_room = linecontents[4];
                                // 部屋番号を設定
                                if (linecontents[4] === '会議室401') {
                                    noRoom = 401;
                                }
                                if (linecontents[4] === '会議室402') {
                                    noRoom = 402;
                                }
                                if (linecontents[4] === '会議室500') {
                                    noRoom = 500;
                                }
                                if (linecontents[4] === '会議室501') {
                                    noRoom = 501;
                                }
                                if (linecontents[4] === '会議室502') {
                                    noRoom = 502;
                                }
                                if (linecontents[4] === '会議室503') {
                                    noRoom = 503;
                                }
                                if (linecontents[4] === '会議室504') {
                                    noRoom = 504;
                                }
                                if (linecontents[4] === '会議室505') {
                                    noRoom = 505;
                                }
                                if (linecontents[4] === '会議室506') {
                                    noRoom = 506;
                                }
                                if (linecontents[4] === '会議室507') {
                                    noRoom = 507;
                                }
                                if (linecontents[4] === 'ミーティングR001') {
                                    noRoom = 1;
                                }
                                if (linecontents[4] === 'ミーティングR002') {
                                    noRoom = 2;
                                }
                                if (linecontents[4] === 'ミーティングR003') {
                                    noRoom = 3;
                                }
                                if (linecontents[4] === 'ミーティングR004') {
                                    noRoom = 4;
                                }
                                if (linecontents[4] === 'ミーティングR005') {
                                    noRoom = 5;
                                }
                                if (linecontents[4] === 'プレゼンＲ') {
                                    noRoom = 10;
                                }
                                if (linecontents[4] === 'プロジェクトR011') {
                                    noRoom = 11;
                                }
                                if (linecontents[4] === 'プロジェクトR012') {
                                    noRoom = 12;
                                }
                                if (linecontents[4] === 'プロジェクトR013') {
                                    noRoom = 13;
                                }
                                if (linecontents[4] === 'プロジェクトR014') {
                                    noRoom = 14;
                                }
                                if (linecontents[4] === 'プロジェクトR015') {
                                    noRoom = 15;
                                }
                                inObj.no_room = noRoom;
                                inObj.nm_disp = linecontents[13];
                                inObj.time_riyou = linecontents[5];
                                inObj.time_start = Number(linecontents[5].slice(0, 2));
                                inObj.time_end = Number(linecontents[5].slice(6, 8));
                                inObj.nm_riyousha = linecontents[7];

                                // ファイル出力 利用日／名称／予約時間／開始時間／終了時間
                                if (inObj.no_room !== '会議室401') {
                                    dispyoyaku.insert(inObj, (err) => {
                                        if (err) { throw err };
                                        logger.info(`登録予約情報：${inObj.ymd_riyou},${inObj.nm_room},${inObj.time_riyou}`);
                                    });
                                }

                                // 当日予約（登録日＝利用日）の場合
                                if (linecontents[0] === linecontents[1]) {
                                    mailzumi.findOne(inObj, (err, retObj) => {
                                        if (err) { throw err };
                                        if (retObj[0].cnt === 0) {
                                            // メール送信
                                            mailsend.sendMail(inObj);
                                            // メール送信済みへレコード追加
                                            mailzumi.insert(inObj, (err) => {
                                                if (err) { throw err };
                                                logger.info(`メール送信済み予約情報：${inObj.ymd_riyou},${inObj.nm_room},${inObj.time_riyou}`);
                                            });
                                        }
                                    });
                                }
                            }
                        });
                    });
                    src.on("end", () => {
                        // 対象ファイルを処理した場合は対象ファイルをリネーム
                        fs.rename(
                            `${dlpath}\\${targetfilename}`,
                            `${dlpath}\\${targetfilename}.old`,
                            (err) => {
                                if (err) {
                                    logger.info(`${targetfilename}ファイルは存在しません：${new Date()}`);
                                    throw err;
                                }
                            }
                        );
                    });
                });
            }
        });
    });

    const getCurrentYyyymmdd = () => {

        const dt = new Date();
        const curYyyy = dt.getFullYear();
        const curMm = dt.getMonth();
        const curDd = dt.getDate();

        return `${curYyyy}${(`0${curMm + 1}`).slice(-2)}${(`0${curDd}`).slice(-2)}`;
    }
}

module.exports = {
    startcron,
}
