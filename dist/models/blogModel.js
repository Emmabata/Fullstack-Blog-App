const mongoose = require('mongoose');

const BlogSchema = new mongoose.Schema({
  title:        { type: String, required: true, unique: true },
  description:  { type: String },
  tags:         [{ type: String }],
  author:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  state:        { type: String, enum: ['draft', 'published'], default: 'draft' },
  read_count:   { type: Number, default: 0 },
  reading_time: { type: String }, // We'll compute this
  body:         { type: String, required: true },
  timestamp:    { type: Date, default: Date.now }
});

module.exports = mongoose.model('Blog', BlogSchema);
