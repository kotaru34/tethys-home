const TuyaDevice = require('tuyapi');

class SmartDevice {
  constructor(config) {
    this.config = config;
    this.id = config.id;
    this.name = config.name;
    this.category = config.category;
    this.product_name = config.product_name;

    this.mainSwitch = (this.category === 'cz') ? '1' : '20';

    this.device = new TuyaDevice({
      id: config.id,
      key: config.key,
      ip: config.ip,
      version: config.version || '3.3'
    });

    this.isConnecting = false;
    this.isConnected = false;
    this.retryCount = 0;
    this.state = {};

    this.initListeners();
  }

  initListeners() {
    this.device.on('connected', () => {
      this.isConnected = true;
      this.retryCount = 0;
      this.device.get().then(data => {
        if (data && data.dps) Object.assign(this.state, data.dps);
        console.log(`Set initial state for device: ${this.name}`);
      }).catch(error => console.log(`Error getting initial state for device ${this.name}: `, error));
      console.log(`Connected to device: ${this.name}`);
    });

    this.device.on('disconnected', () => {
      this.isConnected = false;
      console.log(`Disconnected from device: ${this.name}. Trying to reconnect...`);
      if (!this.isConnecting) this.reconnect();
    });

    this.device.on('error', (error) => {
      console.log(`Error with device ${this.name}: `, error);
      if (!this.isConnected) this.reconnect();
    });

    this.device.on('dp-refresh', (data) => {
      if (data && data.dps) {
        Object.assign(this.state, data.dps);
      //  console.log(`Got DP_REFRESH from device ${this.name}`);
      }
    });

    this.device.on('data', (data) => {
      if (data && data.dps) Object.assign(this.state, data.dps);
      console.log(`Data update from device ${this.name}.`);
    });

    this.device.on('heartbeat', () => {
    //  console.log(`Heartbeat received from device ${this.name}`);
    });
  }

  async connect() {
    if (this.isConnecting || this.isConnected) return;

    this.isConnecting = true;
    try {
      await this.device.connect();
    } catch (error) {
      console.log(`Failed to connect to device ${this.name}: `, error);
    } finally {
      this.isConnecting = false;
    }
  }

  reconnect() {
    this.retryCount++;
    const retryDelay = Math.min(this.retryCount * 2000, 30000);
    console.log(`Retrying connection for ${this.name} in ${retryDelay / 1000}s...`);
    setTimeout(() => this.connect(), retryDelay);
  }

  async toggle() {
    await this.device.toggle(this.mainSwitch);
    console.log(`Toggled device ${this.name} to ${this.state[this.mainSwitch]}`);
  }
}

module.exports = SmartDevice;