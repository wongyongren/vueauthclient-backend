var db = require('../db');


module.exports = function() {

  db.serialize(function() {
    db.run("CREATE TABLE IF NOT EXISTS employee ( \
      username TEXT UNIQUE,\
      name TEXT ,\
      role TEXT,\
      password BLOB,\
      salt BLOB,\
      confirm_password BLOB\
    )");
  });

  //db.close();

};
