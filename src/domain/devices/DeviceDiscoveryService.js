class DeviceDiscoveryService {
  constructor (deviceRegistry, catalogRepository) {
    this.deviceRegistry = deviceRegistry;
    this.catalogRepository = catalogRepository;
  }

  async discoverDevice(tuyaDeviceId) {
    const device = this.deviceRegistry.getById(tuyaDeviceId);
    if (!device) throw new Error('DEVICE_NOT_FOUND');
    if (!device.isConnected) throw new Error('DEVICE_OFFLINE');
    console.log("Running discovery attempt for an existing device: ", device.name);

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
      device.discoveryStatus = 'ready';
      device.lastDiscoveryAt = new Date();

      return activeSurfaces;
    } catch (error) {
      if (runId) {
          // @ts-ignore
          await this.catalogRepository.updateDeviceDiscoveryRun_failed(runId, error.message);
      }
      device.discoveryStatus = 'failed';
      device.lastDiscoveryAt = new Date();
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

  async ensureDiscovered(deviceId) {
    const device = this.deviceRegistry.getById(deviceId);
    if (!device) throw new Error('DEVICE_NOT_FOUND');
    if (!device.isConnected) throw new Error('DEVICE_OFFLINE');

    if (
      device.discoveryStatus === 'ready' &&
      device.activeSurfaces &&
      Object.keys(device.activeSurfaces).length
    ) {
      return device.activeSurfaces;
    }

    if (device.discoveryStatus === 'running' && device.discoveryPromise) {
      return device.discoveryPromise;
    }

    device.discoveryStatus = 'running';

    device.discoveryPromise = this.discoverDevice(deviceId)
      .then((result) => {
        device.discoveryStatus = 'ready';
        device.lastDiscoveryAt = new Date();
        return result;
      })
      .catch((error) => {
        device.discoveryStatus = 'failed';
        throw error;
      })
      .finally(() => {
        device.discoveryPromise = null;
      });

    return device.discoveryPromise;
  }
}

module.exports = DeviceDiscoveryService;