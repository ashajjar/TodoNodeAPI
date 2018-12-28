const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');

var UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    unique: true,
    validate: {
      validator: validator.isEmail,
      message: '{VALUE} is not a valid email'
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  tokens: [{
    access: {
      type: String,
      required: true
    },
    token: {
      type: String,
      required: true
    }
  }]
});

UserSchema.methods.toJSON = function () {
  return _.pick(this.toObject(), ['_id', 'email']);
};

UserSchema.methods.generateAuthToken = function () {
  var access = 'auth';
  var token = jwt.sign({ _id: this._id.toHexString(), access }, process.env.SECRET).toString();
  this.tokens = this.tokens.concat([{ access, token }]);
  return this.save().then(() => {
    return token;
  });
};

UserSchema.statics.findOneByToken = function (token) {
  let res;

  try {
    res = jwt.verify(token, process.env.SECRET);
  } catch (e) {
    return Promise.reject();
  }

  return this.findOne({
    '_id': res._id,
    'tokens.access': res.access,
    'tokens.token': token
  });
};

UserSchema.pre('save', function (next) {
  if (this.isModified('password')) {
    console.log('pass changed');
    let salt = bcrypt.genSaltSync(10);
    let hash = bcrypt.hashSync(this.password, salt);
    this.password = hash;
  }
  next();
});

var User = mongoose.model('User', UserSchema);

module.exports = { User }
