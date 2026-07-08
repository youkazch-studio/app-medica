// src/services/fileService.js
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase/config"; // Usa tu config híbrida
import imageCompression from 'browser-image-compression';
import mammoth from 'mammoth';

// 1. Subir archivo a Firebase Storage (Para guardar el historial)
export const uploadFileToStorage = async (file) => {
  if (!file) return null;
  try {
    // Crea una ruta única: uploads/fecha_nombre
    const fileRef = ref(storage, `uploads/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(fileRef, file);
    const url = await getDownloadURL(snapshot.ref);
    return url;
  } catch (error) {
    console.error("Error subiendo archivo:", error);
    throw error;
  }
};

// 2. Optimizar Imágenes (Compresión antes de enviar a la IA)
export const compressImage = async (imageFile) => {
  const options = {
    maxSizeMB: 1,           // Máximo 1MB
    maxWidthOrHeight: 1024, // Redimensionar si es gigante
    useWebWorker: true
  };
  try {
    return await imageCompression(imageFile, options);
  } catch (error) {
    console.error("Error comprimiendo imagen:", error);
    return imageFile; // Si falla, usamos la original
  }
};

// 3. Extraer texto de Word (.docx)
export const extractTextFromDocx = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value; // Retorna solo el texto plano
  } catch (error) {
    console.error("Error leyendo Word:", error);
    throw new Error("No se pudo leer el documento Word");
  }
};

// 4. Convertir archivo a Base64 (Formato que necesita Gemini)
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        // Quitamos el prefijo "data:image/png;base64,"
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
    };
    reader.onerror = error => reject(error);
  });
};