const admin = require('firebase-admin');
const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');
const jwt = require('jsonwebtoken');

// Replace with your Google and Facebook client IDs/secrets
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Email/password signup
exports.signup = async (req, res) => {
    const { email, password } = req.body;
    try {
        const userRecord = await admin.auth().createUser({ email, password });
        const token = jwt.sign({ uid: userRecord.uid, email }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Email/password login
exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        // Firebase Admin SDK does not support password verification directly
        // Use Firebase Auth REST API
        const resp = await axios.post(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
            { email, password, returnSecureToken: true });
        const { localId: uid } = resp.data;
        const token = jwt.sign({ uid, email }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token });
    } catch (err) {
        res.status(401).json({ error: 'Invalid credentials' });
    }
};

// Google OAuth
exports.googleAuth = (req, res) => {
    const redirect = encodeURIComponent(`${req.protocol}://${req.get('host')}/auth/google/callback`);
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${redirect}&response_type=code&scope=profile email`;
    res.redirect(url);
};

exports.googleCallback = async (req, res) => {
    const code = req.query.code;
    const redirect = `${req.protocol}://${req.get('host')}/auth/google/callback`;
    try {
        // Exchange code for tokens
        const { data } = await axios.post('https://oauth2.googleapis.com/token', {
            code,
            client_id: GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: redirect,
            grant_type: 'authorization_code',
        });
        // Get user info
        const { data: profile } = await axios.get(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${data.access_token}`);
        // Create or get user in Firebase
        let userRecord;
        try {
            userRecord = await admin.auth().getUserByEmail(profile.email);
        } catch {
            userRecord = await admin.auth().createUser({ email: profile.email });
        }
        const token = jwt.sign({ uid: userRecord.uid, email: profile.email }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token });
    } catch (err) {
        res.status(400).json({ error: 'Google authentication failed' });
    }
};

// Facebook OAuth
exports.facebookAuth = (req, res) => {
    const redirect = encodeURIComponent(`${req.protocol}://${req.get('host')}/auth/facebook/callback`);
    const url = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${redirect}&scope=email`;
    res.redirect(url);
};

exports.facebookCallback = async (req, res) => {
    const code = req.query.code;
    const redirect = `${req.protocol}://${req.get('host')}/auth/facebook/callback`;
    try {
        // Exchange code for access token
        const { data } = await axios.get(`https://graph.facebook.com/v19.0/oauth/access_token`, {
            params: {
                client_id: FACEBOOK_APP_ID,
                client_secret: FACEBOOK_APP_SECRET,
                redirect_uri: redirect,
                code,
            },
        });
        // Get user info
        const { data: profile } = await axios.get(`https://graph.facebook.com/me?fields=id,name,email&access_token=${data.access_token}`);
        // Create or get user in Firebase
        let userRecord;
        try {
            userRecord = await admin.auth().getUserByEmail(profile.email);
        } catch {
            userRecord = await admin.auth().createUser({ email: profile.email });
        }
        const token = jwt.sign({ uid: userRecord.uid, email: profile.email }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token });
    } catch (err) {
        res.status(400).json({ error: 'Facebook authentication failed' });
    }
};
