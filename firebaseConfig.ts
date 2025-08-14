// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {
  initializeAuth,

  // @ts-ignore
  getReactNativePersistence,
} from "firebase/auth";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCDx4P4mj-PeUbuum2i37nKQ2v23m5OqPE",
  authDomain: "fyp-assignment-e9457.firebaseapp.com",
  projectId: "fyp-assignment-e9457",
  storageBucket: "fyp-assignment-e9457.firebasestorage.app",
  messagingSenderId: "638940955914",
  appId: "1:638940955914:web:409c3f9fa3732f2caf26f3",
  measurementId: "G-W8CX71X44X"
};

const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
 
const db = getFirestore(app);

export { app, auth, db };