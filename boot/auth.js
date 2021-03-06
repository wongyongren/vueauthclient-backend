var passport = require('passport');
var Strategy = require('passport-local');
var crypto = require('crypto');
var db = require('../db');


module.exports = function () {

  // Configure the local strategy for use by Passport.
  //
  // The local strategy requires a `verify` function which receives the credentials
  // (`username` and `password`) submitted by the user.  The function must verify
  // that the password is correct and then invoke `cb` with a user object, which
  // will be set at `req.user` in route handlers after authentication.
  passport.use(new Strategy(function (username, password, cb) {
    db.get('SELECT rowid AS id, * FROM user WHERE username = ?', [username], function (err, row) {
      if (err) { return cb(err); }
      if (!row) { return cb(null, false, { message: 'Incorrect username or password.' }); }


      console.log(row)
      crypto.pbkdf2(password, row.salt, 310000, 32, 'sha256', function (err, hashedPassword) {
        if (err) { return cb(err); }
        if (!crypto.timingSafeEqual(row.password, hashedPassword)) {
          return cb(null, false, { message: 'Incorrect username or password.' });
        }

        if (row.role == "Admin") { //admin

          var user = {
            id: row.id.toString(),
            username: row.username,
            displayName: row.name,
            //role: row.role,
            role: 1,
            teamrole: 0
          };

        } else {

          //db.get('select employee.employeeid,team_member.roleid FROM user JOIN employee ON user.userid = employee.userid JOIN team_member ON employee.employeeid = team_member.employeeid  WHERE user.userid = ? order by roleid asc', [row.id], function (err, res) {
            user = {
              id: row.id.toString(),
              username: row.username,
              displayName: row.name,
              role: 1,
              teamrole: 1
            };
          //});
        }

        return cb(null, user);
      });
    });
  }));


  // Configure Passport authenticated session persistence.
  //
  // In order to restore authentication state across HTTP requests, Passport needs
  // to serialize users into and deserialize users out of the session.  The
  // typical implementation of this is as simple as supplying the user ID when
  // serializing, and querying the user record by ID from the database when
  // deserializing.
  passport.serializeUser(function (user, cb) {
    process.nextTick(function () {
      cb(null, { id: user.id, username: user.username, role: user.role, teamrole: user.teamrole });
    });
  });

  passport.deserializeUser(function (user, cb) {
    process.nextTick(function () {
      return cb(null, user);
    });
  });

};
