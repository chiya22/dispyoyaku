const Knex = require("knex");

const connect = () => {
    const config = {
        host: '',
        user: '',
        password: '',
        database: '',
        // database: 'pfs',
        // port: 58020,
    };

    const knex = Knex({
        client: "mysql",
        connection: config,
    });
    knex.client.pool.max = 5;
    knex.client.pool.min = 5;
    knex.client.pool.createTimeoutMillis = 30000; // 30 seconds
    knex.client.pool.idleTimeoutMillis = 600000; // 10 minutes
    knex.client.pool.createRetryIntervalMillis = 200; // 0.2 seconds
    knex.client.pool.acquireTimeoutMillis = 600000; // 10 minutes
    return knex;
};

module.exports = {
    connect: connect,
}