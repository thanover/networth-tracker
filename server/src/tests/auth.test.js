const request = require('supertest');
const app = require('../app');

describe('POST /api/auth/register', () => {
  it('creates a user and returns a token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'alice', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.username).toBe('alice');
  });

  it('rejects duplicate usernames', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ username: 'alice', password: 'password123' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'alice', password: 'different123' });

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('error');
  });

  it('rejects missing username', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ password: 'password123' });

    expect(res.status).toBe(400);
  });

  it('rejects missing password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'alice' });

    expect(res.status).toBe(400);
  });

  it('rejects passwords shorter than 6 characters', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'alice', password: '123' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ username: 'alice', password: 'password123' });
  });

  it('returns a token for valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'alice', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.username).toBe('alice');
  });

  it('rejects wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'alice', password: 'wrongpassword' });

    expect(res.status).toBe(401);
  });

  it('rejects unknown username', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'nobody', password: 'password123' });

    expect(res.status).toBe(401);
  });

  it('rejects missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'alice' });

    expect(res.status).toBe(400);
  });
});
