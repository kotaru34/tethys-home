const pool = require('../../db/pool');

class DeviceRepository {
  async findActiveDevicesForRuntime() {
    const query = `
      SELECT
        d.id AS device_pk,
        d.tuya_device_id AS id,
        d.name,
        dc.code AS category,
        d.product_name_snapshot AS product_name,
        d.protocol_version AS version,
        d.ip_address AS ip,
        cred.local_key_ciphertext AS local_key
      FROM smart_home.devices d
      JOIN smart_home.device_categories dc
        ON dc.id = d.category_id
      LEFT JOIN smart_home.device_credentials cred
        ON cred.device_id = d.id
      WHERE d.is_active = true
      ORDER BY d.id;
    `;

    const { rows } = await pool.query(query);

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