const knex = require("../db/knex.js");
const client = knex.connect();

const log4js = require("log4js");
const logger = log4js.configure('./config/log4js-config.json').getLogger();

const findAll = (callback) => {
    (async () => {
        const query = 'SELECT * FROM dispyoyakus ORDER BY time_start, time_end, no_room)';
        await client.raw(query)
            .then((retObj) => {
                callback(null, retObj);
            })
            .catch((err) => {
                callback(err, null);
            })
    })();
};

const insert = (inObj, callback) => {
    (async () => {
        const query = 'insert into dispyoyakus values ("' + inObj.ymd_riyou + '","' + inObj.nm_room + '",' + inObj.no_room + ',"' + inObj.nm_disp + '","' + inObj.time_riyou + '",' + inObj.time_start + ',' + inObj.time_end + ',"' + inObj.nm_riyousha + '")';
        await logger.info('[' + inObj.nm_riyousha + ']' + query);
        await client.raw(query)
            .then((retObj) => {
                callback(null, retObj[0]);
            })
            .catch((err) => {
                callback(err, null);
            })

    })();
}

const deleteAll = (callback) => {
    (async () => {
        const query = 'delete from dispyoyakus;';
        await logger.info(query);
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
    insert,
    deleteAll,
};