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
  
  // Get all devices the system knows. Providing basic info.
  router.get('/', (req, res) => {
    return res.json(deviceService.listDevices());
  });

  // Get a single device by it's id. Providing basic info
  router.get('/:id', asyncHandler(async (req, res) => {
    return res.json(deviceService.getDeviceById(req.params.id));
  }));

  // Get single device's active surfaces with capabilities
  router.get('/:id/controls', asyncHandler(async (req, res) => {
    return res.json(deviceService.getDeviceControls(req.params.id));
  }));

  // Get state of device by it's id.
  router.get('/:id/state', asyncHandler(async (req, res) => {
    return res.json(deviceService.getDeviceState(req.params.id));
  }));

  // Toggle a single boolean capability of the device given.
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

  // Set a new device's state providing single or multiple commands.
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

  // Manually (re)discover a device (in case of firmware update, etc.)
  router.post('/:id/discover', asyncHandler(async (req, res) => {
    const discover = await deviceDiscoveryService.discoverDevice(req.params.id);
    return res.json(discover);
  }));

  return router;
}