var express = require('express');
var passport = require('passport');
var crypto = require('crypto');
const LocalStrategy = require('passport-local').Strategy
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;
var db = require('../db');
var router = express.Router();
const isTeamSupervisor = require('./authMiddleware').isTeamSupervisor;
// const isAdmin = require('./authMiddleware').isAdmin;

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

      db.run('INSERT INTO user (username,name,role,password,confirm_password,salt) VALUES (?, ?, ?, ?, ?, ?)', [
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

router.post('/api/registeremployee', function (req, res, next) {
  //console.log(req.body)
  db.run('INSERT INTO employee (employeename,userid) VALUES (?, ?)', [
    req.body.username,
    req.body.workerid,
  ], function (err) {
    if (err) { return next(err); }
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

router.post('/api/assignproject', function (req, res, next) {
  db.all("SELECT teamid FROM team ORDER BY teamid ASC", function (err, res) {
    console.log(req.body)
    var i = res.length - 1;
    if (err) { console.log(err) }
    console.log(res.length)
    if (res == '') {
      var teamid = res + 1;
    } else {
      var teamid = parseInt(JSON.stringify(res[i].teamid)) + 1;
    }
    db.run('INSERT INTO team (teamname,description,projectid) VALUES (?, ?, ?)', [
      req.body.team,
      req.body.team,
      req.body.projectid,
    ], function (err) {
      if (err) { return next(err); } else {
        for (let i = 0; i < req.body.workerid.length; i++) {
          db.run('INSERT INTO team_member (teamid,roleid,employeeid,projectid) VALUES (?, 3, ?, ?)', [
            teamid,
            req.body.workerid[i],
            req.body.projectid
          ], function (err) {
            if (err) { return next(err); }
          });
        }
      }
    });
  });
});

router.post('/api/assignsupervisor', function (req, res, next) {
  db.run('UPDATE team_member SET roleid = 1 WHERE teamid = ? AND employeeid = ?', [
    req.body.team,
    req.body.workerid,
  ], function (err) {
    if (err) { return next(err); }
  });
});
// update team name
router.post('/api/updateteamname', function (req, res, next) {
  console.log(req.body)
  db.run('UPDATE team SET teamname = ? , description = ? WHERE teamid = ?', [
    req.body.teamname,
    req.body.teamdescription,
    req.body.teamid,
  ], function (err) {
    if (err) {
      console.log("error")
      return next(err);
    }
  });
});
// update team member
router.post('/api/updateteammember', function (req, res, next) {
  console.log(req.body)
  db.run('DELETE FROM team_member  WHERE teamid = ? AND roleid = 3', [
    req.body.teamid,
  ], function (err) {
    if (err) {
      console.log("error")
      return next(err);
    }
  });
  for (let i = 0; i < req.body.workerid.length; i++) {
    console.log(req.body.workerid[i],)
    db.run('INSERT INTO team_member (teamid,roleid,employeeid,projectid) VALUES (?, 3, ?, ?)', [
      req.body.teamid,
      req.body.workerid[i],
      req.body.projectid
    ], function (err) {
      if (err) { return next(err); }
    });
    res.end();
  }
});

router.post('/api/insertworkertime', function (req, res, next) {
  for (let i = 0; i < req.body.workerid.length; i++) {
    //console.log(req.body.workerid[i],)
    db.run('INSERT INTO worker_time (teamid,projectid,employeeid,datein,clockin,dateout,clockout) VALUES (?, ?, ?, ?, ?, ?, ?)', [
      req.body.teamid,
      req.body.projectid,
      req.body.workerid[i],
      req.body.datein,
      req.body.timein,
      req.body.dateout,
      req.body.timeout,
    ], function (err) {
      if (err) { res.status(500).json({ data: "Register Project Fail" }); return next(err); }
      else {
        res.json({ data: "Register Project Done" });
      }
    });

  }
});

router.post('/api/deleteteammember', function (req, res, next) {
  console.log(req.body)

  for (let i = 0; i < req.body.workerid.length; i++) {
    console.log(req.body.workerid[i],)
    db.run('DELETE FROM team_member  WHERE teamid = ? AND employeeid = ?', [
      req.body.teamid,
      req.body.workerid[i],
    ], function (err) {
      if (err) {
        console.log("error")
        return next(err);
      }
    });
    res.end();
  }
});

router.post('/api/deleteworkertime', function (req, res, next) {
  console.log(req.body)
  db.run('DELETE FROM worker_time  WHERE workertimeid = ?', [
    req.body.workertimeid,
  ], function (err) {
    if (err) {
      console.log("error")
      return next(err);
    }
  });
  res.status(200).send("Success")
});


router.post('/api/updateworkertime', function (req, res, next) {
  console.log(req.body)
  db.run('UPDATE worker_time SET datein = ? , dateout = ? , clockin = ? , clockout = ? WHERE workertimeid = ? ', [
    req.body.datein,
    req.body.dateout,
    req.body.clockin,
    req.body.clockout,
    req.body.workertimeid,
  ], function (err) {
    if (err) {
      return next(err);
    }
    res.status(200).send("Success")
  });
});

//user
router.post('/api/displayuser', function (req, res, next) {
  console.log(req.body)
  db.get('SELECT userid, username, name, role, password FROM user WHERE userid = ?', [req.body.userid], function (err, row) {
    if (err) {
      console.log(err)
      return next(err);
    }
    res.send(row);
  });
});

router.post('/api/deleteuser', function (req, res, next) {
  console.log(req.body)
  db.run('DELETE FROM user WHERE userid = ?', [
    req.body.userid,
  ], function (err) {
    if (err) {
      console.log("error")
      return next(err);
    }
  });
  res.status(200).send("Success")
});

router.post('/api/updateuser', function (req, res, next) {
  console.log(req.body)
  if (req.body.password != null) {
    db.run('UPDATE user SET username = ? , name = ? , role = ? , password = ? , confirm_password = ? , salt = ? WHERE userid = ? ', [
      req.body.username,
      req.body.name,
      req.body.role,
      req.body.password,
      req.body.confirm_password,
      req.body.salt,
      req.body.userid,
    ], function (err) {
      if (err) {
        return next(err);
      }
      res.status(200).send("Success with password")
    });
  } else {
    db.run('UPDATE user SET username = ? , name = ? , role = ? WHERE userid = ? ', [
      req.body.username,
      req.body.name,
      req.body.role,
      req.body.userid,
    ], function (err) {
      if (err) {
        return next(err);
      }
      res.status(200).send("Success without password")
    });
  }
});

//employee
router.post('/api/displayemployee', function (req, res, next) {
  console.log(req.body)

  db.get('SELECT employeeid, employeename, user.userid, name FROM employee join user on employee.userid = user.userid WHERE employeeid = ?', [req.body.employeeid], function (err, row) {
    if (err) {
      console.log(err)
      return next(err);
    }

    res.send(row);

  });

});

router.post('/api/deleteemployee', function (req, res, next) {
  console.log(req.body)
  db.run('DELETE FROM employee WHERE employeeid = ?', [
    req.body.employeeid,
  ], function (err) {
    if (err) {
      console.log("error")
      return next(err);
    }
  });
  res.status(200).send("Success")
});


router.post('/api/updateemployee', function (req, res, next) {
  console.log(req.body)
  db.run('UPDATE employee SET employeename = ? , userid = ? WHERE employeeid = ? ', [
    req.body.employeename,
    req.body.userid,
    req.body.employeeid,
  ], function (err) {
    if (err) {
      return next(err);
    }
    res.status(200).send("Success")
  });
});

//project
router.post('/api/displayproject', function (req, res, next) {
  console.log(req.body)
  db.get('SELECT projectid, projectname, projectaddress FROM project WHERE projectid = ?', [req.body.projectid], function (err, row) {
    if (err) {
      console.log(err)
      return next(err);
    }
    res.send(row);
  });
});

router.post('/api/deleteproject', function (req, res, next) {
  console.log(req.body)
  db.run('DELETE FROM project WHERE projectid = ?', [
    req.body.projectid,
  ], function (err) {
    if (err) {
      console.log("error")
      return next(err);
    }
  });
  res.status(200).send("Success")
});

router.post('/api/updateproject', function (req, res, next) {
  console.log(req.body)
  db.run('UPDATE project SET projectname = ? , projectaddress = ? WHERE projectid = ? ', [
    req.body.projectname,
    req.body.projectaddress,
    req.body.projectid,
  ], function (err) {
    if (err) {
      return next(err);
    }
    res.status(200).send("Success")
  });
});

//team
router.post('/api/displayteam', function (req, res, next) {
  console.log(req.body)
  db.get('SELECT teamid, teamname, description, team.projectid, projectname FROM team join  project on team.projectid = project.projectid  WHERE teamid = ?', [req.body.teamid], function (err, row) {
    if (err) {
      console.log(err)
      return next(err);
    }
    res.send(row);
  });
});

router.post('/api/deleteteam', function (req, res, next) {
  console.log(req.body)
  db.run('DELETE FROM team WHERE teamid = ?', [
    req.body.teamid,
  ], function (err) {
    if (err) {
      console.log("error")
      return next(err);
    }
  });
  res.status(200).send("Success")
});


router.post('/api/updateteam', function (req, res, next) {
  console.log(req.body)
  db.run('UPDATE team SET teamname = ? , description = ? , projectid = ?  WHERE teamid = ? ', [
    req.body.teamname,
    req.body.description,
    req.body.projectid,
    req.body.teamid,
  ], function (err) {
    if (err) {
      return next(err);
    }
    res.status(200).send("Success")
  });
});


router.post('/api/insertteammember', function (req, res, next) {
  console.log(req.body)
  for (let i = 0; i < req.body.workerid.length; i++) {
    console.log(req.body.workerid[i],)
    db.run('INSERT INTO team_member (teamid,roleid,employeeid,projectid) VALUES (?, 3, ?, ?)', [
      req.body.teamid,
      req.body.workerid[i],
      req.body.projectid,
    ], function (err) {
      if (err) {
        console.log("error")
        return next(err);
      }
    });
    res.end();
  }
});

router.post('/api/deleteteamsupervisor', function (req, res, next) {
  console.log(req.body)
  for (let i = 0; i < req.body.workerid.length; i++) {
    console.log(req.body.workerid[i],)
    db.run('UPDATE team_member SET roleid = 3 WHERE teamid = ? AND employeeid = ?', [
      req.body.teamid,
      req.body.workerid[i],
    ], function (err) {
      if (err) {
        console.log("error")
        return next(err);
      }
    });
    res.end();
  }
});

router.post('/api/insertteamsupervisor', function (req, res, next) {
  console.log(req.body)
  for (let i = 0; i < req.body.workerid.length; i++) {
    console.log(req.body.workerid[i],)
    db.run('UPDATE team_member SET roleid = 1 WHERE teamid = ? AND employeeid = ?', [
      req.body.teamid,
      req.body.workerid[i],
    ], function (err) {
      if (err) {
        console.log("error")
        return next(err);
      }
    });
    res.end();
  }
});

/* GET users listing. */
router.get('/api/user',
  ensureLoggedIn(),
  function (req, res, next) {
    console.log(req.user)
    db.get('SELECT rowid AS id, username, name, role FROM user WHERE rowid = ?', [req.user.id], function (err, row) {
      if (err) {
        console.log(err)
        return next(err);
      }
      if (req.user.role == 1) {
        var role = "admin"
      } else {
        var role = "user"
      }
      var user = {
        id: row.id.toString(),
        username: row.username,
        displayName: row.name,
        role: role
      };
      res.send({ user: user });

    });
  });

router.get('/api/supervisor',
  ensureLoggedIn(), isTeamSupervisor,
  function (req, res, next) {
    db.all('select user.name,user.userid,team_member.teamid,project.projectname,team.teamname,team.description,team.projectid FROM team_member JOIN employee ON team_member.employeeid = employee.employeeid JOIN user ON user.userid = employee.userid  JOIN team ON team_member.teamid = team.teamid JOIN project ON team.projectid = project.projectid WHERE team_member.roleid = 1 AND user.userid = ? order by team.projectid asc, team_member.teamid asc ', [req.user.id], function (err, row) {
      if (err) {
        console.log(err)
        return next(err);
      }
      console.log(row)
      res.json(row)
    });
  });

router.get('/api/supervisorandteam',
  ensureLoggedIn(), isTeamSupervisor,
  function (req, res, next) {
    db.all('SELECT teamid FROM user Natural JOIN employee Natural JOIN team_member where roleid = 1  ', [req.user.id], function (err, row) {
      if (err) {
        console.log(err)
        return next(err);
      }
      console.log(row)
      res.json(row)
    });
  });


router.post('/api/supervisorreportlist',
  // ensureLoggedIn(), 
  function (req, res, next) {
    console.log(req.body)
    db.all('SELECT workertimeid, datein, clockin, dateout, clockout, employeename, projectname, teamname FROM worker_time JOIN employee ON worker_time.employeeid = employee.employeeid JOIN project ON worker_time.projectid = project.projectid Join team ON worker_time.teamid = team.teamid WHERE datein = ? or datein = ? order by datein ASC,projectname ASC, teamname ASC,  clockin ASC ', [req.body.date, req.body.tomorrow], function (err, row) {
      if (err) {
        console.log(err)
        return next(err);
      }
      //console.log(data)
      res.json(row)
    });
  });

router.post('/api/reportlist',
  // ensureLoggedIn(), 
  function (req, res, next) {
    console.log(req.body)
    var currentsite = ""
    var currentTeam = ""
    db.all('SELECT workertimeid, datein, clockin, dateout, clockout, employeename, projectname, teamname FROM worker_time JOIN employee ON worker_time.employeeid = employee.employeeid JOIN project ON worker_time.projectid = project.projectid Join team ON worker_time.teamid = team.teamid WHERE datein = ? order by projectname ASC, teamname ASC, datein ASC, clockin ASC ', [req.body.date], function (err, row) {
      if (err) {
        console.log(err)
        return next(err);
      }
      var data = {}
      for (let i = 0; i < row.length; i++) {

        if (currentsite != row[i].projectname) {
          currentsite = row[i].projectname
          data[currentsite] = {}
          if (currentTeam != row[i].teamname) {
            currentTeam = row[i].teamname
            data[currentsite][currentTeam] = {}
          }
          data[currentsite][currentTeam][i] = {
            currentsite: row[i].projectname,
            id: row[i].workertimeid,
            projectname: row[i].projectname,
            employeename: row[i].employeename,
            datein: row[i].datein,
            clockin: row[i].clockin,
            dateout: row[i].dateout,
            clockout: row[i].clockout,
          }
        } else {
          if (currentTeam != row[i].teamname) {
            currentTeam = row[i].teamname
            data[currentsite][currentTeam] = {}
          }
          data[currentsite][currentTeam][i] = {
            currentsite: row[i].projectname,
            id: row[i].workertimeid,
            projectname: row[i].projectname,
            employeename: row[i].employeename,
            datein: row[i].datein,
            clockin: row[i].clockin,
            dateout: row[i].dateout,
            clockout: row[i].clockout,
          }
        }
      }
      //console.log(data)
      res.json(data)
    });
  });

router.get('/api/user1',
  ensureLoggedIn(),
  function (req, res, next) {
    //console.log(req.user)
    db.get('SELECT rowid AS id, username, name, role FROM user WHERE rowid = ?', [req.user.id], function (err, row) {
      if (err) { return next(err); }
      if (req.user.role == 1) {
        var role = "admin"
      } else {
        var role = "user"
      }
      var user = {
        id: row.id.toString(),
        username: row.username,
        displayName: row.name,
        role: role
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
    //console.log(row)
    res.json(row)
  });
});

router.get('/api/workername', function (req, res, next) {
  //console.log(req.user)
  db.all('SELECT * FROM user where role == "User"', function (err, row) {
    if (err) {
      console.log(err)
      return next(err);
    }
    //console.log(row)
    res.json(row)

  });
});

router.get('/api/username', function (req, res, next) {
  //console.log(req.user)
  db.all("SELECT * FROM user ", function (err, row) {
    if (err) {
      console.log(err)
      return next(err);
    }
    //console.log(row)
    res.json(row)

  });
});

router.get('/api/employeename', function (req, res, next) {
  //console.log(req.user)
  db.all('SELECT * FROM employee left join user on employee.userid = user.userid', function (err, row) {
    if (err) {
      console.log(err)
      return next(err);
    }
    //console.log(row)
    res.json(row)

  });
});

router.get('/api/teamworkername', function (req, res, next) {
  //console.log(req.user)
  db.all('SELECT * FROM user where role = "Supervisor" OR role = "User"', function (err, row) {
    if (err) {
      console.log(err)
      return next(err);
    }
    //console.log(row)
    res.json(row)

  });
});

// for supervisor name
router.post('/api/filtersupervisor', function (req, res, next) {
  console.log(req.body.projectid)
  db.all('select name,user.userid,teamid from team,user,project  where team.projectid = ?  and team.projectid = project.projectid  and user.userid = team.employeeid  and team.supervisororworker = 1', [req.body.projectid], function (err, row) {
    if (err) {
      console.log(err)
      return next(err);
    }
    //console.log(row)
    res.json(row)
  });
});

router.post('/api/filtersupervisor', function (req, res, next) {
  console.log(req.body.projectid)
  db.all('select name,user.userid,teamid from team,user,project  where team.projectid = ?  and team.projectid = project.projectid  and user.userid = team.employeeid  and team.supervisororworker = 1', [req.body.projectid], function (err, row) {
    if (err) {
      console.log(err)
      return next(err);
    }
    //console.log(row)
    res.json(row)
  });
});

router.post('/api/teamsupervisor', function (req, res, next) {
  console.log(req.body.teamid)
  db.all('select employee.employeename,employee.employeeid,team_member.teamid,project.projectname,team.teamname,team.description,team.projectid FROM TEAM JOIN project ON team.projectid = project.projectid JOIN team_member ON team_member.projectid = project.projectid JOIN employee ON team_member.employeeid = employee.employeeid WHERE team_member.teamid = ? and team.teamid = ? AND team_member.roleid = 1 ORDER BY employee.employeeid ASC', [req.body.teamid, req.body.teamid], function (err, row) {
    if (err) {
      console.log(err)
      return next(err);
    }
    //console.log(row)
    res.json(row)
  });
});

router.post('/api/filterteamworker', function (req, res, next) {
  console.log(req.body.teamid)
  db.all('select employee.employeename,employee.employeeid,team_member.teamid,project.projectname,team.teamname,team.description,team.projectid, employee.employeeid FROM team_member JOIN project ON team_member.projectid = project.projectid JOIN TEAM ON team.projectid = project.projectid JOIN employee ON team_member.employeeid = employee.employeeid WHERE team_member.teamid = ? and team.teamid = ? ORDER BY employee.employeeid ASC', [req.body.teamid, req.body.teamid], function (err, row) {
    if (err) {
      console.log(err)
      return next(err);
    }
    console.log(row)
    res.json(row)
  });
});

router.post('/api/getworkerdata', function (req, res, next) {
  console.log(req.body.projectid)
  db.all('select username,name,projectname,project.projectid,team.teamid from team,user,project  where team.projectid = ? and team.teamid = ? and team.projectid = project.projectid  and user.userid = team.employeeid  and team.supervisororworker = 0', [req.body.projectid, req.body.teamid], function (err, row) {
    if (err) {
      console.log(err)
      return next(err);
    }
    //console.log(row)
    res.json(row)
  });
});

router.post('/api/filterworker', function (req, res, next) {
  db.all('select name,user.userid,team_member.teamid,projectname,teamname,description,team.projectid from team,user,project ,team_member   where team_member.teamid = ?   and team_member.projectid = project.projectid    and user.userid = team_member.employeeid  and team_member.roleid = 3', [req.body.teamid], function (err, row) {
    if (err) {
      console.log(err)
      return next(err);
    }
    //console.log(row)
    res.json(row)
  });
});

router.post('/api/teaminfo', function (req, res, next) {
  db.all('select team.teamid,project.projectname,team.teamname,team.description,team.projectid FROM TEAM JOIN project ON team.projectid = project.projectid WHERE team.teamid = ?', [req.body.teamid], function (err, row) {
    if (err) {
      console.log(err)
      return next(err);
    }
    //console.log(row)
    res.json(row)
  });
});

// for worker name
router.get('/api/projectname', function (req, res, next) {
  //console.log(req.user)
  db.all("SELECT * FROM project", function (err, row) {
    if (err) {
      console.log(err)
      return next(err);
    }
    //console.log(row)
    res.json(row)
  });
});

router.get('/api/teamname', function (req, res, next) {
  //console.log(req.user)
  db.all("SELECT * FROM team join project ON team.projectid = project.projectid", function (err, row) {
    if (err) {
      console.log(err)
      return next(err);
    }
    //console.log(row)
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
