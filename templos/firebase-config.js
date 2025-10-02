// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCO3FRhSwH1xLABwVGFSd_YYrbFp0lQEv8",
  authDomain: "pagelalo-1b210.firebaseapp.com",
  databaseURL: "https://pagelalo-1b210-default-rtdb.firebaseio.com",
  projectId: "pagelalo-1b210",
  storageBucket: "pagelalo-1b210.firebasestorage.app",
  messagingSenderId: "1096735980204",
  appId: "1:1096735980204:web:8252ddb9fb484c398dfd09",
  measurementId: "G-ZD5R3QBH85"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const storage = getStorage(app);
const auth = getAuth(app);

export { app, database, storage, auth };