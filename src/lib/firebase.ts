import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBibHecUjy9PW5mChl7NHYHA4KYmT9XwUI",
  authDomain: "first-app-9deea.firebaseapp.com",
  projectId: "first-app-9deea",
  storageBucket: "first-app-9deea.firebasestorage.app",
  messagingSenderId: "640696624734",
  appId: "1:640696624734:web:1183fd1d0b2ea9474e36cf",
};

// Initialize Firebase
let firebaseApp;
if (!getApps().length) {
  firebaseApp = initializeApp(firebaseConfig);
} else {
  firebaseApp = getApps()[0];
}

export const auth = getAuth(firebaseApp);
export const storage = getStorage(firebaseApp);
export const db = getFirestore(firebaseApp);
