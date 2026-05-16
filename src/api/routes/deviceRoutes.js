// @ts-nocheck
const express = require('express');
const asyncHandler = require('../asyncHandler');

function isObjectWithValues(object) {
  return (
    object && typeof object === 'object'
    && !Array.isArray(object)
    && Object.keys(object).length
  )
}

module.exports = (hub) => {
  const router = express.Router();
  const deviceService = hub.getDeviceService();
  const deviceCommandService = hub.getDeviceCommandService();
  const deviceDiscoveryService = hub.getDeviceDiscoveryService();
  
  router.get('/', (req, res) => {
    return res.json(deviceService.listDevices());
  });

  router.get('/:id', asyncHandler(async (req, res) => {
    const device = deviceService.getDeviceById(req.params.id);
    if (!device) return res.status(404).json({ error: 'Device not found' });
    return res.json(device);
  }));

  router.post('/:id/control/toggle', asyncHandler(async (req, res) => {
    const data = req.body;
    if (!(typeof data?.surface === 'string') || !(typeof data?.capability === 'string'))
      throw new Error('DATA_NOT_SPECIFIED');

    const updatedDevice = await deviceCommandService.toggleSurfaceCapability(
      req.params.id,
      data.surface,
      data.capability
    );

    return res.json(updatedDevice);
  }));

  router.post('/:id/control/set', asyncHandler(async (req, res) => {
    const { surfaces } = req.body ?? {};

    if (
      !req.body || typeof req.body !== 'object'
      || !surfaces || typeof surfaces !== 'object'
      || !Object.keys(surfaces).length
      || !Object.values(surfaces).every(isObjectWithValues)
    ) throw new Error('DATA_NOT_SPECIFIED');

    const updatedDevice = await deviceCommandService.setSurfaceCapabilities(
      req.params.id,
      surfaces
    );

    return res.json(updatedDevice);
  }))

  router.post('/:id/discover', asyncHandler(async (req, res) => {
    const discover = await deviceDiscoveryService.discoverDevice(req.params.id);
    return res.json(discover);
  }));

  return router;
}