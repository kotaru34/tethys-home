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
    
    const discoveryDps = await this.catalogRepository.getDiscoveryDps(device.category);
    const matchedModules = [];

    discoveryDps.forEach(module => {
      const allMatched = module.dp_codes.every(code => observedDps.includes(code));
      if (allMatched) matchedModules.push(module.module_code);
    }) 

    return { 
      'deviceId': device.id, 
      'deviceName': device.name, 
      'category': device.category,
      'observedDps': observedDps,
      'matchedModules': matchedModules
    };
  }
}

module.exports = DeviceDiscoveryService;