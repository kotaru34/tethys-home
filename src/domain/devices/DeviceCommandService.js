const { toSummary } = require('../../api/dto/deviceMapper');

class DeviceCommandService {
  constructor(deviceRegistry) {
    this.deviceRegistry = deviceRegistry;
  }

  async toggleDevice(id) {
    const device = this.deviceRegistry.getById(id);
    if (!device) throw new Error('Device not found');
    await device.toggle();
    return toSummary(device);
  }

  async reconnectDevice(id) {
    const device = this.deviceRegistry.getById(id);
    if (!device) throw new Error('Device not found');
    await device.connect();
    return toSummary(device);
  }
}

module.exports = DeviceCommandService;