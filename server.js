import express from 'express'

const app = express();

// Main route
app.get('/', (req, res) => res.send('Hello Skycatch!'));

// Listen on port 8001
app.listen(8001, () => console.log('Server is now live: http://localhost:8001/'));