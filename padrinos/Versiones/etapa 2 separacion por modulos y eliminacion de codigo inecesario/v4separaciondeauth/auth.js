// Authentication Module
// Get Firebase services from the global configuration
const auth = window.firebaseServices.auth;

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
        
        const credential = firebase.auth.EmailAuthProvider.credential(user.email, password);
        await user.reauthenticateWithCredential(credential);
        return true;
    } catch (error) {
        console.log('Password validation failed:', error.code);
        return false;
    }
};

// Admin Functions
const checkAdminStatus = async (userId) => {
    try {
        return new Promise((resolve) => {
            window.firebaseServices.database.ref('admins').once('value', (snapshot) => {
                const admins = snapshot.val();
                const isAdmin = admins && admins[userId] === true;
                console.log('Admin check result:', isAdmin);
                resolve(isAdmin);
            }, (error) => {
                console.error("Error checking admin status:", error);
                showToast('Error al verificar permisos', 'error');
                resolve(false);
            });
        });
    } catch (error) {
        console.error("Error checking admin status:", error);
        showToast('Error al verificar permisos de administrador', 'error');
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
        await auth.signInWithEmailAndPassword(email, password);
        showToast('Sesión iniciada correctamente');
    } catch (error) {
        let msg = "Error desconocido";
        if (error.code === 'auth/user-not-found') msg = "Usuario no encontrado";
        else if (error.code === 'auth/wrong-password') msg = "Contraseña incorrecta";
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
        await auth.signOut(); 
        showToast('Sesión cerrada'); 
    } 
    catch (error) { 
        showToast('Error al cerrar sesión', 'error'); 
    }
});

// Auth State Change Handler
auth.onAuthStateChanged(async (user) => {
    if (user) {
        userId = user.uid;
        userEmail.textContent = user.email;
        const isAdmin = await checkAdminStatus(userId);
        if (!isAdmin) {
            await auth.signOut();
            loginError.textContent = "No tienes permisos para acceder.";
            loginError.classList.remove('hidden');
            return;
        }
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
    checkAdminStatus,
    getUserId: () => userId
};

// Export showToast to global scope
window.showToast = showToast;