function toSummary(device) {
  return {
    id: device.id,
    name: device.name,
    category: device.category,
    product_name: device.product_name,
    ip: device.ip,
    isConnected: device.isConnected,
  };
}

module.exports = { toSummary };