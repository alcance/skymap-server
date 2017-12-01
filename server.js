import express from 'express';
import http from 'http';
import redis from 'redis';
import bodyParser from 'body-parser';
import uuid from 'uuid';
import SocketIO from 'socket.io';
import cors from 'cors';
import async from 'async';
import NodeGeocoder from 'node-geocoder';

// Setup constants
const PORT = 8001;
const HOST = '0.0.0.0';
const options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: 'AIzaSyBqzk9xJicW_YPEJV9P1NTKeKc4hQtiC6o',
  formatter: null
}

const app = express();
const server = http.createServer(app);
const io = new SocketIO.listen(server);
const geocoder = NodeGeocoder(options);


// Create Redis client
const client = redis.createClient();
client.on('connect',  () => console.log('Connected to Redis...'));

// Socket IO
var sub = redis.createClient(), pub = redis.createClient();
sub.subscribe('locations');

sub.on('message', (channel, message) => {
  let data = []
  data.push(JSON.parse(message));
  console.log('New loc.', data);
  io.emit('added-location', data);
});

io.sockets.on('connection', (socket) => { 
  console.log('[JOIN]', socket.id);
  socket.on('disconnect', () => {
    console.log('[QUIT]', socket.id);
    io.emit('disconnected', socket.id);
  });
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
            loc['isOpen'] = value.isOpen;
            cb(null, loc);
          });
        }
      }, (err, results) => {
        if (err) return console.log(err);
        let data = [];
        results.forEach((location) => {
          data.push(location);
        })
        res.json(data);
      })
    }
  })
})

// Post a new location to Redis server
app.post('/locations/add', (req, res, next) => {
  geocoder.reverse({lat:req.body.lat, lon:req.body.lng}, (err, res) => res)
  .then((data) => {
    console.log('dataasa', data[0].formattedAddress);

    var uid = uuid.v1();
    var location = {
      lat: Number(req.body.lat),
      lng: Number(req.body.lng),
      draggable: Boolean(req.body.draggable),
      label: data[0].formattedAddress ? data[0].formattedAddress : 'Neverland',
      isUser: req.body.isUser ? true : false,
      isOpen: req.body.isOpen ? 'Open Now' : 'Closed'
    }

    pub.hset(uid, [
      'lat', location.lat,
      'lng', location.lng,
      'label', location.label,
      'draggable', location.draggable,
      'isUser', location.isUser,
      'isOpen', location.isOpen
    ], (err, response) => {
      if (err) console.log(err);
      else {
        pub.publish('locations', JSON.stringify({
          lat: location.lat,
          lng: location.lng,
          label: location.label,
          draggable: location.draggable,
          isUser: location.isUser,
          isOpen: location.isOpen
        }));
      }
      res.json(response);
    });
  })
  .catch((err) => console.log(err)) 
});

// Listen on port 8001
// app.listen(PORT, HOST);
server.listen(PORT); 
console.log(`Running on http://${HOST}:${PORT}`);