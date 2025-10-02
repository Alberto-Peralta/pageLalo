// Import the functions you need from the SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { getDatabase, ref, set, get, update, remove, onValue, off } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

// Your web app's Firebase configuration (UPDATED)
const firebaseConfig = {
  apiKey: "AIzaSyC2ElrNIrXrtydpZCe-ysoXfdoyITGjgZU",
  authDomain: "padrinosmg-30a2f.firebaseapp.com",
  databaseURL: "https://padrinosmg-30a2f-default-rtdb.firebaseio.com",
  projectId: "padrinosmg-30a2f",
  storageBucket: "padrinosmg-30a2f.firebasestorage.app",
  messagingSenderId: "628189112208",
  appId: "1:628189112208:web:7044ab9b9b96656a657515"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const database = getDatabase(app);

// Export Firebase services for use in other files
export { auth, database, ref, set, get, update, remove, onValue, off };

// Make Firebase services available globally for script.js
window.firebaseServices = {
  auth,
  database,
  ref,
  set,
  get,
  update,
  remove,
  onValue,
  off
};