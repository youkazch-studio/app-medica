/**
 * Servicio CRUD para chats y mensajes en Firestore.
 *
 * Proporciona funciones para crear, leer y eliminar chats,
 * así como enviar y suscribirse a mensajes en tiempo real.
 *
 * @module chatService
 */
import { db } from '../firebase/config';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, deleteDoc, getDoc, limit, limitToLast } from 'firebase/firestore';

/**
 * Crea un nuevo chat para un usuario.
 * @param {string} userId - ID del usuario autenticado
 * @returns {Promise<string|null>} ID del nuevo chat o null si falla
 */
export const createNewChat = async (userId) => {
  try {
    const chatsRef = collection(db, "chats");
    const newChatRef = await addDoc(chatsRef, {
      userId: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      title: "Nuevo Chat"
    });
    return newChatRef.id;
  } catch (error) {
    console.error("Error creando chat:", error);
    return null;
  }
};

/**
 * Elimina un chat por su ID.
 * @param {string} chatId - ID del chat a eliminar
 */
export const deleteChat = async (chatId) => {
  try {
    const chatRef = doc(db, "chats", chatId);
    await deleteDoc(chatRef);
  } catch (error) {
    console.error("Error eliminando chat:", error);
  }
};

/**
 * Se suscribe en tiempo real a la lista de chats del usuario, ordenados por última interacción.
 * @param {string} userId - ID del usuario
 * @param {number|Function} [limitAmount=20] - Cantidad máxima de chats, o callback si se omite
 * @param {Function} [callback] - Función que recibe el array de chats
 * @returns {Function} Función para desuscribirse del snapshot
 */
export const subscribeToUserChats = (userId, arg2, arg3) => {
  let limitAmount = 20;
  let callback = arg2;

  if (typeof arg2 === 'number') {
    limitAmount = arg2;
    callback = arg3;
  }

  const chatsRef = collection(db, "chats");
  const q = query(
    chatsRef, 
    where("userId", "==", userId), 
    orderBy("updatedAt", "desc"), 
    limit(limitAmount)
  );

  return onSnapshot(q, (snapshot) => {
    const chats = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    if (typeof callback === 'function') {
      callback(chats);
    }
  });
};

/**
 * Se suscribe en tiempo real a los mensajes de un chat, con paginación.
 * @param {string} chatId - ID del chat
 * @param {number|Function} [limitAmount=20] - Cantidad de mensajes a cargar, o callback
 * @param {Function} [callback] - Función que recibe el array de mensajes
 * @returns {Function} Función para desuscribirse
 */
export const subscribeToChatMessages = (chatId, arg2, arg3) => {
  let limitAmount = 20;
  let callback = arg2;

  if (typeof arg2 === 'number') {
    limitAmount = arg2;
    callback = arg3;
  }

  const messagesRef = collection(db, "chats", chatId, "messages");
  const q = query(
    messagesRef, 
    orderBy("createdAt", "asc"), 
    limitToLast(limitAmount)
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    if (typeof callback === 'function') {
      callback(messages);
    }
  });
};

/**
 * Envía un mensaje a Firestore y actualiza los metadatos del chat padre.
 * Si el título del chat sigue siendo "Nuevo Chat", lo renombra con el primer mensaje.
 * @param {string} chatId - ID del chat
 * @param {string} message - Texto del mensaje
 * @param {'user'|'ai'} sender - Remitente del mensaje
 * @param {{ url: string, type: string, name: string } | null} fileData - Datos del archivo adjunto (opcional)
 */
export const sendMessageToFirestore = async (chatId, message, sender, fileData = null) => {
  try {
    const messagesRef = collection(db, "chats", chatId, "messages");
    
    const messageData = {
      text: message,
      from: sender,
      createdAt: serverTimestamp()
    };

    if (fileData) {
      messageData.fileUrl = fileData.url;
      messageData.fileType = fileData.type;
      messageData.fileName = fileData.name;
    }

    await addDoc(messagesRef, messageData);

    if (sender === 'user') {
      const chatRef = doc(db, "chats", chatId);
      let updates = { 
        lastMessage: message,
        updatedAt: serverTimestamp() 
      };

      const chatSnap = await getDoc(chatRef);
      if (chatSnap.exists() && chatSnap.data().title === "Nuevo Chat") {
        const cleanMessage = message.replace(/\[.*?\]/g, '').trim();
        const newTitle = cleanMessage.length > 0 
          ? (cleanMessage.length > 30 ? cleanMessage.substring(0, 30) + "..." : cleanMessage)
          : (fileData ? fileData.name : "Nuevo Chat");
        updates.title = newTitle;
      }
      
      await updateDoc(chatRef, updates); 
    }
  } catch (error) {
    console.error("Error guardando mensaje:", error);
  }
};

/**
 * Formatea un timestamp de Firestore como texto relativo en español.
 * @param {import('firebase/firestore').Timestamp} timestamp - Timestamp de Firestore
 * @returns {string} Texto como "hace 5 min" o "hace 2 h"
 */
export const formatRelativeTime = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp.toDate();
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'hace un momento';
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `hace ${diffInMinutes} min`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `hace ${diffInHours} h`;
  return date.toLocaleDateString();
};