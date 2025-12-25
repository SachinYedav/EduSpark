// 1. Imports 
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail, updateProfile, updatePassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";

import { getFirestore, collection, getDocs, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 2. Configuration 
const firebaseConfig = {
  apiKey: "AIzaSyCUkOaDeJqjbPcyEbGSEbJOdeWoveLRovs", 
  authDomain: "eduspark-web.firebaseapp.com",
  projectId: "eduspark-web",
  storageBucket: "eduspark-web.firebasestorage.app",
  messagingSenderId: "43045462590",
  appId: "1:43045462590:web:16ebcaac85ab625369e76f",
  measurementId: "G-27KRZ08D3E"
};

// 3. Initialize
const app = initializeApp(firebaseConfig);
const storage = getStorage(app); 
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// 4. Exports 
export { 
    auth, db,storage, 
    createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail, updateProfile, updatePassword,
    collection, getDocs, 
    doc, getDoc, setDoc 
};