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

    return { dp_code: capability.dp_code, value };
  }
}

module.exports = CapabilityResolver;