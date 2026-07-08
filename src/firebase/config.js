/**
 * Configuración híbrida de Firebase con dos proyectos separados.
 *
 * Arquitectura:
 * - Proyecto GRUPO (app-medica-3d3be): Auth + Firestore
 * - Proyecto PRIVADO (claridoc-backend-kevin): Storage para archivos médicos
 *
 * Esto aísla los documentos sensibles en un proyecto independiente.
 */
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

/** Configuración del proyecto grupal para Auth y Firestore */
const firebaseConfigGroup = {
  apiKey: "REDACTED",
  authDomain: "app-medica-3d3be.firebaseapp.com",
  projectId: "app-medica-3d3be",
  storageBucket: "app-medica-3d3be.firebasestorage.app",
  messagingSenderId: "853797355557",
  appId: "1:853797355557:web:7264fb49f796b7770ebfcc",
  measurementId: "G-P9VGFBW5NE"
};

/** Configuración del proyecto privado para Storage de archivos */
const firebaseConfigPrivate = {
  apiKey: "REDACTED",
  authDomain: "claridoc-backend-kevin.firebaseapp.com",
  projectId: "claridoc-backend-kevin",
  storageBucket: "claridoc-backend-kevin.firebasestorage.app",
  messagingSenderId: "872417000402",
  appId: "1:872417000402:web:15e4c83b329e921f39e60b",
  measurementId: "G-6PD65WV2GX"
};

const appGroup = initializeApp(firebaseConfigGroup);
const appPrivate = initializeApp(firebaseConfigPrivate, "privateApp");

const auth = getAuth(appGroup);
export const db = getFirestore(appGroup);
export const storage = getStorage(appPrivate);

const googleProvider = new GoogleAuthProvider();

/**
 * Inicia sesión con Google mediante ventana emergente.
 * @param {Function} setError - Setter de estado para mostrar errores
 */
const handleGoogleLogin = async (setError) => {
    try {
        await signInWithPopup(auth, googleProvider);
        setError('');
    } catch (err) {
        console.log(err);
        setError('Google Sign-In failed');
    }
}

/**
 * Inicia sesión con email y contraseña.
 * @param {Event} e - Evento del formulario
 * @param {Function} setError - Setter de estado para mostrar errores
 */
const handleSubmit = async (e, setError) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        setError('');
    } catch (err) {
        console.log(err);
        setError('Usuario o contraseña invalido');
    }
    e.target.reset();
}

export { auth, googleProvider, handleGoogleLogin, handleSubmit };