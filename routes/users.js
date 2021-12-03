var express = require('express');
var crypto = require('crypto');
var db = require('../db');

var router = express.Router();

router.get('/new', function (req, res, next) {
  res.render('signup');
});

router.post('/api/register', function (req, res, next) {
  var salt = crypto.randomBytes(16);
  crypto.pbkdf2(req.body.password, salt, 310000, 32, 'sha256', function (err, hashedPassword) {
    if (err) { return next(err); }
    crypto.pbkdf2(req.body.confirm_password, salt, 310000, 32, 'sha256', function (err, hashedConfirmPassword) {
      if (err) { return next(err); }

      db.run('INSERT INTO employee (username,name,role,password,confirm_password,salt) VALUES (?, ?, ?, ?, ?, ?)', [
        req.body.username,
        req.body.name,
        req.body.role,
        hashedPassword,
        hashedConfirmPassword,
        salt
      ], function (err) {
        if (err) { return next(err); }

        var user = {
          id: this.lastID.toString(),
          username: req.body.username,
          displayName: req.body.name
        };
        req.login(user, function (err) {
          if (err) { return next(err); }
          res.send("Register Done")
          // res.redirect('/');
        });
      });
    });
  });
});

module.exports = router;
