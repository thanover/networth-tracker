const request = require('supertest');
const app = require('../app');

// Helper: register and return a Bearer token
async function getToken(username = 'testuser') {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ username, password: 'password123' });
  return `Bearer ${res.body.token}`;
}

// Minimal valid account payloads per type
const samples = {
  investment: {
    name: 'Brokerage',
    category: 'asset',
    type: 'investment',
    balance: 10000,
    expectedGrowthRate: 7,
    monthlyContribution: 500,
  },
  property: {
    name: 'House',
    category: 'asset',
    type: 'property',
    balance: 350000,
    expectedGrowthRate: 3,
  },
  vehicle: {
    name: 'Car',
    category: 'asset',
    type: 'vehicle',
    balance: 20000,
    expectedGrowthRate: -15,
  },
  cash: {
    name: 'Savings',
    category: 'asset',
    type: 'cash',
    balance: 5000,
    interestRate: 4.5,
    monthlyContribution: 200,
  },
  loan: {
    name: 'Mortgage',
    category: 'debt',
    type: 'loan',
    balance: 280000,
    interestRate: 6.5,
    monthlyPayment: 1800,
    remainingTerm: 300,
  },
  credit_card: {
    name: 'Visa',
    category: 'debt',
    type: 'credit_card',
    balance: 3000,
    interestRate: 22,
    monthlyPayment: 150,
  },
};

describe('GET /api/accounts', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/accounts');
    expect(res.status).toBe(401);
  });

  it('returns an empty array when the user has no accounts', async () => {
    const token = await getToken();
    const res = await request(app).get('/api/accounts').set('Authorization', token);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns only the current user\'s accounts', async () => {
    const tokenA = await getToken('userA');
    const tokenB = await getToken('userB');

    await request(app)
      .post('/api/accounts')
      .set('Authorization', tokenA)
      .send(samples.cash);

    const res = await request(app).get('/api/accounts').set('Authorization', tokenB);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(0);
  });
});

describe('POST /api/accounts', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).post('/api/accounts').send(samples.cash);
    expect(res.status).toBe(401);
  });

  it('rejects missing required fields', async () => {
    const token = await getToken();
    const res = await request(app)
      .post('/api/accounts')
      .set('Authorization', token)
      .send({ name: 'Oops' }); // missing category, type, balance

    expect(res.status).toBe(400);
  });

  it('rejects an invalid type', async () => {
    const token = await getToken();
    const res = await request(app)
      .post('/api/accounts')
      .set('Authorization', token)
      .send({ name: 'X', category: 'asset', type: 'bitcoin', balance: 1000 });

    expect(res.status).toBe(400);
  });

  for (const [type, payload] of Object.entries(samples)) {
    it(`creates a ${type} account`, async () => {
      const token = await getToken(`user_${type}`);
      const res = await request(app)
        .post('/api/accounts')
        .set('Authorization', token)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.name).toBe(payload.name);
      expect(res.body.type).toBe(type);
      expect(res.body.balance).toBe(payload.balance);
    });
  }
});

describe('PUT /api/accounts/:id', () => {
  it('updates an existing account', async () => {
    const token = await getToken();

    const created = await request(app)
      .post('/api/accounts')
      .set('Authorization', token)
      .send(samples.cash);

    const res = await request(app)
      .put(`/api/accounts/${created.body._id}`)
      .set('Authorization', token)
      .send({ ...samples.cash, name: 'Updated Savings', balance: 9999 });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated Savings');
    expect(res.body.balance).toBe(9999);
  });

  it('returns 404 for a non-existent account', async () => {
    const token = await getToken();
    const res = await request(app)
      .put('/api/accounts/000000000000000000000001')
      .set('Authorization', token)
      .send(samples.cash);

    expect(res.status).toBe(404);
  });

  it('cannot update another user\'s account', async () => {
    const tokenA = await getToken('ownerA');
    const tokenB = await getToken('ownerB');

    const created = await request(app)
      .post('/api/accounts')
      .set('Authorization', tokenA)
      .send(samples.investment);

    const res = await request(app)
      .put(`/api/accounts/${created.body._id}`)
      .set('Authorization', tokenB)
      .send({ ...samples.investment, name: 'Hijacked' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/accounts/:id', () => {
  it('deletes an account', async () => {
    const token = await getToken();

    const created = await request(app)
      .post('/api/accounts')
      .set('Authorization', token)
      .send(samples.loan);

    const del = await request(app)
      .delete(`/api/accounts/${created.body._id}`)
      .set('Authorization', token);

    expect(del.status).toBe(200);

    const list = await request(app).get('/api/accounts').set('Authorization', token);
    expect(list.body).toHaveLength(0);
  });

  it('returns 404 for a non-existent account', async () => {
    const token = await getToken();
    const res = await request(app)
      .delete('/api/accounts/000000000000000000000001')
      .set('Authorization', token);

    expect(res.status).toBe(404);
  });

  it('cannot delete another user\'s account', async () => {
    const tokenA = await getToken('delOwnerA');
    const tokenB = await getToken('delOwnerB');

    const created = await request(app)
      .post('/api/accounts')
      .set('Authorization', tokenA)
      .send(samples.credit_card);

    const res = await request(app)
      .delete(`/api/accounts/${created.body._id}`)
      .set('Authorization', tokenB);

    expect(res.status).toBe(404);

    // Account should still exist for ownerA
    const list = await request(app).get('/api/accounts').set('Authorization', tokenA);
    expect(list.body).toHaveLength(1);
  });
});
