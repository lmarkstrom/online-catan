// src/lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getFunctions } from "firebase/functions";
import { firebaseConfig } from "./firebaseConfig";

const app = initializeApp(firebaseConfig);

// Export services to use in your app
export const db = getFirestore(app);
export const auth = getAuth(app);
export const functions = getFunctions(app);