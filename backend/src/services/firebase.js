const admin = require('firebase-admin');
const path = require('path');

// ✅ Use absolute path to ensure the key is found correctly
const serviceAccount = require(path.join(__dirname, 'serviceAccountKey.json'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const auth = admin.auth();

// ✅ Export using CommonJS (matches your index.js require)
module.exports = { admin, db, auth };
