function toSummary(device) {
  return {
    id: device.id,
    name: device.name,
    category: device.category,
    product_name: device.product_name,
    ip: device.ip,
    isConnected: device.isConnected,
    isConnecting: device.isConnecting,
    retryCount: device.retryCount,
    lastSeenAt: device.lastSeenAt,
    lastError: device.lastError,
    state: device.state,
    activeSurfaces: device.activeSurfaces
  };
}

module.exports = { toSummary };