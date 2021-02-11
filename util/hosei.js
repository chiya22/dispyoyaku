const datadir = './data';
const fs = require('fs');
const cm = require('./common');
const master = require('./master');

/*
一覧を取得する
*/
const getHoseiList = function (procKubun) {

    let hoseidatadir;
    if (procKubun === 'wait') {
        hoseidatadir = `${datadir}/hosei/list.dat`;
    } else {
        hoseidatadir = `${datadir}/hoseizumi/list.dat`;
    }

    let filecontent = fs.readFileSync(hoseidatadir, 'utf-8');
    const hoseilist = filecontent.split('\n');
    let hoseiinfolist = [];
    hoseilist.forEach((linedate) => {
        if (linedate !== '') {
            let info = {};
            let array = linedate.split(',');
            info.date = array[0]
            info.dispdate = array[0].slice(0, 4) + '/' + array[0].slice(4, 6) + '/' + array[0].slice(6, 8);
            info.id = array[1];
            info.name = master.getUser(array[1]).name;
            info.targetdate = array[2];
            info.disptargetdate = array[2].slice(0, 4) + '/' + array[2].slice(4, 6) + '/' + array[2].slice(6, 8);
            info.content = array[3];
            info.updateid = array[4];
            info.updatename = master.getUser(array[4]).name;
            info.status = array[5];
            info.dispstatus = (array[5] === 'wait' ? '未処理' : '完了')
            hoseiinfolist.push(info);
        }
    });
    return hoseiinfolist;
}

const addHosei = function (inObj) {
    let date = new Date();
    const yyyymm = date.getFullYear() + ("0" + (date.getMonth() + 1)).slice(-2) + ("0" + date.getDate()).slice(-2);
    let indata = yyyymm + ',' + inObj.id + ',' + inObj.targetdate + ',' + inObj.content + ',,wait\n';
    const indatadir = `${datadir}/hosei/list.dat`;
    try {
        fs.statSync(indatadir);
    } catch (err) {
        if (err.code === "ENOENT") {
            fs.writeFileSync(indatadir, indata, 'utf-8');
        } else {
            throw err;
        }
    }
    let filecontent = fs.readFileSync(indatadir, 'utf-8');
    fs.writeFileSync(indatadir, indata, 'utf-8');
    fs.appendFileSync(indatadir, filecontent, 'utf-8');
};

module.exports = {
    getHoseiList,
    addHosei,
};