import express from 'express';
import http from 'http';
import redis from 'redis';
import bodyParser from 'body-parser';
import uuid from 'uuid';
import SocketIO from 'socket.io';
import cors from 'cors';
import async from 'async';

// Setup constants
const PORT = 8001;
const HOST = '0.0.0.0';

const app = express();
const server = http.createServer(app);
const io = new SocketIO.listen(server);

// Create Redis client
const client = redis.createClient();
client.on('connect',  () => console.log('Connected to Redis...'));


// Socket IO
var sub = redis.createClient(), pub = redis.createClient();
sub.subscribe('locations');
sub.on('message', (channel, message) => {
  console.log('New loc.', message);
});
io.sockets.on('connection', (socket) => {
  socket.on('locations', (message) => {
    console.log('[CLIENT] New loc.', message);
    let uid = uuid.v1();
    let lat = message.lat;
    let lng = message.lng;
    let label = message.label;
    let draggable = message.draggable;
    
    client.hmset(uid, [
      'lat', lat,
      'lng', lng,
      'label', label,
      'draggable', draggable
    ], (err) => {
      if (err) console.log(err);
      else client.publish('locations', uid.toString());
    });
  });
  console.log(socket.id);
});

// bodyParser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));

// Use CORS
var corsOptions = {
  origin: 'http://localhost:4200',
};
app.use(cors(corsOptions));

// Main route
app.get('/', (req, res, next) => res.send('Hello Skycatch!'));

// Get all locations from Redis server
app.get('/locations', (req, res, next) => {
  // Create a JSON response based on all Keys from Redis
  let locs = [];
  client.keys('*', (err, keys) => {
    console.log(keys);
    if (err) return console.log(err);
    if (keys) {
      async.map(keys, (key, cb) => {
        if (err) return console.log(err);
        if (keys) {
          client.hgetall(key, (err, value) => {
            if (err) return cb(err);
            let loc = {};
            loc['lat'] = Number(value.lat);
            loc['lng'] = Number(value.lng);
            loc['label'] = value.label;
            loc['draggable'] = !value.draggable;
            cb(null, loc);
          });
        }
      }, (err, results) => {
        if (err) return console.log(err);
        console.log(results);
        res.json({data:results});
      })
    }
  })
})

// Post a new location to Redis server
app.post('/locations/add', (req, res, next) => {
  let uid = uuid.v1();
  let lat = req.body.lat;
  let lng = req.body.lng;
  let label = req.body.label;
  let draggable = req.body.draggable;
  
  client.hmset(uid, [
    'lat', lat,
    'lng', lng,
    'label', label,
    'draggable', draggable
  ], (err) => {
    if (err) console.log(err);
    else client.publish('locations', uid.toString());
  });
  res.end();
});

// Listen on port 8001
// app.listen(PORT, HOST);
server.listen(PORT); 
console.log(`Running on http://${HOST}:${PORT}`);