import express from 'express';
import { get } from './replacer.js';
import redis, { shutdown } from './cache.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
  res.send('ok');
});

app.get('/feed', (req, res) => {
  const { url } = req.query;
  const selectors = JSON.parse(req.query.selectors);
  console.log(`Request for ${url}`);
  get(url, selectors).then((f) => {
    res.set('Content-Type', 'application/xml');
    res.send(f.xml());
  }).catch((err) => {
    console.log(err);
    res.send('Error');
  });
});

app.listen(PORT, () => {
  redis.connect()
    .then(() => console.log('Connected to Redis'))
    .catch((e) => {
      console.log('Error connecting');
      throw e;
    });
  console.log('Server listening');
});

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
