import express from 'express'

const app = express();

// Setup constants
const PORT = 8001;
const HOST = '0.0.0.0';

// Main route
app.get('/', (req, res) => res.send('Hello Skycatch!'));

// Listen on port 8001
app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);