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
    if (!device) throw new Error('DEVICE_NOT_FOUND');
    return toSummary(device);
  }

  getDeviceControls(id) {
    const device = this.deviceRegistry.getById(id);
    if (!device) throw new Error('DEVICE_NOT_FOUND');
    return device.activeSurfaces;
  }

  getDeviceState(id) {
    const device = this.deviceRegistry.getById(id);
    if (!device) throw new Error('DEVICE_NOT_FOUND');

    const { lastSeenAt, lastError, activeSurfaces, state } = device;

    const normalizedState = Object.fromEntries(
      Object.entries(activeSurfaces || {}).map(([surfaceKey, surface]) => {
        const mappedCapabilities = Object.fromEntries(
          Object.entries(surface.capabilities || {})
            .filter(([_, cap]) => Object.hasOwn(state, cap.dp_code))
            .map(([capKey, cap]) => [capKey, state[cap.dp_code]])
        );

        return [surfaceKey, mappedCapabilities];
      })
    );

    return { lastSeenAt, lastError, state: normalizedState };
  }
}

module.exports = DeviceService;