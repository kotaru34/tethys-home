const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const env = require('./src/config/env');
const Hub = require('./src/Hub');
const deviceRoutes = require('./src/api/routes/deviceRoutes');

async function bootstrap() {
  const app = express();
  const httpServer = http.createServer(app);
  const io = new Server(httpServer);
  
  const tethysHub = new Hub();
  await tethysHub.init();

  app.use(express.json());
  app.use(express.static('public'));
  app.use('/api/devices', deviceRoutes(tethysHub, io));

  httpServer.listen(env.port, () => {
    console.log(`Tethys Hub API is running on port ${env.port}.`);
  });
}

bootstrap().catch(error => {
  console.error('Error starting Tethys Hub: ', error);
  process.exit(1);
});