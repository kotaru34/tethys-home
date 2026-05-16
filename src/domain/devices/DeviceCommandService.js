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
    const device = await this.checkDevice(deviceId);
    const { dp_code, module_code } = this.capabilityResolver.resolve(
      device,
      surface,
      capabilityCode
    );
    await device.toggleDp(dp_code, module_code);
    return toSummary(device);
  }

  async setSurfaceCapabilities(deviceId, data) {
    const device = await this.checkDevice(deviceId);
    const resolvedData = [];
    
    for (const [surface, capabilities] of Object.entries(data)) {
      for (const [capabilityCode, value] of Object.entries(capabilities)) {
        resolvedData.push(this.capabilityResolver.resolve(
          device,
          surface,
          capabilityCode,
          value
        ));
      }
    }

    await device.setDp(resolvedData);
    return toSummary(device);
  }

  async checkDevice(deviceId) {
    const device = this.deviceRegistry.getById(deviceId);
    if (!device) throw new Error('DEVICE_NOT_FOUND');
    if (!device.isConnected) throw new Error('DEVICE_OFFLINE');
    // TO_DECIDE: maybe turn this into manually controlled
    if (!device.activeSurfaces || !Object.keys(device.activeSurfaces).length)
      await this.deviceDiscoveryService.discoverDevice(deviceId);
    return device;
  }
}

module.exports = DeviceCommandService;