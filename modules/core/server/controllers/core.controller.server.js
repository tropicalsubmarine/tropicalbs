'use strict';

var path = require('path');
var jwt = require('jwt-simple');

var Page = require(path.resolve('./modules/core/server/models/page.model.server.js'));
var User = require(path.resolve('./modules/core/server/models/user.models.server.js'));

var config = require(path.resolve('./lib/config'));

exports.renderIndex = function(req, res) {
  // Page.create({
  //   slug: '/test1',
  //   title: 'Page Title Test1',
  //   content: 'Content for the Test1 Page'
  // });
  Page.findAll()
   // TODO: Simplify the amount of content sent here
    .then(function (pages) {
      res.render(path.resolve('./modules/core/server/views/index.core.view.server.html'), {
        pages: pages
      });
    })
    .catch(function () {
      res.status(500).send('Unable to retrieve a list of pages.');
    });
};

exports.logIn = function(req, res) {
  var email = req.body.email.toLowerCase();
  var password = req.body.password;

  User.findOne({
    where: {
      email: email
    }
  })
  .then(function (user) {
    if (!user) {
      res.status(400).send('User does not exist or password is incorrect');
    } else {
      return user.comparePassword(password)
        .then(function (isMatch){
          if (isMatch) {
            var token = jwt.encode(user, config.secret);
            res.json({token: token});
          } else {
            res.status(400).send('User does not exist or password is incorrect');
          }
        });
    }
  })
  .catch(function (e) {
    res.status(500).send(e);
  });
};

exports.signUp = function (req, res) {
  var email = req.body.email.toLowerCase();
  var password = req.body.password;
  User.findOne({
    where: {
      email: email
    }
  })
  .then(function (user) {
    if (user) {
      res.status(400).send('User already exists');
    } else {
      User.create({
        email: email,
        password: password
      })
      .then(function (user) {
        var token = jwt.encode(user, config.secret);
        res.json({token: token});
      })
      .catch(function (e) {
        res.status(400).send(e.message);
      });
    }
  });
};

exports.checkAuth = function (req, res, next) {
  // this route has 'decode' as middleware. If the token was successfully decoded, req will have a 'user' property
  var token = req.headers['x-access-token'];
  if (!token) {
    res.status(403).send('no token provided');
    // next(new Error('No token'));
  } else {
    var user = jwt.decode(token, config.secret);
    User.findOne({email: user.email})
      .then(function (foundUser) {
        if (foundUser) {
          res.sendStatus(200);
        } else {
          res.status(401).send('User does not exist');
        }
      })
      .catch(function (e) {
        next(e);
      });
  }
};

exports.decode = function(req, res, next){
  var token = req.headers['x-access-token'];
  var user;

  if (!token) {
    return res.send(403); // send forbidden if a token is not provided
  }

  try {
    // decode token and attach user to the request
    // for use inside our controllers
    user = jwt.decode(token, config.secret);
    req.user = user;
    next();
  } catch(error) {
    return next(error);
  }
};
