// @ts-nocheck
const express = require('express');

module.exports = (hub) => {
  const router = express.Router();
  const deviceService = hub.getDeviceService();
  const deviceCommandService = hub.getDeviceCommandService();
  const deviceDiscoveryService = hub.getDeviceDiscoveryService();
  
  router.get('/', (req, res) => {
    return res.json(deviceService.listDevices());
  });

  router.get('/:id', (req, res) => {
    const device = deviceService.getDeviceById(req.params.id);
    if (!device) return res.status(404).json({ error: 'Device not found' });
    return res.json(device);
  });

  router.post('/:id/control/toggle', async (req, res) => {
    try {
      const data = req.body;
      if (typeof data?.surface === 'string' && typeof data?.capability === 'string') {
        const updatedDevice = await deviceCommandService.toggleSurfaceCapability(req.params.id, data.surface, data.capability);
        return res.json(updatedDevice);
      } else throw new Error('DATA_NOT_SPECIFIED');
    } catch (error) {
      if (error.message === 'DEVICE_NOT_FOUND') return res.status(404).json({ error: 'Device not found'});
      else if (error.message === 'SURFACE_NOT_FOUND') return res.status(404).json({ error: 'Specified surface was not found for the device'});
      else if (error.message === 'CAPABILITY_NOT_FOUND') return res.status(404).json({ error: 'Specified surface has no such capability'});
      else if (error.message === 'DATA_NOT_SPECIFIED') return res.status(400).json({ error: 'No required data provided'});
      else if (error.message === 'DEVICE_OFFLINE') return res.status(503).json({ error: 'Device is currently offline'});
      else if (error.message === 'DEVICE_NOT_DISCOVERED') return res.status(503).json({ error: 'Device was not yet discovered'});
      else if (error.message === 'DEVICE_NOT_READY') return res.status(503).json({ error: 'Device is online but has no state data yet'});
      else return res.status(500).json({ error: `Internal Server Error` });
    }
  });

  router.post('/:id/discover', async (req, res) => {
    try {
      const discover = await deviceDiscoveryService.discoverDevice(req.params.id);
      return res.json(discover);
    } catch (error) {
      if (error.message === 'DEVICE_NOT_FOUND') return res.status(404).json({ error: 'Device not found'});
      else if (error.message === 'DEVICE_HAS_NO_KNOWN_MODULES') return res.status(404).json({ error: 'No known modules were found for the current device' });
      else if (error.message === 'DEVICE_OFFLINE') return res.status(503).json({ error: 'Device is currently offline'});
      else if (error.message === 'DEVICE_NOT_READY') return res.status(503).json({ error: 'Device is online but has no state data yet'});
      else return res.status(500).json({ error: `Internal Server Error` });
    }
  });

  return router;
}