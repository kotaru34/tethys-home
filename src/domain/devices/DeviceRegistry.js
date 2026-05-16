const { toSummary } = require("../../api/dto/deviceMapper");

class DeviceRegistry {
  constructor () {
    this.devices = new Map();
  }

  add(device) {
    if (!device) throw new Error('DeviceRegistry.add(): device is required.')
    if (!device.id) throw new Error('DeviceRegistry.add(): device.id is required.')
    this.devices.set(device.id, device);
  }

  getById(id) {
    return this.devices.get(id) || null;
  }

  getAll() {
    return Array.from(this.devices.values());
  }

  getAllSummaries() {
    return Array.from(this.devices.values()).map((device) => (toSummary(device)));
  }

  getDeviceCount() {
    return this.devices.size;
  }

  getState(id) {
    return this.devices.get(id).state;
  }
}

module.exports = DeviceRegistry;