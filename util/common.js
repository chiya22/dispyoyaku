const fs = require('fs');

/*
日付をもとに、日付＋曜日の文字列を返却する
yyyy年mm月dd日(曜日)
*/
const getYmdyoubi = function (date) {

    const ymd = date.getFullYear() + "年" + ("0" + (date.getMonth() + 1)).slice(-2) + "月" + ("0" + date.getDate()).slice(-2) + "日";
    const youbi = getYoubi(date);
    return `${ymd}(${youbi})`;
};
/*
日付をもとに、曜日を返却する
*/
const getYoubi = (date) => {

    const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
    return weekdays[date.getDay()];

};

/**
 * 日付をもとにDate型
 */
createDate = (year, month, day) => {
    // JavaScriptのDateオブジェクトは月が0から始まるため、月から1を引く
    return new Date(year, month - 1, day);
  }

module.exports = {
    getYmdyoubi,
    getYoubi,
};
