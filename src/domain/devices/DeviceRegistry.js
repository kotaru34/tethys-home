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
    return Array.from(this.devices.values()).map((device) => ({
      id: device.id,
      name: device.name,
      category: device.category,
      product_name: device.product_name,
      ip: device.ip,
      isConnected: device.isConnected,
      isConnecting: device.isConnecting,
      retryCount: device.retryCount,
      lastSeenAt: device.lastSeenAt,
      lastError: device.lastError,
      state: device.state,
      activeSurfaces: device.activeSurfaces
    }));
  }

  getDeviceCount() {
    return this.devices.size;
  }
}

module.exports = DeviceRegistry;