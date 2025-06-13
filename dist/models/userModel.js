const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

//creating a user schema
const UserSchema = new mongoose.Schema({
  first_name: { type: String, required: true, trim: true, lowercase: true },
  last_name:  { type: String, required: true, trim: true, lowercase: true },
  email:      { type: String, required: true, unique: true, trim: true, lowercase: true },
  password:   { type: String, required: true }
},{
    timestamps: true,// Adds createdAt and updatedAt
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Password validation method
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);