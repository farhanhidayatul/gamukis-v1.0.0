import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile
} from "firebase/auth";
import { app } from "./firebaseConfig"; // Pastikan ini mengimpor app dari firebaseConfig.js

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Fungsi untuk mendeteksi perubahan status login
const observeAuthState = (callback) => {
  return onAuthStateChanged(auth, (user) => {
    callback(user);
  });
};

// Fungsi untuk login dengan Google
const signInWithGoogle = () => {
  return signInWithPopup(auth, provider)
    .then((result) => {
      return result.user;
    })
    .catch((error) => {
      throw error;
    });
};

// Fungsi untuk login anonim
const signInAnon = () => {
  return signInAnonymously(auth)
    .then((result) => {
      return result.user;
    })
    .catch((error) => {
      throw error;
    });
};

const signInWithEmail = (identifier, password) => {
  const email = identifier.trim();
  return signInWithEmailAndPassword(auth, email, password).then((result) => result.user);
};

const registerWithEmail = async ({ email, password, username }) => {
  const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (username.trim()) {
    await updateProfile(result.user, { displayName: username.trim() });
  }
  return result.user;
};

// Pastikan semua fungsi yang diperlukan diekspor
export {
  auth,
  observeAuthState,
  signInWithGoogle,
  signInAnon,
  signInWithEmail,
  registerWithEmail,
  onAuthStateChanged
};

