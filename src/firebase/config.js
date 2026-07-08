// src/firebase/config.js
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // Importamos Storage

// --- 1. CONFIGURACIÓN DEL PROYECTO DEL GRUPO (app-medica) ---
// Usado para: Autenticación (Auth) y Base de Datos (Firestore)
const firebaseConfigGroup = {
  apiKey: "REDACTED",
  authDomain: "app-medica-3d3be.firebaseapp.com",
  projectId: "app-medica-3d3be",
  storageBucket: "app-medica-3d3be.firebasestorage.app",
  messagingSenderId: "853797355557",
  appId: "1:853797355557:web:7264fb49f796b7770ebfcc",
  measurementId: "G-P9VGFBW5NE"
};

// --- 2. CONFIGURACIÓN DE TU PROYECTO PRIVADO (claridoc-backend-kevin) ---
// Usado para: Almacenamiento de Archivos (Storage)
const firebaseConfigPrivate = {
  apiKey: "REDACTED",
  authDomain: "claridoc-backend-kevin.firebaseapp.com",
  projectId: "claridoc-backend-kevin",
  storageBucket: "claridoc-backend-kevin.firebasestorage.app",
  messagingSenderId: "872417000402",
  appId: "1:872417000402:web:15e4c83b329e921f39e60b",
  measurementId: "G-6PD65WV2GX"
};

// --- INICIALIZACIÓN DE APPS ---

// 1. Inicializamos la App Principal (Grupo) normalmente
const appGroup = initializeApp(firebaseConfigGroup);

// 2. Inicializamos la App Secundaria (Privada)
// ¡IMPORTANTE!: Le damos un nombre ("privateApp") para que Firebase no se confunda
const appPrivate = initializeApp(firebaseConfigPrivate, "privateApp");


// --- EXPORTACIÓN DE SERVICIOS ---

// Auth y Firestore usan el proyecto del GRUPO
const auth = getAuth(appGroup);
export const db = getFirestore(appGroup);

// Storage usa TU proyecto PRIVADO (Aquí está el truco)
export const storage = getStorage(appPrivate);


// --- LÓGICA DE AUTENTICACIÓN (Se mantiene igual) ---

const googleProvider = new GoogleAuthProvider();

const handleGoogleLogin = async (setError) => {
    try {
        const result = await signInWithPopup(auth, googleProvider);
        console.log('Google Sign-In:', result.user);
        setError('');
    } catch (err) {
        console.log(err);
        setError('Google Sign-In failed');
    }
}

// HANDLE LOGIN USING EMAIL AND PASSWORD
const handleSubmit = async (e, setError) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        console.log('User signed in:', userCred.user);
        setError('');
    } catch (err) {
        console.log(err);
        setError('Usuario o contraseña invalido');
    }
    e.target.reset();
}

export { auth, googleProvider, handleGoogleLogin, handleSubmit };