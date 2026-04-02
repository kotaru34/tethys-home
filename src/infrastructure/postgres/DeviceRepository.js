const sql = require('../../db/queryRequests');
const pool = require('../../db/pool');

class DeviceRepository {
  async findActiveDevicesForRuntime() {
    const { rows } = await pool.query(sql.findActiveDevicesForRuntime);

    return rows.map((row) => ({
      device_pk: row.device_pk,
      id: row.id,
      name: row.name,
      category: row.category,
      product_name: row.product_name,
      version: row.version,
      key: row.local_key,
      ip: row.ip,
    }));
  }
}

module.exports = DeviceRepository;