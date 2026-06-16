// ── VIPER Firebase config ───────────────────────────────────────────────
// Paste your project's values below. Get them from:
// Firebase console → Project settings (gear icon) → General →
// "Your apps" → the web app you registered → SDK setup and configuration.
//
// These values are NOT secret — Firebase is designed so the API key can be
// public. The real access control lives in your Firestore Rules (set in
// the console), not in hiding this file.

export const firebaseConfig = {
  apiKey: "AIzaSyAB_EozUMPkrS54CUhzML0TKDFzg4yS_Zk",
  authDomain: "vipers-war-room.firebaseapp.com",
  projectId: "vipers-war-room",
  storageBucket: "vipers-war-room.firebasestorage.app",
  messagingSenderId: "79260094299",
  appId: "1:79260094299:web:30e4c01622ecdce6a4547e",
  measurementId: "G-PXMXQSKSXM"
};

// Must exactly match (a) the email of the user you created in
// Authentication → Users, and (b) the email written into your Firestore
// Rules. This is just used for friendly UI messages — the real enforcement
// is the Firestore Rules themselves.
export const ADMIN_EMAIL = "reverse.swoosh.gaming96@gmail.com";
