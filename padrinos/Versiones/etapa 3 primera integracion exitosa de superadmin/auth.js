// Import services from your config file
import { auth, database } from './firebase-config.js';
// Import functions from Firebase SDK
import { signInWithEmailAndPassword, onAuthStateChanged, signOut, EmailAuthProvider, reauthenticateWithCredential } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { ref, get } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-database.js";

// Authentication DOM Elements
const loginScreen = document.getElementById('loginScreen');
const mainApp = document.getElementById('mainApp');
const loginForm = document.getElementById('loginForm');
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const loginBtn = document.getElementById('loginBtn');
const loginText = document.getElementById('loginText');
const loginSpinner = document.getElementById('loginSpinner');
const loginError = document.getElementById('loginError');
const userEmail = document.getElementById('userEmail');
const logoutBtn = document.getElementById('logoutBtn');

// Global variables for main app
let userId = null;

// Utility Functions
const showToast = (message, type = 'success') => {
    const toast = document.getElementById('toast');
    const toastIcon = document.getElementById('toast-icon');
    const toastMessage = document.getElementById('toast-message');
    
    toast.className = `toast ${type} show`;
    const icons = {
        success: 'fas fa-check-circle mr-2',
        error: 'fas fa-exclamation-circle mr-2',
        warning: 'fas fa-exclamation-triangle mr-2',
        info: 'fas fa-info-circle mr-2'
    };
    toastIcon.className = icons[type] || icons.info;
    toastMessage.textContent = message;
    setTimeout(() => { toast.className = 'toast hidden'; }, 3000);
};

// Function to validate password with Firebase Auth
const validatePassword = async (password) => {
    try {
        const user = auth.currentUser;
        if (!user) return false;
        
        const credential = EmailAuthProvider.credential(user.email, password);
        await reauthenticateWithCredential(user, credential);
        return true;
    } catch (error) {
        console.log('Password validation failed:', error.code);
        return false;
    }
};

// Login Form Event Listener
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = loginEmail.value.trim();
    const password = loginPassword.value;
    
    loginText.textContent = "Iniciando...";
    loginSpinner.classList.remove('hidden');
    loginError.classList.add('hidden');
    loginBtn.disabled = true;
    
    try {
        await signInWithEmailAndPassword(auth, email, password);
        showToast('Sesión iniciada correctamente');
    } catch (error) {
        let msg = "Error desconocido";
        if (error.code === 'auth/user-not-found') msg = "Usuario no encontrado";
        else if (error.code === 'auth/wrong-password') msg = "Contraseña incorrecta";
        else if (error.code === 'auth/invalid-email') msg = "Email inválido";
        else if (error.code === 'auth/user-disabled') msg = "Usuario deshabilitado";
        else if (error.code === 'auth/too-many-requests') msg = "Demasiados intentos. Intenta más tarde";
        else msg = "Error al iniciar sesión";
        
        loginError.textContent = msg;
        loginError.classList.remove('hidden');
    } finally {
        loginText.textContent = "Iniciar Sesión";
        loginSpinner.classList.add('hidden');
        loginBtn.disabled = false;
    }
});

// Logout Button Event Listener
logoutBtn.addEventListener('click', async () => {
    try { 
        await signOut(auth);
        showToast('Sesión cerrada'); 
    } 
    catch (error) { 
        showToast('Error al cerrar sesión', 'error'); 
    }
});

// Auth State Change Handler - Simplified (no admin check)
onAuthStateChanged(auth, async (user) => {
    if (user) {
        userId = user.uid;
        userEmail.textContent = user.email;
        
        loginScreen.classList.add('hidden');
        mainApp.classList.remove('hidden');
        
        // Initialize main app if function exists
        if (typeof initializeMainApp === 'function') {
            initializeMainApp(userId);
        }
    } else {
        loginScreen.classList.remove('hidden');
        mainApp.classList.add('hidden');
    }
});

// Export functions for use in main app
window.authModule = {
    validatePassword,
    getUserId: () => userId
};

// Export showToast to global scope
window.showToast = showToast;