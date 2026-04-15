const { toSummary } = require('../../api/dto/deviceMapper');

class DeviceCommandService {
  constructor(deviceRegistry, deviceDiscoveryService, capabilityResolver) {
    this.deviceRegistry = deviceRegistry;
    this.deviceDiscoveryService = deviceDiscoveryService;
    this.capabilityResolver = capabilityResolver;
  }

  async reconnectDevice(id) {
    const device = this.deviceRegistry.getById(id);
    if (!device) throw new Error('DEVICE_NOT_FOUND');
    await device.connect();
    return toSummary(device);
  }

  async toggleSurfaceCapability(deviceId, surface, capabilityCode) {
    const device = this.deviceRegistry.getById(deviceId);
    if (!device) throw new Error('DEVICE_NOT_FOUND');
    if (!device.isConnected) throw new Error('DEVICE_OFFLINE');
    
    // TODECIDE: maybe turn this into manual controlled
    if (!device.activeSurfaces || !Object.keys(device.activeSurfaces).length)
      await this.deviceDiscoveryService.discoverDevice(deviceId);

    const resolved = this.capabilityResolver.resolve(device, surface, capabilityCode);
    await device.toggleDp(resolved.dp_code, resolved.module_code);
    return toSummary(device);
  }
}

module.exports = DeviceCommandService;