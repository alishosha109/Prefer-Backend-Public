
var admin = require("firebase-admin");

var serviceAccount = require("./prefer-f2fad-firebase-adminsdk-4tprj-e464b7222c.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


module.exports = admin
