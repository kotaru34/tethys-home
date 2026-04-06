const sql = require('../../db/queryRequests');
const pool = require('../../db/pool');

class CatalogRepository {
  async getModules(category) {
    const { rows } = await pool.query(sql.getModules, [category]);
    return rows;
  }

  async getModulesDiscoveryDps(category) {
    const { rows } = await pool.query(sql.getModulesDiscoveryDps, [category]);
    return rows;
  }

  async getModulesCapabilities(codes, category) {
    const { rows } = await pool.query(sql.getModulesCapabilities, [codes, category])
    return rows;
  }
}

module.exports = CatalogRepository;