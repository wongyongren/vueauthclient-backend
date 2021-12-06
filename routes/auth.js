var express = require('express');
var passport = require('passport');
const LocalStrategy = require('passport-local').Strategy
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;
var db = require('../db');
var router = express.Router();

/* GET users listing. */
router.get('/login', function (req, res, next) {
  res.render('login');
});

// router.post('/api/login', passport.authenticate('local', {
//   successRedirect: '/',
//   failureRedirect: '/login',
//   failureMessage: true
// }));

router.post("/api/login", (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }
    console.log(info)
    // console.log(req)
    console.log(user)
    if (!user) {
      return res.status(400).send([user, "Cannot log in", info])
    }

    req.login(user, (err) => {
      res.send("Logged in")
    })
  })(req, res, next)
})

// router.get("/api/user", authMiddleware, (req, res) => {
//   let user = users.find((user) => {
//       return user.id === req.session.passport.user
//   })
//   console.log([user, req.session])
//   res.send({user: user})
// })

// router.post('/api/login',
//   passport.authenticate('local'),
//   function(req, res) {
//     console.log(req)
//     // If this function gets called, authentication was successful.
//     // `req.user` contains the authenticated user.
//     res.redirect('/users/' + req.user.username);
//   });

/* GET users listing. */
router.get('/api/user',
  ensureLoggedIn(),
  function (req, res, next) {
    console.log(req.user)
    db.get('SELECT rowid AS id, username, name FROM employee WHERE rowid = ?', [req.user.id], function (err, row) {
      if (err) { return next(err); }

      // TODO: Handle undefined row.
      // console.log(err);
      console.log(req.user);
      console.log(row);
      var user = {
        id: row.id.toString(),
        username: row.username,
        displayName: row.name
      };
      res.send({ user: user });
    });
  });

router.get('/api/logout', function (req, res, next) {
  console.log("logged out")
  console.log(req.user)
  req.logOut();
  req.logout();
  console.log(req.user)
  res.send(req.user);
});

module.exports = router;
