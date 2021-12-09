var express = require('express');
var passport = require('passport');
var crypto = require('crypto');
const LocalStrategy = require('passport-local').Strategy
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;
var db = require('../db');
var router = express.Router();
const isUser = require('./authMiddleware').isUser;
const isAdmin = require('./authMiddleware').isAdmin;
const isAdminorSupervisor = require('./authMiddleware').isAdminorSupervisor;

/* GET users listing. */

router.post("/api/login", (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }
    console.log(user)

    if (!user) {
      return res.status(400).send([user, "Cannot log in", info])
    }

    req.login(user, (err) => {
      res.send(user)
    })
  })(req, res, next)
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
          displayName: req.body.name,
          role: req.body.role
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

router.post('/api/registerproject', function (req, res, next) {
  db.run('INSERT INTO project (projectname,projectaddress) VALUES (?, ?)', [
    req.body.projectname,
    req.body.projectadddress,
  ], function (err) {
    if (err) { return next(err); }
    var project = {
      id: this.lastID.toString(),
      projectname: req.body.projectname,
      projectaddress: req.body.projectaddress
    };
    req.login(project, function (err) {
      if (err) { return next(err); }
      res.send("Register Project Done")
      // res.redirect('/');
    });
  });


});



/* GET users listing. */
router.get('/api/user',
  ensureLoggedIn(), isAdminorSupervisor,
  function (req, res, next) {
    //console.log(req.user)
    db.get('SELECT rowid AS id, username, name, role FROM employee WHERE rowid = ?', [req.user.id], function (err, row) {
      if (err) {
        console.log(err)
        return next(err);
      }

      var user = {
        id: row.id.toString(),
        username: row.username,
        displayName: row.name,
        role: row.role
      };
      res.send({ user: user });

    });
  });

router.get('/api/user1',
  ensureLoggedIn(), isUser,
  function (req, res, next) {
    //console.log(req.user)
    db.get('SELECT rowid AS id, username, name, role FROM employee WHERE rowid = ?', [req.user.id], function (err, row) {
      if (err) { return next(err); }

      var user = {
        id: row.id.toString(),
        username: row.username,
        displayName: row.name,
        role: row.role
      };
      res.send({ user: user });

    });
  });

router.get('/api/projectname', function (req, res, next) {
  //console.log(req.user)
  db.all("SELECT * FROM project", function (err, row) {
    if (err) {
      console.log(err)
      return next(err);
    }
    console.log(row)
    res.json(row)
  });
});

router.get('/api/workername', function (req, res, next) {
  //console.log(req.user)
  db.all('SELECT * FROM employee where role = "Supervisor" OR role = "User"' ,function (err, row) {
    if (err) {
      console.log(err)
      return next(err);
    }
    console.log(row)
    res.json(row)

  });
});

router.get('/api/logout', function (req, res, next) {
  console.log("logged out")

  req.logOut();
  req.logout();

  res.send(req.user);
});

module.exports = router;
