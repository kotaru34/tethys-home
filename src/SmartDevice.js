const TuyaDevice = require('tuyapi');

class SmartDevice {
  constructor(config) {
    this.config = config;
    this.id = config.id;
    this.name = config.name;
    this.category = config.category;
    this.product_name = config.product_name;
    this.ip = config.ip;

    // @ts-ignore
    this.device = new TuyaDevice({
      id: config.id,
      key: config.key,
      ip: config.ip,
      version: config.version,
      issueGetOnConnect: false,
      issueRefreshOnConnect: false,
      issueRefreshOnPing: false,
    });

    this.isConnecting = false;
    this.isConnected = false;
    this.retryCount = 0;
    this.lastSeenAt = null;
    this.lastError = null;
    this.state = {};

    this.reconnectTimer = null;
    this.shouldReconnect = true;

    this.activeSurfaces = {};
    this.discoverySnapshot = null;

    this.initListeners();
  }

  initListeners() {
    this.device.on('connected', () => {
      this.isConnected = true;
      this.isConnecting = false;
      this.retryCount = 0;
      this.lastSeenAt = new Date();
      this.lastError = null;
      this.clearReconnectTimer();

      this.device.get()
        .then((data) => {
          if (data && data.dps) {
            Object.assign(this.state, data.dps);
          }
          console.log(`Set initial state for device: ${this.name}`);
        })
        .catch((error) => {
          console.log(`Error getting initial state for device ${this.name}:`, error);
        });

      console.log(`Connected to device: ${this.name}`);
    });

    this.device.on('disconnected', () => {
      const wasConnected = this.isConnected;

      this.isConnected = false;
      this.isConnecting = false;
      this.lastSeenAt = new Date();

      console.log(`Disconnected from device: ${this.name}`);

      if (this.shouldReconnect && wasConnected) {
        this.scheduleReconnect('disconnected');
      }
    });

    this.device.on('error', (error) => {
      this.lastError = error;
      this.isConnecting = false;
      // console.log(`Error with device ${this.name}:`, error);
      
      if (this.shouldReconnect) {
        this.scheduleReconnect('error');
      }
    });

    this.device.on('dp-refresh', (data) => {
      this.lastSeenAt = new Date();

      if (data && data.dps) {
        Object.assign(this.state, data.dps);
      }
    });

    this.device.on('data', (data) => {
      this.lastSeenAt = new Date();

      if (data && data.dps) {
        Object.assign(this.state, data.dps);
      }
    });

    this.device.on('heartbeat', () => {
      this.lastSeenAt = new Date();
    });
  }

  clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  scheduleReconnect(reason = 'unknown') {
    if (!this.shouldReconnect) return;
    if (this.isConnected) return;
    if (this.isConnecting) return;
    if (this.reconnectTimer) return;

    this.retryCount += 1;

    const baseDelay = Math.min(this.retryCount * 2000, 30000);
    const jitter = Math.floor(Math.random() * 500);
    const retryDelay = baseDelay + jitter;

    console.log(
      `Scheduling reconnect for ${this.name} in ${retryDelay}ms (reason: ${reason}, attempt: ${this.retryCount})`
    );

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, retryDelay);
  }

  async connect() {
    if (!this.shouldReconnect) return;
    if (this.isConnecting || this.isConnected) return;

    if (!this.config?.key) {
      this.lastError = new Error(`Device ${this.name} has no local key`);
      console.log(this.lastError.message);
      return;
    }

    if (!this.ip) {
      this.lastError = new Error(`Device ${this.name} has no IP address`);
      console.log(this.lastError.message);
      return;
    }

    this.isConnecting = true;

    try {
      await this.device.connect();
    } catch (error) {
      this.isConnected = false;
      this.isConnecting = false;
      this.lastError = error;

      // console.log(`Failed to connect to device ${this.name}:`, error);
      this.scheduleReconnect('connect_failed');
    }
  }

  async disconnect() {
    this.shouldReconnect = false;
    this.isConnecting = false;
    this.isConnected = false;
    this.clearReconnectTimer();

    if (typeof this.device.disconnect === 'function') {
      try {
        await this.device.disconnect();
      } catch (error) {
        console.log(`Error while disconnecting device ${this.name}:`, error);
      }
    }
  }

  async reconnectNow() {
    this.shouldReconnect = true;
    this.clearReconnectTimer();

    if (this.isConnected) {
      if (typeof this.device.disconnect === 'function') {
        try {
          await this.device.disconnect();
        } catch (error) {
          console.log(`Error while forcing reconnect for ${this.name}:`, error);
        }
      }
      this.isConnected = false;
    }

    await this.connect();
  }
  
  async toggleDp(dpCode, moduleCode) {
    const dp = String(dpCode);
    await this.device.toggle(dp);
    console.log(`Toggled ${moduleCode} for ${this.name}.`);
  }

  hsvToTuyaRaw(h, s, v) {
  return [h, s, v]
    .map(x => Math.round(Number(x)).toString(16).padStart(4, '0'))
    .join('');
}

  async setDp(data) {
    const commandSet = data.reduce((accumulator, command) => {
      const key = command.dp_code.toString();
      const value = command.value;
      accumulator[key] = value;
      return accumulator;
    }, {});

    await this.device.set({
      multiple: true,
      data: commandSet
    }).then(() => console.log(`Completed complex command for ${this.name}.`));
  }
}

module.exports = SmartDevice;