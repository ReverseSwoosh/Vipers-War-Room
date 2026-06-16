// ── VIPER shared auth/token module ─────────────────────────────────────
// Loaded as a JS module by both index.html (token gate) and admin.html
// (the admin panel). Exposes a small API on window.viperAuth so the
// classic <script> blocks in those pages can call it without dealing
// with module import/export themselves.

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import {
  getFirestore, doc, getDoc, setDoc, deleteDoc, collection, getDocs, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import {
  getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import { firebaseConfig, ADMIN_EMAIL } from "./firebase-config.js";

const app  = initializeApp(firebaseConfig);
const db   = getFirestore(app);
const auth = getAuth(app);

// Unambiguous charset (no 0/O/1/l/I confusion) for tokens people will type or paste.
// Rejection sampling avoids the slight modulo bias you'd get from `byte % 31`.
function randomToken(len = 14) {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789"; // 31 chars
  const n = chars.length;
  const limit = Math.floor(256 / n) * n;
  let out = "";
  while (out.length < len) {
    const buf = new Uint8Array(len - out.length);
    crypto.getRandomValues(buf);
    for (const b of buf) { if (b < limit) out += chars[b % n]; }
  }
  return out;
}

/* ---------- used by index.html (regular members) ---------- */
async function checkToken(token) {
  const t = String(token || "").trim().toLowerCase();
  if (!t) return { ok: false };
  try {
    const snap = await getDoc(doc(db, "tokens", t));
    if (!snap.exists()) return { ok: false };
    const d = snap.data();
    if (d.active === false) return { ok: false, revoked: true };
    return { ok: true, name: d.name || "", token: t };
  } catch (e) {
    console.error("checkToken failed", e);
    return { ok: false, error: true };
  }
}

/* ---------- used by admin.html (you only) ---------- */
function adminLogin(email, password) { return signInWithEmailAndPassword(auth, email, password); }
function adminLogout() { return signOut(auth); }
function onAdmin(cb) {
  onAuthStateChanged(auth, user => {
    const isAdmin = !!user && !!user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
    cb(isAdmin, user);
  });
}
async function listTokens() {
  const out = [];
  const snap = await getDocs(collection(db, "tokens"));
  snap.forEach(s => out.push({ id: s.id, ...s.data() }));
  out.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  return out;
}
async function createToken(name) {
  let t = randomToken();
  for (let i = 0; i < 3; i++) {           // astronomically unlikely, but avoid any collision
    const ex = await getDoc(doc(db, "tokens", t));
    if (!ex.exists()) break;
    t = randomToken();
  }
  await setDoc(doc(db, "tokens", t), {
    name: String(name || "").trim() || "Unnamed",
    active: true,
    createdAt: serverTimestamp(),
  });
  return t;
}
async function setActive(token, active) {
  await setDoc(doc(db, "tokens", token), { active }, { merge: true });
}
async function deleteToken(token) { await deleteDoc(doc(db, "tokens", token)); }
async function resetToken(oldToken, name) {
  // Create the replacement first — if this fails, the old token still works
  // and nobody gets locked out mid-reset.
  const fresh = await createToken(name);
  await deleteToken(oldToken);
  return fresh;
}

window.viperAuth = {
  checkToken, adminLogin, adminLogout, onAdmin,
  listTokens, createToken, setActive, deleteToken, resetToken,
  ADMIN_EMAIL,
};
window.dispatchEvent(new Event("viperAuthReady"));
