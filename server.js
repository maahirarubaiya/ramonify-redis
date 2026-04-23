const express = require('express');
const { createClient } = require('redis');

const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ── Redis Client ──────────────────────────────────────────────
const client = createClient({ url: 'redis://localhost:6379' });
client.on('error', (err) => console.error('Redis error:', err));

(async () => {
  await client.connect();
  console.log('Connected to Redis');
})();

// ── HOME ──────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.render('index');
});

// ═════════════════════════════════════════════════════════════
// SESSIONS (Hash)
// ═════════════════════════════════════════════════════════════

// READ — list all active sessions
app.get('/sessions', async (req, res) => {
  const keys = await client.keys('session:*');
  const sessions = [];
  for (const key of keys) {
    const data = await client.hGetAll(key);
    const ttl = await client.ttl(key);
    sessions.push({ key, ...data, ttl });
  }
  res.render('sessions', { sessions, message: null });
});

// CREATE — show login form
app.get('/sessions/new', (req, res) => {
  res.render('session_form', { message: null });
});

// CREATE — log a user in
app.post('/sessions', async (req, res) => {
  const { userId, email } = req.body;
  if (!userId || !email) {
    return res.render('session_form', { message: 'User ID and email are required.' });
  }
  const key = `session:${userId}`;
  const loginTime = new Date().toISOString();
  await client.hSet(key, { userId, email, loginTime });
  await client.expire(key, 3600);
  res.redirect('/sessions');
});

// UPDATE — refresh a session TTL and timestamp
app.post('/sessions/:userId/refresh', async (req, res) => {
  const key = `session:${req.params.userId}`;
  const exists = await client.exists(key);
  if (!exists) return res.redirect('/sessions');
  await client.hSet(key, 'loginTime', new Date().toISOString());
  await client.expire(key, 3600);
  res.redirect('/sessions');
});

// DELETE — log a user out
app.post('/sessions/:userId/delete', async (req, res) => {
  await client.del(`session:${req.params.userId}`);
  res.redirect('/sessions');
});

// ═════════════════════════════════════════════════════════════
// BUDGET STATUS CACHE (Sorted Set)
// ═════════════════════════════════════════════════════════════

// READ — show budget status for a user
app.get('/budget', async (req, res) => {
  const userId = req.query.userId || '42';
  const key = `budgetStatus:${userId}`;
  const entries = await client.zRangeWithScores(key, 0, -1, { REV: true });
  res.render('budget', { entries, userId, message: null });
});

// CREATE — add a category budget score
app.post('/budget', async (req, res) => {
  const { userId, category, score } = req.body;
  const key = `budgetStatus:${userId}`;
  await client.zAdd(key, { score: parseFloat(score), value: category });
  res.redirect(`/budget?userId=${userId}`);
});

// UPDATE — increment a category score (new transaction logged)
app.post('/budget/increment', async (req, res) => {
  const { userId, category, amount } = req.body;
  const key = `budgetStatus:${userId}`;
  await client.zIncrBy(key, parseFloat(amount), category);
  res.redirect(`/budget?userId=${userId}`);
});

// DELETE — remove one category
app.post('/budget/delete', async (req, res) => {
  const { userId, category } = req.body;
  const key = `budgetStatus:${userId}`;
  await client.zRem(key, category);
  res.redirect(`/budget?userId=${userId}`);
});

// DELETE — clear all budget data for a user
app.post('/budget/clear', async (req, res) => {
  const { userId } = req.body;
  await client.del(`budgetStatus:${userId}`);
  res.redirect(`/budget?userId=${userId}`);
});

// ═════════════════════════════════════════════════════════════
// TOP SPENDING CATEGORIES (Sorted Set)
// ═════════════════════════════════════════════════════════════

// READ — show global leaderboard
app.get('/top-categories', async (req, res) => {
  const entries = await client.zRangeWithScores('topCategories', 0, -1, { REV: true });
  res.render('top_categories', { entries, message: null });
});

// CREATE — add a category with initial spending
app.post('/top-categories', async (req, res) => {
  const { category, amount } = req.body;
  await client.zAdd('topCategories', { score: parseFloat(amount), value: category });
  res.redirect('/top-categories');
});

// UPDATE — increment when a transaction is logged
app.post('/top-categories/increment', async (req, res) => {
  const { category, amount } = req.body;
  await client.zIncrBy('topCategories', parseFloat(amount), category);
  res.redirect('/top-categories');
});

// DELETE — remove one category
app.post('/top-categories/delete', async (req, res) => {
  const { category } = req.body;
  await client.zRem('topCategories', category);
  res.redirect('/top-categories');
});

// DELETE — clear entire leaderboard
app.post('/top-categories/clear', async (req, res) => {
  await client.del('topCategories');
  res.redirect('/top-categories');
});

// ── Start Server ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Ramonify Redis app running at http://localhost:${PORT}`);
});
