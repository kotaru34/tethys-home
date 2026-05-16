const CatalogRepository = require('./infrastructure/postgres/CatalogRepository');
const CapabilityResolver = require('./domain/devices/CapabilityResolver')
const DeviceRepository = require('./infrastructure/postgres/DeviceRepository');
const DeviceRegistry = require('./domain/devices/DeviceRegistry');
const DeviceService = require('./domain/devices/DeviceService');
const DeviceCommandService = require('./domain/devices/DeviceCommandService');
const DeviceDiscoveryService = require('./domain/devices/DeviceDiscoveryService');
const SmartDevice = require('./SmartDevice');


class Hub {
  constructor() {
    this.catalogRepository = new CatalogRepository();
    this.capabilityResolver = new CapabilityResolver();
    this.deviceRegistry = new DeviceRegistry();
    this.deviceRepository = new DeviceRepository();
    this.deviceService = new DeviceService(this.deviceRegistry);
    this.deviceDiscoveryService = new DeviceDiscoveryService(this.deviceRegistry, this.catalogRepository);
    this.deviceCommandService = new DeviceCommandService(
      this.deviceRegistry,
      this.deviceDiscoveryService,
      this.capabilityResolver
    );
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

      device.on('state_ready', async () => {
        try {
          await this.deviceDiscoveryService.ensureDiscovered(device.id);
        } catch (error) {
          // @ts-ignore
          console.log(`Auto-discovery failed for ${device.name}:`, error.message);
        }
      });

      await new Promise(r => setTimeout(r, 300));
    }
  }

  getDeviceService() {
    return this.deviceService;
  }

  getDeviceCommandService() {
    return this.deviceCommandService;
  }

  getDeviceDiscoveryService() {
    return this.deviceDiscoveryService;
  }
}

module.exports = Hub;