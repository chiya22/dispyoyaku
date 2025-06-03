const log4js = require("log4js");
const logger = log4js.configure("./config/log4js-config.json").getLogger();

const nodemailer = require('nodemailer');

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

/**
 * 対象予約情報を当日予約情報としてメールで通知する
 * @param {*} inObj 予約情報
 */
const sendMail = async (inObj)=> {

  let mailbody = "以下の予約が本日登録されました。確認してください！\r\n"
  mailbody += `利用日：${inObj.ymd_riyou}\r\n`
  mailbody += `部屋名：${inObj.nm_room}\r\n`
  mailbody += `表示名：${inObj.nm_disp}\r\n`
  mailbody += `利用時間：${inObj.time_riyou}\r\n`
  mailbody += `利用者名：${inObj.nm_riyousha}\r\n`

  send(`${inObj.nm_room} ${inObj.time_riyou} ${inObj.nm_riyousha}`,mailbody);
  await logger.info(`通知メール送信：${inObj.nm_room} ${inObj.time_riyou} ${inObj.nm_riyousha}`);
  
};

/**
 * メール送信を行う
 * 
 * @param {*} title メールタイトル
 * @param {*} content メール本文
 */
const send = (title, content) => {

  // ▼XServer送信用
  const smtpConfig = {
    host: process.env.XSERVER_HOST_NAME,
    port: '465',
    secure: true,
    auth: {
        user: process.env.XSERVER_USER_NAME,
        pass: process.env.XSERVER_PASSWORD,
    }
  };

  const transporter = nodemailer.createTransport(smtpConfig);

  // メール情報
  const message = {
    from: process.env.MAIL_FROM,
    to: process.env.MAIL_TO,
    subject: `${process.env.MAIL_TITLE}${title}`,
    text: content,
  };
  // メール送信
  transporter.sendMail(message, (err, _res) => {
      if (err) {
        logger.info(`[err: ${title}]${err}`);
      } else {
        logger.info(`send mail to ${title}`);
      }
  });
};

module.exports = {
  sendMail
};
