import { createClient } from 'redis';

const client = createClient({
  url: process.env.REDIS_URL,
});

export function shutdown() {
  console.log('Shutdown...');
  client.quit().then(process.exit);
}

export default client;
