const log4js = require("log4js");
const logger = log4js.configure('./config/log4js-config.json').getLogger();

const cron = require('node-cron');
const iconv = require("iconv-lite");
const puppeteer = require("puppeteer");
const fs = require("fs");
const dispyoyaku = require("../model/dispyoyaku");

const url_yoyaku = 'https://www.yamori-yoyaku.jp/studio/OfficeLogin.htm';
const dlpath = 'C:\\download\\dispyoyaku';
const login_id = '';
const login_passwd = '';

// cron設定
const startcron = () => {

    // 会議室　予約情報ダウンロード
    cron.schedule('57 * * * *', () => {

        (async () => {

            const browser = await puppeteer.launch({ headless: false });

            let page = await browser.newPage();

            const URL = url_yoyaku;
            await page.goto(URL, { waitUntil: "domcontentloaded" });

            // ログイン
            await page.type('input[name="in_office"]', login_id);
            await page.type('input[name="in_opassword"]', login_passwd);
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
            let newPage = await getNewPage(page);

            // パスワードの設定
            await newPage.type('input[name="in_managerpassword"]', login_passwd);
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
            let newPageTouroku = await getNewPage(newPage);

            // Promptが出たら必ずOKとする
            newPageTouroku.on('dialog', async dialog => {
                await dialog.accept();
            });

            const currentYYYYMMDD = getCurrentYYYYMMDD();
            const inYYYYMM = currentYYYYMMDD.slice(0, 4) + '-' + currentYYYYMMDD.slice(4, 6)
            const in_DD = currentYYYYMMDD.slice(-2);

            // 開始へ設定する年月
            await newPageTouroku.select('select[name="in_month"]', inYYYYMM);
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

            await newPage.waitForTimeout(2000);

            // 新しく開いたページを取得
            let newPageResult = await getNewPage(newPageTouroku);

            const a_tag = await newPageResult.$('a');
            if (a_tag) {
                await logger.info(`予約情報をダウンロードしました：${new Date()}`);

                // ダウンロード先の設定
                await page._client.send(
                    'Page.setDownloadBehavior',
                    { behavior: 'allow', downloadPath: dlpath }
                );
                await a_tag.click();
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

    // 会議室　利用者情報取込
    cron.schedule('59 * * * *', () => {

        // ダウンロードディレクトリにあるcsvファイルを取得する
        let targetfilename = "";
        fs.readdirSync(dlpath).forEach((filename) => {
            // *mdl.csvのファイルの場合処理をする
            if (filename.slice(-7) === "rdl.csv") {

                dispyoyaku.deleteAll((err, retObj) => {
                    if (err) { throw err };
                    targetfilename = filename;
                    // csvファイルはShift-JISのため
                    const src = fs
                        .createReadStream(dlpath + "\\" + filename)
                        .pipe(iconv.decodeStream("Shift_JIS"));

                    src.on("data", (chunk) => {
                        const lines = chunk.split("\n");
                        lines.forEach((line) => {
                            let linecontents = line.split(",");
                            if ((linecontents[0] !== '登録日') && (linecontents[0] !== '')) {

                                let inObj = {};
                                let no_room = 0;

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
                                    no_room = 401;
                                } else if (linecontents[4] === '会議室402') {
                                    no_room = 402;
                                } else if (linecontents[4] === '会議室500') {
                                    no_room = 500;
                                } else if (linecontents[4] === '会議室501') {
                                    no_room = 501;
                                } else if (linecontents[4] === '会議室502') {
                                    no_room = 502;
                                } else if (linecontents[4] === '会議室503') {
                                    no_room = 503;
                                } else if (linecontents[4] === '会議室504') {
                                    no_room = 504;
                                } else if (linecontents[4] === '会議室505') {
                                    no_room = 505;
                                } else if (linecontents[4] === '会議室506') {
                                    no_room = 506;
                                } else if (linecontents[4] === 'ミーティングR001') {
                                    no_room = 1;
                                } else if (linecontents[4] === 'ミーティングR002') {
                                    no_room = 2;
                                } else if (linecontents[4] === 'ミーティングR003') {
                                    no_room = 3;
                                } else if (linecontents[4] === 'ミーティングR004') {
                                    no_room = 4;
                                } else if (linecontents[4] === 'ミーティングR005') {
                                    no_room = 5;
                                } else if (linecontents[4] === 'プレゼンＲ') {
                                    no_room = 10;
                                } else if (linecontents[4] === 'プロジェクトR011') {
                                    no_room = 11;
                                } else if (linecontents[4] === 'プロジェクトR012') {
                                    no_room = 12;
                                } else if (linecontents[4] === 'プロジェクトR013') {
                                    no_room = 13;
                                } else if (linecontents[4] === 'プロジェクトR014') {
                                    no_room = 14;
                                } else if (linecontents[4] === 'プロジェクトR015') {
                                    no_room = 15;
                                }
                                inObj.no_room = no_room;
                                inObj.nm_disp = linecontents[13];
                                inObj.time_riyou = linecontents[5];
                                inObj.time_start = Number(linecontents[5].slice(0, 2));
                                inObj.time_end = Number(linecontents[5].slice(6, 8));
                                inObj.nm_riyousha = linecontents[7];

                                // ファイル出力 利用日／名称／予約時間／開始時間／終了時間
                                dispyoyaku.insert(inObj, (err, retObj) => {
                                    if (err) { throw err };
                                    logger.info(`登録予約情報：${inObj.ymd_riyou},${inObj.nm_room},${inObj.time_riyou}`);
                                });
                            }
                        });
                    });
                    src.on("end", () => {
                        // 対象ファイルを処理した場合は対象ファイルをリネーム
                        fs.rename(
                            dlpath + "\\" + targetfilename,
                            dlpath + "\\" + targetfilename + ".old",
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

    const getCurrentYYYYMMDD = () => {

        const dt = new Date();
        const curYYYY = dt.getFullYear();
        const curMM = dt.getMonth();
        const curDD = dt.getDate();

        return "" + curYYYY + ("" + "0" + (curMM + 1)).slice(-2) + ("" + "0" + (curDD)).slice(-2);
    }
}

module.exports = {
    startcron,
}
