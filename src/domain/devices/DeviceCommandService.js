const { toSummary } = require('../../api/dto/deviceMapper');

class DeviceCommandService {
  constructor(deviceService, deviceRegistry, capabilityResolver, deviceDiscoveryService) {
    this.deviceService = deviceService;
    this.deviceRegistry = deviceRegistry;
    this.capabilityResolver = capabilityResolver;
    this.deviceDiscoveryService = deviceDiscoveryService;
  }

  async reconnectDevice(id) {
    const device = this.deviceRegistry.getById(id);
    if (!device) throw new Error('DEVICE_NOT_FOUND');
    await device.connect();
    return toSummary(device);
  }

  async toggleSurfaceCapability(deviceId, surface, capabilityCode) {
    await this.deviceDiscoveryService.ensureDiscovered(deviceId);
    const device = this.deviceRegistry.getById(deviceId);
    const { dp_code, module_code } = this.capabilityResolver.resolve(
      device,
      surface,
      capabilityCode
    );
    await device.toggleDp(dp_code, module_code);
    return this.deviceService.getDeviceState(deviceId);
  }

  async setSurfaceCapabilities(deviceId, data) {
    await this.deviceDiscoveryService.ensureDiscovered(deviceId);
    const device = this.deviceRegistry.getById(deviceId);
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
    return this.deviceService.getDeviceState(deviceId);
  }
}

module.exports = DeviceCommandService;