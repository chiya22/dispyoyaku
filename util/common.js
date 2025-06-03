/*
日付をもとに、日付＋曜日の文字列を返却する
yyyy年mm月dd日(曜日)
*/
const getYmdyoubi = (date) => {

    const ymd = `${date.getFullYear()}年${(`0${date.getMonth() + 1}`).slice(-2)}月${(`0${date.getDate()}`).slice(-2)}日`;
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

module.exports = {
    getYmdyoubi,
    getYoubi,
};
