const sql = require('../../db/queryRequests');
const pool = require('../../db/pool');
const { version } = require('../../../package.json');

class CatalogRepository {
  async getModules(category) {
    const { rows } = await pool.query(sql.getModules, [category]);
    return rows;
  }

  async setDeviceDiscoveryRun(tuya_device_id) {
    const id = await pool.query(sql.setDeviceDiscoveryRun, [tuya_device_id, version]);
    return id.rows[0].id;
  }

  async updateDeviceDiscoveryRun(runId, codes) {
    const { rows } = await pool.query(sql.updateDeviceDiscoveryRun, [runId, codes, version]);
    return rows;
  }

  async updateDeviceDiscoveryRun_failed(runId, error) {
    await pool.query(sql.updateDeviceDiscoveryRun_failed, [runId, error]);
  }

  async getDeviceActiveSurfaces(tuya_device_id) {
    const { rows } = await pool.query(sql.getDeviceActiveSurfaces, [tuya_device_id]);
    return rows;
  }
}

module.exports = CatalogRepository;