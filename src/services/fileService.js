/**
 * Servicio de procesamiento de archivos del lado del cliente.
 *
 * Maneja subida a Firebase Storage, compresión de imágenes,
 * extracción de texto de documentos Word y conversión a Base64.
 *
 * Todo el procesamiento pesado ocurre en el navegador para
 * reducir la carga en el backend.
 *
 * @module fileService
 */
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase/config";
import imageCompression from 'browser-image-compression';
import mammoth from 'mammoth';

/**
 * Sube un archivo a Firebase Storage (proyecto privado) y retorna su URL.
 * @param {File} file - Archivo a subir
 * @returns {Promise<string|null>} URL de descarga o null si no hay archivo
 */
export const uploadFileToStorage = async (file) => {
  if (!file) return null;
  try {
    const fileRef = ref(storage, `uploads/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(fileRef, file);
    const url = await getDownloadURL(snapshot.ref);
    return url;
  } catch (error) {
    console.error("Error subiendo archivo:", error);
    throw error;
  }
};

/**
 * Comprime una imagen a un máximo de 1MB y 1024px antes de enviarla a la IA.
 * @param {File} imageFile - Archivo de imagen original
 * @returns {Promise<File>} Imagen comprimida (o la original si falla)
 */
export const compressImage = async (imageFile) => {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1024,
    useWebWorker: true
  };
  try {
    return await imageCompression(imageFile, options);
  } catch (error) {
    console.error("Error comprimiendo imagen:", error);
    return imageFile;
  }
};

/**
 * Extrae el texto plano de un archivo .docx usando Mammoth.js.
 * @param {File} file - Archivo .docx
 * @returns {Promise<string>} Texto extraído del documento
 */
export const extractTextFromDocx = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } catch (error) {
    console.error("Error leyendo Word:", error);
    throw new Error("No se pudo leer el documento Word");
  }
};

/**
 * Convierte un archivo a string Base64 (formato que requiere Gemini API).
 * @param {File} file - Archivo a convertir
 * @returns {Promise<string>} Contenido del archivo en Base64 (sin prefijo data:*)
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
    };
    reader.onerror = error => reject(error);
  });
};