// src/services/chatService.js
import { db } from '../firebase/config';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, deleteDoc, getDoc, limit, limitToLast } from 'firebase/firestore';

// 1. Crear un Nuevo Chat (Añadimos updatedAt)
export const createNewChat = async (userId) => {
  try {
    const chatsRef = collection(db, "chats");
    const newChatRef = await addDoc(chatsRef, {
      userId: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(), // <--- IMPORTANTE: Fecha para ordenar
      title: "Nuevo Chat"
    });
    return newChatRef.id;
  } catch (error) {
    console.error("Error creando chat:", error);
    return null;
  }
};

// 2. Eliminar un Chat
export const deleteChat = async (chatId) => {
  try {
    const chatRef = doc(db, "chats", chatId);
    await deleteDoc(chatRef);
  } catch (error) {
    console.error("Error eliminando chat:", error);
  }
};

// 3. Suscribirse a la lista de chats (ORDENADO POR INTERACCIÓN)
export const subscribeToUserChats = (userId, arg2, arg3) => {
  let limitAmount = 20;
  let callback = arg2;

  if (typeof arg2 === 'number') {
    limitAmount = arg2;
    callback = arg3;
  }

  const chatsRef = collection(db, "chats");
  
  // CAMBIO CLAVE: Ordenar por 'updatedAt' descendente
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

// 4. Suscribirse a mensajes
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

// 5. Enviar mensaje y actualizar fecha
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

    // Actualizar el chat padre
    if (sender === 'user') {
      const chatRef = doc(db, "chats", chatId);
      // Actualizamos 'updatedAt' para que el chat suba al inicio de la lista
      let updates = { 
        lastMessage: message,
        updatedAt: serverTimestamp() 
      };

      // Si el título es genérico, lo actualizamos
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

// 6. Formatear hora (Igual)
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