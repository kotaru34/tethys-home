class DeviceDiscoveryService {
  constructor (deviceRegistry, catalogRepository) {
    this.deviceRegistry = deviceRegistry;
    this.catalogRepository = catalogRepository;
  }

  async discoverAllDevices() {
    const devices = this.deviceRegistry.getAll();
    const discoveryPromises = devices.map(device => this.discoverDevice(device.id));
    await Promise.all(discoveryPromises);
  }

  async discoverDevice(tuyaDeviceId) {
    const device = this.deviceRegistry.getById(tuyaDeviceId);
    if (!device) throw new Error('DEVICE_NOT_FOUND');
    if (!device.isConnected) throw new Error('DEVICE_OFFLINE');

    let runId = null;

    try {
      const currentDiscoveryRun = await this.catalogRepository.setDeviceDiscoveryRun(tuyaDeviceId);
      runId = currentDiscoveryRun;

      const observedDps = device.state ? Object.keys(device.state).map(Number) : [];
      if (!observedDps.length) throw new Error('DEVICE_NOT_READY');

      await this.catalogRepository.updateDeviceDiscoveryRun(runId, observedDps);
  
      const activeSurfaceRows = await this.catalogRepository.getDeviceActiveSurfaces(tuyaDeviceId);
      const activeSurfaces = this.buildActiveSurfaces(activeSurfaceRows);

      device.activeSurfaces = activeSurfaces;
      device.discoverySnapshot = {
        observedDps,
        discoveredAt: new Date()
      };

      return activeSurfaces;
    } catch (error) {
      if (runId) {
          // @ts-ignore
          await this.catalogRepository.updateDeviceDiscoveryRun_failed(runId, error.message);
      }
      throw error;
    }
  }

  buildActiveSurfaces(rows) {
    const activeSurfaces = {};

    for (const row of rows) {
      activeSurfaces[row.surface] = {
        module_id: row.module_id,
        module_code: row.module_code,
        module_priority: Number(row.module_priority),
        capabilities: row.capabilities || {}
      };
    }

    return activeSurfaces;
  }
}

module.exports = DeviceDiscoveryService;