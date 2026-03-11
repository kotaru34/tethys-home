const Hub = require('./src/Hub');
const express = require('express');
const { Server } = require('socket.io');
const http = require('http');
const deviceRoutes = require('./src/routes/deviceRoutes');

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer);
const tethysHub = new Hub();

app.use(express.json());
app.use(express.static('public'));
app.use('/api/devices', deviceRoutes(tethysHub));



app.listen(3000, () => {
  console.log('Tethys Hub API is running on port 3000');
});