class CapabilityResolver {
  resolve(device, surface, capabilityCode) {
    if (!device.activeSurfaces || !Object.keys(device.activeSurfaces).length)
      throw new Error('DEVICE_NOT_DISCOVERED');

    const surfaceModel = device.activeSurfaces[surface];
    if (!surfaceModel) throw new Error('SURFACE_NOT_FOUND');

    const capability = surfaceModel.capabilities[capabilityCode];
    if (!capability) throw new Error('CAPABILITY_NOT_FOUND');
    else {
      return {
        surface,
        module_code: surfaceModel.module_code,
        module_id: surfaceModel.module_id,
        capability_code: capabilityCode,
        dp_code: capability.dp_code,
        semantic_type: capability.semantic_type,
        transport_type: capability.transport_type,
        parser_code: capability.parser_code,
        constraints: capability.constraints || {}
      };
    }
  }
}

module.exports = CapabilityResolver;