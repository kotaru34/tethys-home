const { Pool } = require('pg');
const env = require('../config/env');

const pool = new Pool({
  host: env.pg.host,
  port: env.pg.port,
  user: env.pg.user,
  password: env.pg.password,
  database: env.pg.database,
});

module.exports = pool;