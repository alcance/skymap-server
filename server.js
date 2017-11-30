import express from 'express';
import redis from 'redis';
import bodyParser from 'body-parser';
import uuid from 'uuid';
import http from 'http';
import SocketIO from 'socket.io';

const app = express();
const server = http.Server(app);

// Create Redis client
const client = redis.createClient();
client.on('connect',  () => console.log('Connected to Redis...'));

// Socket IO
const io = new SocketIO(server);
client.subscribe('locations');
client.on('message', (channel, message) => {
  console.log(message);
});
io.sockets.on('connection', (socket) => console.log(socket.request));

// Setup constants
const PORT = 8001;
const HOST = '0.0.0.0';

// bodyParser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));

// Main route
app.get('/', (req, res, next) => res.send('Hello Skycatch!'));

// Get all locations from Redis server
app.get('/locations', (req, res, next) => {
  client.keys('*', (err, obj) => res.json(obj));
})

// Post a new location to Redis server
app.post('/locations/add', (req, res, next) => {
  let uid = uuid.v1();
  let lat = req.body.lat;
  let lng = req.body.lng;
  
  client.hmset(uid, [
    'lat', lat,
    'lng', lng
  ], (err) => {
    if (err) console.log(err);
    else {
      client.publish('locations', uui.toString());
      res.json(uid)
    };
  });
});

// Listen on port 8001
app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);