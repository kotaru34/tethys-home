const sql = require('../../db/queryRequests');
const pool = require('../../db/pool');

class CatalogRepository {
  async getModules(category) {
    const { rows } = await pool.query(sql.getCategoryModules, [category]);
    return rows;
  }

  async getDiscoveryDps(category) {
    const { rows } = await pool.query(sql.getCategoryDiscoveryDps, [category]);
    return rows;
  }
}

module.exports = CatalogRepository;