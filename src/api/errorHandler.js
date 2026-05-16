module.exports = function errorHandler(err, req, res, next) {
  if (err.message === 'DEVICE_NOT_FOUND') {
    return res.status(404).json({ error: 'Device not found' });
  }

  if (err.message === 'SURFACE_NOT_FOUND') {
    return res.status(404).json({ error: 'Specified surface was not found for the device' });
  }

  if (err.message === 'CAPABILITY_NOT_FOUND') {
    return res.status(404).json({ error: 'Specified surface has no such capability' });
  }

  if (err.message === 'DEVICE_OFFLINE') {
    return res.status(503).json({ error: 'Device is currently offline' });
  }

  if (err.message === 'DEVICE_NOT_READY') {
    return res.status(503).json({ error: 'Device is online but has no state data yet' });
  }

  if (err.message === 'DEVICE_NOT_DISCOVERED') {
    return res.status(503).json({ error: 'Device was not yet discovered' });
  }

  if (err.message === 'DATA_NOT_SPECIFIED') {
    return res.status(400).json({ error: 'No required data provided' });
  }

  if (err.message === 'INVALID_CAPABILITY_VALUE') {
    return res.status(400).json({ error: 'Invalid value for capability' });
  }

  if (err.message === 'UNSUPPORTED_SEMANTIC_TYPE') {
    return res.status(400).json({ error: 'Invalid semantic value' });
  }

  return res.status(500).json({ error: `Internal Server Error ${err}` });
};