const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  Email: {
    type: String,
    required: true
  },
  ClerkId: {
    type: String,
    required: true
  },
  LName: {
    type: String,
    required: true
  },
  FName: {
    type: String,
    required: true
  },
  Picture: {
    type: String,
    required: true
  },
  HasImage: {
    type: Boolean,
    required: true
  },
  Phone: {
    type: String,
    required: true
  }
}, { timestamps: true });

// const User = mongoose.model('User', userSchema);
const User = mongoose.models.User || mongoose.model("User", UserSchema);

module.exports = User;
