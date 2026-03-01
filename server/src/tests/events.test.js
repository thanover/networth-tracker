const request = require('supertest');
const app = require('../app');
const AccountEvent = require('../models/AccountEvent');

async function getToken(username = 'eventsuser') {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ username, password: 'password123' });
  return `Bearer ${res.body.token}`;
}

async function createAccount(token, overrides = {}) {
  const res = await request(app)
    .post('/api/accounts')
    .set('Authorization', token)
    .send({
      name: 'Test Account',
      category: 'asset',
      type: 'investment',
      balance: 10000,
      expectedGrowthRate: 7,
      ...overrides,
    });
  return res.body;
}

describe('Account events', () => {
  let token;

  beforeEach(async () => {
    token = await getToken();
  });

  describe('Auto-created account_opened event', () => {
    it('creates account_opened event when account is created', async () => {
      const account = await createAccount(token);
      const events = await AccountEvent.find({ accountId: account._id });
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('account_opened');
      expect(events[0].balance).toBe(10000);
    });

    it('deletes events when account is deleted', async () => {
      const account = await createAccount(token);
      await request(app)
        .delete(`/api/accounts/${account._id}`)
        .set('Authorization', token);
      const events = await AccountEvent.find({ accountId: account._id });
      expect(events).toHaveLength(0);
    });
  });

  describe('GET /api/events', () => {
    it('returns empty array when no events', async () => {
      const res = await request(app)
        .get('/api/events')
        .set('Authorization', token);
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('returns events sorted by date', async () => {
      const account = await createAccount(token);
      // The account_opened event is already created. Add another.
      await request(app)
        .post('/api/events')
        .set('Authorization', token)
        .send({
          accountId: account._id,
          type: 'balance_update',
          date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // yesterday
          balance: 11000,
        });

      const res = await request(app)
        .get('/api/events')
        .set('Authorization', token);
      expect(res.status).toBe(200);
      // Should have account_opened + balance_update
      expect(res.body.length).toBeGreaterThanOrEqual(2);
      // Sorted ascending by date
      const dates = res.body.map(e => new Date(e.date).getTime());
      expect(dates).toEqual([...dates].sort((a, b) => a - b));
    });

    it('requires auth', async () => {
      const res = await request(app).get('/api/events');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/events', () => {
    it('creates a balance_update event', async () => {
      const account = await createAccount(token);
      const res = await request(app)
        .post('/api/events')
        .set('Authorization', token)
        .send({
          accountId: account._id,
          type: 'balance_update',
          date: new Date().toISOString(),
          balance: 12000,
        });
      expect(res.status).toBe(201);
      expect(res.body.type).toBe('balance_update');
      expect(res.body.balance).toBe(12000);
    });

    it('creates an account_closed event (no balance required)', async () => {
      const account = await createAccount(token);
      const res = await request(app)
        .post('/api/events')
        .set('Authorization', token)
        .send({
          accountId: account._id,
          type: 'account_closed',
          date: new Date().toISOString(),
        });
      expect(res.status).toBe(201);
      expect(res.body.type).toBe('account_closed');
    });

    it('updates account.balance when balance_update is most recent', async () => {
      const account = await createAccount(token);
      await request(app)
        .post('/api/events')
        .set('Authorization', token)
        .send({
          accountId: account._id,
          type: 'balance_update',
          date: new Date().toISOString(),
          balance: 15000,
        });

      const updated = await request(app)
        .get('/api/accounts')
        .set('Authorization', token);
      const acc = updated.body.find(a => a._id === account._id);
      expect(acc.balance).toBe(15000);
    });

    it('rejects balance_update without balance', async () => {
      const account = await createAccount(token);
      const res = await request(app)
        .post('/api/events')
        .set('Authorization', token)
        .send({
          accountId: account._id,
          type: 'balance_update',
          date: new Date().toISOString(),
        });
      expect(res.status).toBe(400);
    });

    it('rejects event for account not owned by user', async () => {
      const otherToken = await getToken('otheruser');
      const otherAccount = await createAccount(otherToken);

      const res = await request(app)
        .post('/api/events')
        .set('Authorization', token)
        .send({
          accountId: otherAccount._id,
          type: 'balance_update',
          date: new Date().toISOString(),
          balance: 5000,
        });
      expect(res.status).toBe(404);
    });

    it('rejects invalid event type', async () => {
      const account = await createAccount(token);
      const res = await request(app)
        .post('/api/events')
        .set('Authorization', token)
        .send({
          accountId: account._id,
          type: 'invalid_type',
          date: new Date().toISOString(),
          balance: 1000,
        });
      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/events/:id', () => {
    it('updates event date and balance', async () => {
      const account = await createAccount(token);
      const createRes = await request(app)
        .post('/api/events')
        .set('Authorization', token)
        .send({
          accountId: account._id,
          type: 'balance_update',
          date: new Date().toISOString(),
          balance: 10000,
        });
      const eventId = createRes.body._id;

      const res = await request(app)
        .put(`/api/events/${eventId}`)
        .set('Authorization', token)
        .send({ balance: 11500 });
      expect(res.status).toBe(200);
      expect(res.body.balance).toBe(11500);
    });

    it('returns 404 for non-existent event', async () => {
      const fakeId = '000000000000000000000000';
      const res = await request(app)
        .put(`/api/events/${fakeId}`)
        .set('Authorization', token)
        .send({ balance: 5000 });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/events/:id', () => {
    it('deletes event', async () => {
      const account = await createAccount(token);
      const createRes = await request(app)
        .post('/api/events')
        .set('Authorization', token)
        .send({
          accountId: account._id,
          type: 'balance_update',
          date: new Date().toISOString(),
          balance: 9000,
        });
      const eventId = createRes.body._id;

      const res = await request(app)
        .delete(`/api/events/${eventId}`)
        .set('Authorization', token);
      expect(res.status).toBe(200);

      const check = await AccountEvent.findById(eventId);
      expect(check).toBeNull();
    });

    it('returns 404 for event owned by different user', async () => {
      const otherToken = await getToken('deleteuser');
      const account = await createAccount(otherToken);
      const createRes = await request(app)
        .post('/api/events')
        .set('Authorization', otherToken)
        .send({
          accountId: account._id,
          type: 'balance_update',
          date: new Date().toISOString(),
          balance: 5000,
        });
      const eventId = createRes.body._id;

      const res = await request(app)
        .delete(`/api/events/${eventId}`)
        .set('Authorization', token);
      expect(res.status).toBe(404);
    });
  });
});
