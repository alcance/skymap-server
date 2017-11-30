import express from 'express';
import redis from 'redis';
import bodyParser from 'body-parser';
import uuid from 'uuid';

const app = express();
// Create Redis client
const client = redis.createClient();
client.on('connect',  () => console.log('Connected to Redis...'))

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
    if (err) console.log(err, status);
    else res.json(uid);
  });
});

// Listen on port 8001
app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);