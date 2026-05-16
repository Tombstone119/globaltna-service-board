const express = require('express');
const mongoose = require('mongoose');
const JobRequest = require('../models/JobRequest');
const { CATEGORIES, STATUSES } = require('../constants');

const router = express.Router();

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

router.get('/', async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.q) {
      const re = new RegExp(escapeRegex(req.query.q), 'i');
      filter.$or = [{ title: re }, { description: re }];
    }
    const jobs = await JobRequest.find(filter).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: 'Job not found' });
    }
    const job = await JobRequest.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const body = req.body || {};
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    const category = typeof body.category === 'string' ? body.category.trim() : '';
    if (!title || !description || !category) {
      return res
        .status(400)
        .json({ error: 'title, description, and category are required' });
    }
    if (!CATEGORIES.includes(category)) {
      return res.status(400).json({ error: `category must be one of ${CATEGORIES.join(', ')}` });
    }
    const job = await JobRequest.create({
      title,
      description,
      category,
      location: body.location || '',
      contactName: body.contactName || '',
      contactEmail: body.contactEmail || '',
    });
    res.status(201).json(job);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: 'Job not found' });
    }
    const { status } = req.body || {};
    if (!status || !STATUSES.includes(status)) {
      return res
        .status(400)
        .json({ error: `status must be one of ${STATUSES.join(', ')}` });
    }
    const job = await JobRequest.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: 'Job not found' });
    }
    const job = await JobRequest.findByIdAndDelete(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
