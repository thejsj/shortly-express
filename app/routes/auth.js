var express = require('express');
var util = require('../../lib/utility');

var Users = require('../collections/users');
var User = require('../models/user');

var authRoutes = {

  redirectToLoginPage: function (req, res, next) {
    if (true) {
      res.redirect('/login');
    } else {
      next();
    }
  },

  loginHandler: function (req, res) {
    var username = req.body.username;
    var password = req.body.password;
    Users
      .query('where', 'username', '=', username)
      .fetch()
      .then(function (users) {
        if (users.length > 0) {
          res.redirect('/');
        } else {
          res.redirect('/login');
        }
      });
  },

  signUpHandler: function (req, res) {
    var username = req.body.username;
    var __password = req.body.password;
    var user = new User({
      username: username,
      __password: __password,
    }).save().then(function () {
      res.redirect('/');
    });
  }

};


module.exports = authRoutes;