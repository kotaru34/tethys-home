const { toSummary } = require('../../api/dto/deviceMapper');

class DeviceService {
  constructor(deviceRegistry) {
    this.deviceRegistry = deviceRegistry;
  }

  listDevices() {
    return this.deviceRegistry.getAllSummaries();
  }

  getDeviceById(id) {
    const device = this.deviceRegistry.getById(id);
    if (!device) return null;
    return toSummary(device);
  }
}

module.exports = DeviceService;