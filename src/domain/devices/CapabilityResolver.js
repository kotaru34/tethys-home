const validateCapabilityValue = require('./validateCapabilityValue');

class CapabilityResolver {
  resolve(device, surface, capabilityCode, value = null) {
    if (!device.activeSurfaces || !Object.keys(device.activeSurfaces).length)
      throw new Error('DEVICE_NOT_DISCOVERED');

    const surfaceModel = device.activeSurfaces[surface];
    if (!surfaceModel) throw new Error('SURFACE_NOT_FOUND');

    const capability = surfaceModel.capabilities[capabilityCode];
    if (!capability) throw new Error('CAPABILITY_NOT_FOUND');

    if (value !== null && value !== undefined)
      validateCapabilityValue(capability, value);

    return {
      capability_code: capabilityCode,
      constraints: capability.constraints || {},
      dp_code: capability.dp_code,
      module_code: surfaceModel.module_code,
      module_id: surfaceModel.module_id,
      semantic_type: capability.semantic_type,
      surface,
      transport_type: capability.transport_type,
      value
    };
  }
}

module.exports = CapabilityResolver;