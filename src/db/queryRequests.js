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

  // Get modules for a category
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

  ///////////////////////////////////////////////////
  //                Discovery runs                 //
  ///////////////////////////////////////////////////

  // Set the discovery run for a single device to 'running' status.
  // Returns existing run ID if it's already running, otherwise creates a new one.
  // (required) $1 = tuya_device_id, $2 = backend_version
  setDeviceDiscoveryRun: `
    WITH existing_run AS (
      SELECT dr.id
      FROM smart_home.device_discovery_runs dr
      JOIN smart_home.devices d 
        ON dr.device_id = d.id
      WHERE d.tuya_device_id = $1 
        AND dr.status = 'running'
      LIMIT 1
    ),
    inserted_run AS (
      INSERT INTO smart_home.device_discovery_runs (device_id, status, backend_version)
      SELECT id, 'running', $2
      FROM smart_home.devices 
      WHERE tuya_device_id = $1 
        AND NOT EXISTS (SELECT 1 FROM existing_run)
      RETURNING id
    )
    SELECT id FROM inserted_run
    UNION ALL
    SELECT id FROM existing_run;
  `,

  // Update the current discovery run for a single device on success.
  // 1. Marks the run as 'completed' and sets the finish time.
  // 2. Upserts all observed DP codes and their sample values into device_observed_dps.
  // 3. Automatically matches and assigns modules from module_discovery_dps 
  //    where ALL required DPs are present in the provided list.
  // 4. Updates or creates assignments in device_module_assignments with the current run ID.
  // (required) $1 = discovery run ID, $2 = observed dps (int array), 
  // $3 = backend_version (string)
  updateDeviceDiscoveryRun: `
    WITH updated_run AS (
      UPDATE smart_home.device_discovery_runs 
      SET 
        status = 'completed',
        finished_at = now(),
        backend_version = $3
      WHERE id = $1
      RETURNING 
        id,
        device_id,
        (SELECT category_id FROM smart_home.devices WHERE id = device_id) AS dev_cat_id
    ),
    upsert_dps AS (
      INSERT INTO smart_home.device_observed_dps (
        device_id, 
        dp_code, 
        last_seen_at, 
        last_discovery_run_id
      )
      SELECT 
        ur.device_id,
        unnest($2::int[]),
        now(),
        ur.id
      FROM updated_run ur
      ON CONFLICT (device_id, dp_code)
      DO UPDATE SET
        last_discovery_run_id = EXCLUDED.last_discovery_run_id,
        last_seen_at = now()
    ),
    matched_modules AS (
      WITH all_matches AS (
        SELECT
          ur.device_id,
          ur.id AS run_id,
          m.id AS module_id,
          m.code AS module_code,
          m.surface,
          m.priority
        FROM smart_home.modules m
        JOIN smart_home.module_discovery_dps dps
          ON m.id = dps.module_id
        JOIN updated_run ur
          ON m.category_id = ur.dev_cat_id
        WHERE m.is_active = true
        GROUP BY ur.device_id, ur.id, m.id, m.code, m.surface, m.priority
        HAVING array_agg(dps.dp_code ORDER BY dps.dp_code)::int[] <@ $2::int[]
      )
      SELECT DISTINCT ON (surface)
        device_id,
        run_id,
        module_id,
        module_code,
        surface,
        priority
      FROM all_matches
      ORDER BY surface, priority DESC, module_id DESC
    ),
    deactivate_old_assignments AS (
      UPDATE smart_home.device_module_assignments dma
      SET
        is_active = false,
        last_verified_at = now()
      FROM updated_run ur
      WHERE dma.device_id = ur.device_id
        AND dma.is_active = true
      RETURNING dma.id
    ),
    upsert_winners AS (
      INSERT INTO smart_home.device_module_assignments (
        device_id,
        module_id,
        discovery_run_id,
        assignment_source,
        is_active,
        last_verified_at
      )
      SELECT
        mm.device_id,
        mm.module_id,
        mm.run_id,
        'auto',
        true,
        now()
      FROM matched_modules mm
      ON CONFLICT (device_id, module_id)
      DO UPDATE SET
        discovery_run_id = EXCLUDED.discovery_run_id,
        assignment_source = EXCLUDED.assignment_source,
        is_active = true,
        last_verified_at = EXCLUDED.last_verified_at
      RETURNING device_id, module_id
    )
    SELECT
      mm.module_id,
      mm.module_code,
      mm.surface
    FROM matched_modules mm
    ORDER BY mm.surface;
  `,

  // Update the current discovery run for a single device
  // on error and mark as failed.
  // (required) $1 = id, $2 = error text
  updateDeviceDiscoveryRun_failed: `
    UPDATE smart_home.device_discovery_runs 
    SET
      status = 'failed', 
      error_text = $2, 
      finished_at = now()
    WHERE id = $1
  `,

  // Get active modules and their aggregated capabilities for a specific device.
  // Grouped by surface/module to provide a structured map of DP codes.
  // (required) $1 = tuya_device_id.
  getDeviceActiveSurfaces: `
    SELECT
      m.surface,
      m.id AS module_id,
      m.code AS module_code,
      m.priority AS module_priority,
      jsonb_object_agg(
        c.code,
        jsonb_build_object(
          'dp_code', mp.dp_code,
          'semantic_type', c.semantic_type,
          'transport_type', mp.transport_type,
          'constraints', mp.constraints_jsonb
        )
        ORDER BY c.code
      ) AS capabilities
    FROM smart_home.devices d
    JOIN smart_home.device_module_assignments dma
      ON dma.device_id = d.id
      AND dma.is_active = true
    JOIN smart_home.modules m
      ON m.id = dma.module_id
    JOIN smart_home.module_capabilities mp
      ON mp.module_id = m.id
    JOIN smart_home.capabilities c
      ON c.id = mp.capability_id
    WHERE d.tuya_device_id = $1
    GROUP BY
      m.surface, 
      m.id, 
      m.code, 
      m.priority;
  `, 
});

module.exports = queryRequests;