const devicesData = require('../devices.json');
const SmartDevice = require('./SmartDevice');

class Hub {
  constructor() {
    this.devices = {};
    this.loadDevices();
  }

  loadDevices() {
    const data = Array.isArray(devicesData) ? devicesData : [devicesData];
    data.forEach((config) => {
      const device = new SmartDevice(config);
      this.devices[config.id] = device;
      device.connect();
    });

    console.log(`Hub initialized with ${Object.keys(this.devices).length} devices.`);
  }

  getDevice(id) {
    return this.devices[id] || null;
  }
}

module.exports = Hub;