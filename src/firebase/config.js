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

/** Lee las variables de entorno (VITE_) definidas en .env */
const firebaseConfigGroup = {
  apiKey: import.meta.env.VITE_FIREBASE_GROUP_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_GROUP_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_GROUP_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_GROUP_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_GROUP_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_GROUP_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_GROUP_MEASUREMENT_ID
};

/** Configuración del proyecto privado para Storage de archivos */
const firebaseConfigPrivate = {
  apiKey: import.meta.env.VITE_FIREBASE_PRIVATE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_PRIVATE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PRIVATE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_PRIVATE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_PRIVATE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_PRIVATE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_PRIVATE_MEASUREMENT_ID
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