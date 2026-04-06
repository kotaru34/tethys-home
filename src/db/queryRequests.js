const queryRequests = Object.freeze({
  // Well, pretty self-explanatory
  findActiveDevicesForRuntime: `
      SELECT
        d.id AS device_pk,
        d.tuya_device_id AS id,
        d.name,
        dcat.code AS category,
        d.product_name_snapshot AS product_name,
        d.protocol_version AS version,
        d.ip_address AS ip,
        dcred.local_key_ciphertext AS local_key
      FROM smart_home.devices d
      JOIN smart_home.device_categories dcat
        ON dcat.id = d.category_id
      LEFT JOIN smart_home.device_credentials dcred
        ON dcred.device_id = d.id
      WHERE d.is_active = true
      ORDER BY d.id;
    `,

    // get modules for a category
    // (required) $1 = category code (cz, dj, ...)
    getModules: `
      SELECT
        m.id AS module_id,
        m.code AS module_code,
        m.description,
        m.priority
      FROM smart_home.modules m
      JOIN smart_home.device_categories dcat
        ON dcat.id = m.category_id
      WHERE dcat.code = $1 AND m.is_active = true;
    `,

    // get all discovery codes each module of device category
    // (required) $1 = category code (cz, dj, ...)
    getModulesDiscoveryDps: `
      SELECT
        m.id AS module_id,
        m.code AS module_code,
        m.surface AS module_surface,
        m.priority AS module_priority,
        json_agg(mdd.dp_code) AS dp_codes
      FROM smart_home.module_discovery_dps mdd
      JOIN smart_home.modules m
        ON mdd.module_id = m.id
      JOIN smart_home.device_categories dcat
        ON m.category_id = dcat.id
      WHERE dcat.code = $1
      GROUP BY m.id, m.code;
    `,
    
    // get capabilities for each listed module (many) by their code and category to avoid
    // duplicates from categories where device don't belong
    // (required) $1 = list of modules ('rgb', 'cct_lamp', ...), $2 = category code (cz, 
    // dj, ...)
    getModulesCapabilities: `
      SELECT
        m.code AS module_code,
        json_agg(c.code) AS capabilities
      FROM smart_home.modules m
      JOIN smart_home.module_capabilities mc
        ON mc.module_id = m.id
      JOIN smart_home.capabilities c
        ON mc.capability_id = c.id
      JOIN smart_home.device_categories dc
        ON dc.id = m.category_id
      WHERE m.code = ANY($1) 
        AND dc.code = $2
      GROUP BY m.code;
    `,
});

module.exports = queryRequests;