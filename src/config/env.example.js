const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

function getEnv(name, fallback = undefined) {
  return process.env[name] ?? fallback;
}

module.exports = {
  port: Number(getEnv('PORT', 3000)),
  pg: {
    host: getEnv('PGHOST', '127.0.0.1'),
    port: Number(getEnv('PGPORT', 5432)),
    user: getEnv('PGUSER', 'postgres'),
    password: getEnv('PGPASSWORD', 'postgres'),
    database: getEnv('PGDATABASE', 'smart_home'),
  },
};