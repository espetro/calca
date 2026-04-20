import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();

app.use('*', cors({ origin: '*' }));

app.get('/health', (c) => c.json({ status: 'ok' }));

export default app;
