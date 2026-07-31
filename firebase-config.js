// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDRWQYxeV2Hkize1Py7O4D-h2Av14sqMj4",
  authDomain: "wayfinder-onboarding.firebaseapp.com",
  databaseURL: "https://wayfinder-onboarding-default-rtdb.firebaseio.com",
  projectId: "wayfinder-onboarding",
  storageBucket: "wayfinder-onboarding.firebasestorage.app",
  messagingSenderId: "105454511155",
  appId: "1:105454511155:web:1cdc4b1294c7557fb46f46",
  measurementId: "G-F2NWFG505B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
