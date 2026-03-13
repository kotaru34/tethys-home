const SmartDevice = require('./SmartDevice');
const DeviceRepository = require('./infrastructure/postgres/DeviceRepository');
const DeviceRegistry = require('./domain/devices/DeviceRegistry');
const DeviceService = require('./domain/devices/DeviceService');
const DeviceCommandService = require('./domain/devices/DeviceCommandService');

class Hub {
  constructor() {
    this.deviceRegistry = new DeviceRegistry();
    this.deviceRepository = new DeviceRepository();
    this.deviceService = new DeviceService(this.deviceRegistry);
    this.deviceCommandService = new DeviceCommandService(this.deviceRegistry);
  }

  async init() {
    await this.loadDevices();
    console.log(`Hub initialized with ${this.deviceRegistry.getDeviceCount()} devices.`);
  }

  async loadDevices() {
    const deviceConfigs = await this.deviceRepository.findActiveDevicesForRuntime();

    for (const config of deviceConfigs) {
      if (!config.key) {
        console.log(`Skipping device ${config.name} (ID: ${config.id}) due to missing local key.`);
        continue;
      }
      
      if (!config.ip) {
        console.log(`Skipping device ${config.name} (ID: ${config.id}) due to missing IP address.`);
        continue;
      }

      const device = new SmartDevice(config);
      this.deviceRegistry.add(device);
      device.connect();
    }
  }

  getDeviceService() {
    return this.deviceService;
  }

  getDeviceCommandService() {
    return this.deviceCommandService;
  }
}

module.exports = Hub;