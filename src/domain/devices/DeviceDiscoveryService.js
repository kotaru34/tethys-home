class DeviceDiscoveryService {
  constructor (deviceRegistry, catalogRepository) {
    this.deviceRegistry = deviceRegistry;
    this.catalogRepository = catalogRepository;
  }

  async discoverDevice(tuyaDeviceId) {
    const device = this.deviceRegistry.getById(tuyaDeviceId);
    if (!device) throw new Error('DEVICE_NOT_FOUND');
    if (!device.isConnected) throw new Error('DEVICE_OFFLINE');

    const observedDps = device.state ? Object.keys(device.state).map(Number) : [];
    if (!observedDps.length) throw new Error('DEVICE_NOT_READY');
    
    const discoveryDps = await this.catalogRepository.getModulesDiscoveryDps(device.category);
    const matchedModules = [];
    const observedDpSet = new Set(observedDps);

    discoveryDps.forEach(module => {
      const allMatched = module.dp_codes.every(code => observedDpSet.has(code));
      if (allMatched) {
        matchedModules.push({
          module_code: module.module_code,
          module_surface: module.module_surface,
          module_priority: Number(module.module_priority)
        });
      }
    })

    if (!matchedModules.length) throw new Error('DEVICE_HAS_NO_KNOWN_MODULES')

    const activeSurfaces = {};

    matchedModules.forEach(module => {
      const surface = module.module_surface;
      
      if (!activeSurfaces[surface] || module.module_priority > activeSurfaces[surface].module_priority) {
        activeSurfaces[surface] = {
          module_code: module.module_code,
          module_priority: module.module_priority
        };
      }
    });

    const activeModuleCodes = Object.values(activeSurfaces).map(module => module.module_code);
    const capabilitiesRaw = await this.catalogRepository.getModulesCapabilities(activeModuleCodes, device.category);

    Object.keys(activeSurfaces).forEach(surface => {
      const moduleCode = activeSurfaces[surface].module_code;
      const found = capabilitiesRaw.find(row => row.module_code === moduleCode);
      activeSurfaces[surface].capabilities = found ? found.capabilities : [];
    });

    device.matchedModules = matchedModules;
    device.activeSurfaces = activeSurfaces;
    device.discoverySnapshot = {
      observedDps,
      discoveredAt: new Date()
    };

    return { 
      'deviceId': device.id, 
      'deviceName': device.name,
      'category': device.category,
      'observedDps': observedDps,
      'matchedModules': matchedModules,
      'activeSurfaces': activeSurfaces
    };
  }
}

module.exports = DeviceDiscoveryService;