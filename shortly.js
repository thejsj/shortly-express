var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var session = require('express-session');

var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');
var authRoutes = require('./app/routes/auth');

var app = express();

app.use(session({
  secret: 'hiphipjorge',
  resave: false,
  saveUninitialized: true
}));

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static(__dirname + '/public'));

// If Authenticated
app.get('/',
  authRoutes.redirectToLoginPage,
  function (req, res) {
    res.render('index');
  });

app.get('/create',
  authRoutes.redirectToLoginPage,
  function (req, res) {
    res.render('index');
  });

app.get('/links',
  authRoutes.redirectToLoginPage,
  function (req, res) {
    Links.reset().fetch().then(function (links) {
      res.json(links.models);
    });
  });

app.post('/links',
  function (req, res) {
    var uri = req.body.url;
    if (!util.isValidUrl(uri)) {
      res.status(404).end();
    }
    new Link({
      url: uri
    }).fetch().then(function (found) {
      if (found) {
        res.json(found.attributes).end();
      } else {
        util.getUrlTitle(uri, function (err, title) {
          if (err) {
            res.status(404).end();
          }
          var link = new Link({
            url: uri,
            title: title,
            base_url: req.headers.origin
          });
          link.save().then(function (newLink) {
            Links.add(newLink);
            res.json(newLink).end();
          });
        });
      }
    });
  });

/************************************************************/
// Write your authentication routes here
/************************************************************/

app.get('/login',
  function (req, res) {
    res.render('login');
  });

app.post('/login', authRoutes.loginHandler);

app.get('/login',
  function (req, res) {
    res.render('signup');
  });

app.post('/signup', authRoutes.signUpHandler);


/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function (req, res) {
  new Link({
    code: req.params[0]
  }).fetch().then(function (link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function () {
        db.knex('urls')
          .where('code', '=', link.get('code'))
          .update({
            visits: link.get('visits') + 1,
          }).then(function () {
            return res.redirect(link.get('url'));
          });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);