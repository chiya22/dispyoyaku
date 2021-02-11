const fs = require('fs');

/*
日付をもとに、日付＋曜日の文字列を返却する
yyyy/mm/dd(曜日)
*/
const getYmdyoubi = function (date) {

    const ymd = date.getFullYear() + "/" + ("0" + (date.getMonth() + 1)).slice(-2) + "/" + ("0" + date.getDate()).slice(-2);

    const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
    const youbi = getYoubi(date);

    return `${ymd}(${youbi})`;
};
/*
日付をもとに、曜日を返却する
*/
const getYoubi = function (date) {

    const ymd = date.getFullYear() + ("0" + (date.getMonth() + 1)).slice(-2) + ("0" + date.getDate()).slice(-2);
    const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
    let youbi = weekdays[date.getDay()];
    try {
        //祝日カレンダー
        let filecontent = fs.readFileSync('./data/master/holiday.dat', 'utf-8');
        const holidaylist = filecontent.split('\n');
        holidaylist.forEach((holiday) => {
            if (holiday === ymd) {
                youbi = '祝';
                return;
            }
        });
    } catch {
        throw err;
    }
    return youbi;
};
/*
日付（yyyymmdd形式）をもとに平日、祝日を判定する
true：平日
false：土日祝
*/
const isWeekDay = function (yyyymmdd) {
    const aaa = yyyymmdd.slice(0,4) + "/" + yyyymmdd.slice(4, 6) + "/" + yyyymmdd.slice(6, 8);
    let date = new Date(yyyymmdd.slice(0,4) + "/" + yyyymmdd.slice(4, 6) + "/" + yyyymmdd.slice(6, 8));
    const youbi = getYoubi(date);
    if ((youbi === '祝') || (youbi === '日') || (youbi === '土')) {
        return false;
    } else {
        return true;
    }
};

/*
日付（yyyy/mm/dd形式）で、その日付が対象となる給与支給対象年月を返却する
 1-15：当月
 16-月末：翌月
*/
const getTargetYYYYMM = function (yyyy_mm_dd) {

    const datearray = yyyy_mm_dd.split('/');
    let yyyy = Number(datearray[0]);
    let mm = Number(datearray[1]);
    let dd = Number(datearray[2]);

    // 15日締めのため
    // 01-15日⇒現在の月のファイルへ出力
    // 16-31日⇒現在の次の月のファイルへ出力
    if (dd >= 16) {
        if (mm === 12) {
            mm = 1
        } else {
            mm = mm + 1
        }
    }
    return "" + yyyy + ("0" + mm).slice(-2);
};

/*
引数で指定されたディレクトリに存在しているファイルリストを返却する
*/
const readDirSync = (folderPath) => {
    const result = fs.readdirSync(folderPath);
    return result.map((itemName) => {
        return itemName.slice(0, 4) + "/" + itemName.slice(-2);
    });
};

/*
引数で指定されたディレクトリ、指定されたユーザID、指定された日付をもとに、
初期ファイルを作成する
*/
const createInitailFile = function (datadir, id, yyyy_mm_dd) {

    const yyyymm = getTargetYYYYMM(yyyy_mm_dd)

    try {
        fs.statSync(datadir + "/" + id + "/" + yyyymm);
    } catch (err) {
        if (err.code === "ENOENT") {

            const yyyymm = getTargetYYYYMM(yyyy_mm_dd)
            let date = new Date(yyyymm.slice(0, 4) + "/" + yyyymm.slice(-2) + "/01");

            const afterstartday = 1;
            const afterendday = 15;
            const aftermonth = ("0" + (date.getMonth() + 1)).slice(-2);
            const afteryear = date.getFullYear();

            const beforestartday = 16;
            date.setDate(date.getDate() - 1);
            const beforeendday = date.getDate();
            const beforemonth = ("0" + (date.getMonth() + 1)).slice(-2);
            const beforeyear = date.getFullYear();

            let linedata = '';
            for (let i = beforestartday; i <= beforeendday; i++) {
                linedata += beforeyear + beforemonth + ("0" + i).slice(-2) + ",,,,,,off,off,\n";
            }
            for (let i = afterstartday; i <= afterendday; i++) {
                linedata += afteryear + aftermonth + ("0" + i).slice(-2) + ",,,,,,off,off,\n";
            }

            try {
                fs.writeFileSync(datadir + "/" + id + "/" + yyyymm, linedata);
            } catch {
                throw new Error("初期ファイル作成時にエラーが発生しました。");
            }

        } else {
            throw err;
        };
    };
};

/*
引数で渡された出勤時間（hh:mm形式）、退勤時間（hh:mm形式）、平日休日区分（true：休日、false：平日）、休憩時間（hh:mm形式）をもとに、
支給時間を算出し返却する

※休憩時間は引数で設定されている場合は、その値を優先的に使用する
　引数で設定されていない場合は、ルールに従って設定される

*/
const getPaytime = function (starttime, endtime, resttime) {

    const starthh = parseInt(starttime.split(':')[0]);
    const startmm = parseInt(starttime.split(':')[1]);
    const endhh = parseInt(endtime.split(':')[0]);
    const endmm = parseInt(endtime.split(':')[1]);

    //starttimeとendtimeの大小比較
    let calcstarttime = (starthh * 60) + startmm;
    let calcendtime = (endhh * 60) + endmm;
    if (calcendtime < calcstarttime) {
        return false;
    }

    let calcresttime = 0;
    if (resttime) {
        const resthh = parseInt(resttime.split(':')[0]);
        const restmm = parseInt(resttime.split(':')[1]);
        calcresttime = (resthh * 60) + restmm;
    }

    let paytime = 0;
    paytime = (calcendtime - calcstarttime - calcresttime);
    //15分単位で区切る
    paytime = paytime - (paytime % 15);
    const payhh = ('0' + parseInt(paytime / 60, 10)).slice(-2);
    const paymm = ('0' + (paytime % 60)).slice(-2);
    return payhh + ":" + paymm;
};

/*
引数で渡された出勤時間、退勤時間、出勤時間修正、退勤時間修正（hh:mm形式）をもとに
有効な出勤時間、退勤時間を返却する
優先度）
出勤時間＜出勤時間修正
退勤時間＜退勤時間修正
*/
const getStartEndTime = function (starttime, endtime, startupdtime, endupdtime) {

    let stime = starttime;
    let etime = endtime;
    if (startupdtime) {
        stime = startupdtime;
    };
    if (endupdtime) {
        etime = endupdtime;
    };
    return {
        starttime: stime,
        endtime: etime,
    };
};

module.exports = {
    getYmdyoubi,
    getYoubi,
    getTargetYYYYMM,
    readDirSync,
    createInitailFile,
    getPaytime,
    getStartEndTime,
    isWeekDay,
};
