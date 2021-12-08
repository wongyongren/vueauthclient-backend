var db = require('../db');


module.exports = function () {

  db.serialize(function () {
    db.run("CREATE TABLE IF NOT EXISTS employee ( \
      userid INTEGER PRIMARY KEY AUTOINCREMENT,\
      username TEXT UNIQUE,\
      name TEXT ,\
      role TEXT,\
      password BLOB,\
      salt BLOB,\
      confirm_password BLOB\
    )");
    db.run("CREATE TABLE IF NOT EXISTS project ( \
      projectid INTEGER PRIMARY KEY AUTOINCREMENT,\
      projectname TEXT UNIQUE,\
      projectaddress TEXT \
    )");
    db.run("CREATE TABLE IF NOT EXISTS supervisor ( \
      supervisorid INTEGER PRIMARY KEY AUTOINCREMENT,\
      projectid INTEGER,\
      userid INTEGER, \
	    FOREIGN KEY (userid) REFERENCES employee(userid), \
	    FOREIGN KEY (projectid) REFERENCES project(projectid) \
    )");
    db.run("CREATE TABLE IF NOT EXISTS worker ( \
      workerid INTEGER PRIMARY KEY AUTOINCREMENT,\
      projectid INTEGER,\
      userid INTEGER, \
	    supervisorid INTEGER,\
	    FOREIGN KEY (userid) REFERENCES employee(userid), \
	    FOREIGN KEY (supervisorid) REFERENCES supervisor(supervisorid), \
	    FOREIGN KEY (projectid) REFERENCES project(projectid) \
    )");
  });



  //db.close();

};
