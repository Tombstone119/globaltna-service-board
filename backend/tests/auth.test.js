const request = require('supertest');
const jwt = require('jsonwebtoken');
const createApp = require('../src/app');
const { connect, disconnect, clear } = require('./setup/db');
const User = require('../src/models/User');

const app = createApp();

beforeAll(connect);
afterAll(disconnect);
afterEach(clear);

const validCreds = { email: 'new@example.com', password: 'supersecret1' };

describe('POST /api/auth/register', () => {
  it('creates a user and returns a JWT', async () => {
    const res = await request(app).post('/api/auth/register').send(validCreds);
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(validCreds.email);
    expect(res.body.user.id).toBeDefined();

    const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
    expect(decoded.email).toBe(validCreds.email);

    const stored = await User.findOne({ email: validCreds.email });
    expect(stored).not.toBeNull();
    expect(stored.passwordHash).not.toBe(validCreds.password);
  });

  it('lowercases and trims the email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: '  MiXeD@Example.com  ', password: 'supersecret1' });
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('mixed@example.com');
  });

  it('rejects missing fields with 400', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'a@b.com' });
    expect(res.status).toBe(400);
  });

  it('rejects an invalid email with 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: 'supersecret1' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/email/i);
  });

  it('rejects a short password with 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'ok@example.com', password: 'short' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/password/i);
  });

  it('returns 409 when the email is already registered', async () => {
    await request(app).post('/api/auth/register').send(validCreds);
    const res = await request(app).post('/api/auth/register').send(validCreds);
    expect(res.status).toBe(409);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send(validCreds);
  });

  it('logs in with correct credentials', async () => {
    const res = await request(app).post('/api/auth/login').send(validCreds);
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(validCreds.email);
  });

  it('returns 401 with a wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: validCreds.email, password: 'wrongpass1' });
    expect(res.status).toBe(401);
  });

  it('returns 401 for an unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ghost@example.com', password: 'supersecret1' });
    expect(res.status).toBe(401);
  });

  it('returns 400 when fields are missing', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });
});

describe('GET /api/auth/me', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 with a malformed Authorization header', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'NotBearer xyz');
    expect(res.status).toBe(401);
  });

  it('returns 401 when token is expired', async () => {
    const expired = jwt.sign(
      { sub: 'user-1', email: 'x@example.com' },
      process.env.JWT_SECRET,
      { expiresIn: -1 }
    );
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${expired}`);
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/expired/i);
  });

  it('returns the user when authenticated', async () => {
    const reg = await request(app).post('/api/auth/register').send(validCreds);
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${reg.body.token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(validCreds.email);
  });
});
