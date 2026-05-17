const mongoose = require('mongoose');
const { CATEGORIES, STATUSES } = require('../constants');
const { EMAIL_RE } = require('../lib/validators');

const JobRequestSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 140 },
    description: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: CATEGORIES,
      required: true,
    },
    location: { type: String, trim: true, default: '' },
    contactName: { type: String, trim: true, default: '' },
    contactEmail: {
      type: String,
      trim: true,
      default: '',
      validate: {
        validator: (v) => !v || EMAIL_RE.test(v),
        message: 'Invalid email address',
      },
    },
    status: {
      type: String,
      enum: STATUSES,
      default: 'Open',
    },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

module.exports = mongoose.model('JobRequest', JobRequestSchema);
