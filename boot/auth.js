var passport = require('passport');
var Strategy = require('passport-local');
var crypto = require('crypto');
var db = require('../db');


module.exports = function() {

  // Configure the local strategy for use by Passport.
  //
  // The local strategy requires a `verify` function which receives the credentials
  // (`username` and `password`) submitted by the user.  The function must verify
  // that the password is correct and then invoke `cb` with a user object, which
  // will be set at `req.user` in route handlers after authentication.
  passport.use(new Strategy(function(username, password, cb) {
    db.get('SELECT rowid AS id, * FROM user WHERE username = ?', [ username ], function(err, row) {
      if (err) { return cb(err); }
      if (!row) { return cb(null, false, { message: 'Incorrect username or password.' }); }
      
      crypto.pbkdf2(password, row.salt, 310000, 32, 'sha256', function(err, hashedPassword) {
        if (err) { return cb(err); }
        if (!crypto.timingSafeEqual(row.password, hashedPassword)) {
          return cb(null, false, { message: 'Incorrect username or password.' });
        }
        console.log(row.id)
        db.all('SELECT roleid,teamid,userid from team_member where userid = ?',[row.id],function(err,res)
        {
          if (err) { return cb(err); }
          if (!res) { return cb(null, false, { message: 'Incorrect username or password.' }); }
          console.log(res[0].roleid)
          for (let i = 0; i < res.length; i++) {
            if(res[i].roleid == 1)
            {
              var roleid = "Supervisor"
              break
            }
            if (res[i].roleid == 2)
            {
              var roleid = "Admin"
              break
            }
            (res[i].roleid == 3)
            {
              var roleid = "User"
              //console.log("123")
            }
          }
          var user = {
            id: row.id.toString(),
            username: row.username,
            displayName: row.name,
            role:roleid,
          };
          return cb(null, user);
        })

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
  passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      cb(null, { id: user.id, username: user.username,role: user.role });
    });
  });

  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

};
