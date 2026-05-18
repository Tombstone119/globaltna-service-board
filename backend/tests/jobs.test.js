const request = require('supertest');
const jwt = require('jsonwebtoken');
const createApp = require('../src/app');
const { connect, disconnect, clear } = require('./setup/db');
const JobRequest = require('../src/models/JobRequest');

const app = createApp();

function authHeader(payload = { sub: 'user-1', email: 'tester@example.com' }) {
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
  return { Authorization: `Bearer ${token}` };
}

beforeAll(connect);
afterAll(disconnect);
afterEach(clear);

const validJob = {
  title: 'Fix the boiler',
  description: 'No hot water since yesterday.',
  category: 'Plumbing',
  location: 'SW11 · Battersea',
  contactName: 'Helen',
  contactEmail: 'helen@example.com',
};

describe('GET /api/jobs', () => {
  it('returns an empty array when no jobs exist', async () => {
    const res = await request(app).get('/api/jobs');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns all jobs, newest first', async () => {
    await JobRequest.create({ ...validJob, title: 'Old' });
    await new Promise((r) => setTimeout(r, 5));
    await JobRequest.create({ ...validJob, title: 'New' });

    const res = await request(app).get('/api/jobs');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].title).toBe('New');
    expect(res.body[1].title).toBe('Old');
  });

  it('filters by category', async () => {
    await JobRequest.create({ ...validJob, category: 'Plumbing' });
    await JobRequest.create({ ...validJob, category: 'Electrical' });

    const res = await request(app).get('/api/jobs?category=Electrical');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].category).toBe('Electrical');
  });

  it('filters by status', async () => {
    await JobRequest.create({ ...validJob, status: 'Open' });
    await JobRequest.create({ ...validJob, status: 'Closed' });

    const res = await request(app).get('/api/jobs?status=Closed');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].status).toBe('Closed');
  });

  it('supports keyword search across title and description', async () => {
    await JobRequest.create({ ...validJob, title: 'Leaking kitchen tap', description: 'drip drip' });
    await JobRequest.create({ ...validJob, title: 'Paint bedroom', description: 'matt finish' });

    const res = await request(app).get('/api/jobs?q=kitchen');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toMatch(/kitchen/i);
  });
});

describe('GET /api/jobs/:id', () => {
  it('returns 404 for an invalid ObjectId', async () => {
    const res = await request(app).get('/api/jobs/not-an-id');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Job not found');
  });

  it('returns 404 for a well-formed id that does not exist', async () => {
    const res = await request(app).get('/api/jobs/507f1f77bcf86cd799439011');
    expect(res.status).toBe(404);
  });

  it('returns the job when found', async () => {
    const job = await JobRequest.create(validJob);
    const res = await request(app).get(`/api/jobs/${job._id}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe(validJob.title);
  });
});

describe('POST /api/jobs', () => {
  it('rejects unauthenticated requests with 401', async () => {
    const res = await request(app).post('/api/jobs').send(validJob);
    expect(res.status).toBe(401);
  });

  it('rejects requests with an invalid token', async () => {
    const res = await request(app)
      .post('/api/jobs')
      .set('Authorization', 'Bearer not-a-real-token')
      .send(validJob);
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid token');
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/jobs')
      .set(authHeader())
      .send({ title: 'Just a title' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/i);
  });

  it('returns 400 for an invalid category', async () => {
    const res = await request(app)
      .post('/api/jobs')
      .set(authHeader())
      .send({ ...validJob, category: 'Skydiving' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/category/i);
  });

  it('creates a job and returns 201', async () => {
    const res = await request(app).post('/api/jobs').set(authHeader()).send(validJob);
    expect(res.status).toBe(201);
    expect(res.body._id).toBeDefined();
    expect(res.body.title).toBe(validJob.title);
    expect(res.body.status).toBe('Open');
    expect(res.body.createdAt).toBeDefined();

    const stored = await JobRequest.findById(res.body._id);
    expect(stored).not.toBeNull();
  });

  it('trims whitespace on title and description', async () => {
    const res = await request(app)
      .post('/api/jobs')
      .set(authHeader())
      .send({ ...validJob, title: '   Fix tap   ', description: '   leaking   ' });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Fix tap');
    expect(res.body.description).toBe('leaking');
  });
});

describe('PATCH /api/jobs/:id', () => {
  it('requires auth', async () => {
    const job = await JobRequest.create(validJob);
    const res = await request(app).patch(`/api/jobs/${job._id}`).send({ status: 'Closed' });
    expect(res.status).toBe(401);
  });

  it('returns 400 for an invalid status value', async () => {
    const job = await JobRequest.create(validJob);
    const res = await request(app)
      .patch(`/api/jobs/${job._id}`)
      .set(authHeader())
      .send({ status: 'Done' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when status is missing', async () => {
    const job = await JobRequest.create(validJob);
    const res = await request(app)
      .patch(`/api/jobs/${job._id}`)
      .set(authHeader())
      .send({});
    expect(res.status).toBe(400);
  });

  it('updates the status', async () => {
    const job = await JobRequest.create(validJob);
    const res = await request(app)
      .patch(`/api/jobs/${job._id}`)
      .set(authHeader())
      .send({ status: 'In Progress' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('In Progress');
  });

  it('does not mutate fields other than status', async () => {
    const job = await JobRequest.create(validJob);
    const res = await request(app)
      .patch(`/api/jobs/${job._id}`)
      .set(authHeader())
      .send({ status: 'Closed', title: 'TAMPERED' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe(validJob.title);
  });

  it('returns 404 for an invalid id', async () => {
    const res = await request(app)
      .patch('/api/jobs/not-real')
      .set(authHeader())
      .send({ status: 'Closed' });
    expect(res.status).toBe(404);
  });

  it('returns 404 when the job does not exist', async () => {
    const res = await request(app)
      .patch('/api/jobs/507f1f77bcf86cd799439011')
      .set(authHeader())
      .send({ status: 'Closed' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/jobs/:id', () => {
  it('requires auth', async () => {
    const job = await JobRequest.create(validJob);
    const res = await request(app).delete(`/api/jobs/${job._id}`);
    expect(res.status).toBe(401);
  });

  it('deletes the job and returns 204', async () => {
    const job = await JobRequest.create(validJob);
    const res = await request(app).delete(`/api/jobs/${job._id}`).set(authHeader());
    expect(res.status).toBe(204);

    const after = await JobRequest.findById(job._id);
    expect(after).toBeNull();
  });

  it('returns 404 for an invalid id', async () => {
    const res = await request(app).delete('/api/jobs/nope').set(authHeader());
    expect(res.status).toBe(404);
  });

  it('returns 404 when the job does not exist', async () => {
    const res = await request(app)
      .delete('/api/jobs/507f1f77bcf86cd799439011')
      .set(authHeader());
    expect(res.status).toBe(404);
  });
});
