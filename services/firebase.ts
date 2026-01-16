import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import 'firebase/compat/auth';

// TODO: Replace with your actual Firebase configuration
// Get these from Firebase Console > Project Settings > General > Your Apps
const firebaseConfig = {
  apiKey: "AIzaSyD-YOUR-API-KEY-HERE",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Check if config is valid (not using placeholders)
export const isFirebaseEnabled = firebaseConfig.projectId !== "your-project-id";

let app;
let db: firebase.firestore.Firestore | null = null;
let auth: firebase.auth.Auth | null = null;

if (isFirebaseEnabled) {
  try {
    // Check if firebase is already initialized to avoid "Firebase App named '[DEFAULT]' already exists" error
    if (!firebase.apps.length) {
      app = firebase.initializeApp(firebaseConfig);
    } else {
      app = firebase.app();
    }
    db = firebase.firestore();
    auth = firebase.auth();
    console.log("Firebase initialized");
  } catch (error) {
    console.warn("Firebase initialization error, falling back to local mode:", error);
  }
} else {
  console.log("Running in Local Demo Mode (Firebase config is placeholder)");
}

export { db, auth };