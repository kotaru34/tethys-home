const express = require('express');
const router = express.Router();

module.exports = (hub) => {

  router.get('/', (req, res) => {
    const devices = Object.values(hub.devices).map(device => ({
      id: device.id,
      name: device.name,
      category: device.category,
      product_name: device.product_name,
      state: device.state,
      isOnline: device.isConnected
    }));
    res.json(devices);
  });

  router.post('/:id/toggle', async (req, res) => {
    const device = hub.getDevice(req.params.id);
    if (!device) return res.status(404).json({ error: 'Device not found' });
    try {
      await device.toggle();
      res.json({ success: true, state: device.state });
    } catch (error) {
      console.log(`Error toggling device ${device.name}: `, error);
      res.status(500).json({ error: 'Failed to toggle device' });
    }
  });

  return router;
}