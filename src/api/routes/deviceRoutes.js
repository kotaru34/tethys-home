const express = require('express');

module.exports = (hub) => {
  const router = express.Router();
  const deviceService = hub.getDeviceService();
  const deviceCommandService = hub.getDeviceCommandService();
  
  router.get('/', (req, res) => {
    return res.json(deviceService.listDevices());
  });

  router.get('/:id', (req, res) => {
    const device = deviceService.getDeviceById(req.params.id);
    if (!device) return res.status(404).json({ error: 'Device not found' });
    return res.json(device);
  });

  router.post('/:id/toggle', async (req, res) => {
    const device = deviceService.getDeviceById(req.params.id);
    if (!device) return res.status(404).json({ error: 'Device not found' });
    try {
      const updatedDevice = await deviceCommandService.toggleDevice(req.params.id);
      return res.json(updatedDevice);
    } catch (error) {
      console.error(`Error toggling device ${device.name}: `, error);
      return res.status(500).json({ error: 'Failed to toggle device' });
    }
  });

  return router;
}