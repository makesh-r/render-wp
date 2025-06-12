const admin = require("firebase-admin");

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert("/etc/secrets/firebaseConfig.json"),
    });
}

export const db = admin.firestore();
