var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var bluebird = require('bluebird');

var User = db.Model.extend({
  tableName: 'users',
  hasTimestamps: true,
  initialize: function () {
    this.on('creating', this.addPassword.bind(this));
  },
  addPassword: function (model) {
    var cipher = bluebird.promisify(bcrypt.hash);
    return cipher(model.attributes.__password, null, null).bind(this)
      .then(function (hash) {
        model.attributes.password = hash;
        delete model.attributes.__password;
        delete this.__password;
        this.password = hash;
      });
  },
  checkPassword: function (password) {
    var compare = bluebird.promisify(bcrypt.compare);
    return compare(this.get('password'), password)
      .then(function (isMatch) {
        return isMatch;
      });
  }
});

module.exports = User;