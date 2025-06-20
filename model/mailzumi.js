const knex = require("../db/knex.js");
const client = knex.connect();

const log4js = require("log4js");
const logger = log4js.configure('./config/log4js-config.json').getLogger();

const findAll = (callback) => {
    (async () => {
        const query = 'SELECT * FROM mailzumis ORDER BY time_start, no_room, time_end)';
        await client.raw(query)
            .then((retObj) => {
                callback(null, retObj);
            })
            .catch((err) => {
                callback(err, null);
            })
    })();
};

const findOne= ( inObj, callback) => {
    (async () => {
        const query = `SELECT count(*) as cnt from mailzumis where ymd_riyou = "${inObj.ymd_riyou}" and nm_room = "${inObj.nm_room}" and no_room = ${inObj.no_room} and time_riyou = "${inObj.time_riyou}" and time_start = ${inObj.time_start} and time_end = ${inObj.time_end} and nm_riyousha = "${inObj.nm_riyousha}"`;
        // await logger.info(`${query}`);
        await client.raw(query)
            .then((retObj) => {
                callback(null, retObj[0]);
            })
            .catch((err) => {
                callback(err, null);
            })
    })();
};

const insert = (inObj, callback) => {
    (async () => {
        const query = `insert into mailzumis values ("${inObj.ymd_riyou}","${inObj.nm_room}",${inObj.no_room},"${inObj.nm_disp}","${inObj.time_riyou}",${inObj.time_start},${inObj.time_end},"${inObj.nm_riyousha}")`;
        await logger.info(`[${inObj.nm_riyousha}]${query}`);
        await client.raw(query)
            .then((retObj) => {
                callback(null, retObj[0]);
            })
            .catch((err) => {
                callback(err, null);
            })

    })();
}

module.exports = {
    findAll,
    findOne,
    insert,
};