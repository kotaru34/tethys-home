const SmartDevice = require('./SmartDevice');
const DeviceRepository = require('./infrastructure/postgres/DeviceRepository');

class Hub {
  constructor() {
    this.devices = {};
    this.DeviceRepository = new DeviceRepository();
  }

  async init() {
    await this.loadDevices();
    console.log(`Hub initialized with ${Object.keys(this.devices).length} devices.`);
  }

  async loadDevices() {
    const deviceConfigs = await this.DeviceRepository.findActiveDevicesForRuntime();

    for (const config of deviceConfigs) {
      if (!config.key) {
        console.log(`Skipping device ${config.name} (ID: ${config.id}) due to missing local key.`);
        continue;
      }

      const device = new SmartDevice(config);
      this.devices[config.id] = device;
      device.connect();
    }
  }

  getDevice(id) {
    return this.devices[id] || null;
  }
}

module.exports = Hub;