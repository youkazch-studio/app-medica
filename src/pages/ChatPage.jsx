/**
 * Página principal del chat (requiere autenticación).
 *
 * Orquesta los componentes Sidebar, Header, ChatWindow y ConfirmModal.
 * Maneja la selección de chats, carga de historial, navegación desde
 * la agenda, y eliminación de chats con confirmación.
 */
import React, { useState, useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import ChatWindow from '../components/ChatWindow';
import ConfirmModal from '../components/ConfirmModal';
import { useAuth } from '../context/AuthContext';
import { subscribeToUserChats, deleteChat } from '../services/chatService';
import { useLocation } from 'react-router-dom';

const ChatPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [chats, setChats] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loadingChats, setLoadingChats] = useState(true);
  const [chatLimit, setChatLimit] = useState(20);

  // Estados para Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState(null);

  // REFERENCIA PARA EVITAR SALTOS:
  // Solo queremos auto-seleccionar la primera vez que carga la app, no en cada actualización.
  const hasInitialLoadHappened = useRef(false);

  // 1. Carga de Chats
  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToUserChats(user.uid, chatLimit, (data) => {
        setChats(data);
        setLoadingChats(false);
        
        // LÓGICA DE SELECCIÓN ESTABLE:
        setSelectedChatId((prevId) => {
            // Caso 1: Primera carga de la página. Seleccionamos el más reciente.
            if (!hasInitialLoadHappened.current && data.length > 0 && !prevId) {
                hasInitialLoadHappened.current = true;
                return data[0].id;
            }
            
            // Caso 2: El chat que estábamos viendo fue borrado.
            // Si teníamos un ID, pero ya no existe en la nueva lista 'data', volvemos a 'null' (bienvenida) o al primero.
            if (prevId && !data.find(c => c.id === prevId)) {
                return null; // O data[0].id si prefieres que salte al siguiente
            }

            // Caso 3: Estamos en "Nuevo Chat" (prevId es null).
            // MANTENEMOS null. No forzamos la selección del primero.
            // Esto arregla el "salto" cuando envías mensaje en un chat viejo y la lista se actualiza.
            return prevId;
        });
        
        // Marcamos que ya cargó al menos una vez
        if (data.length > 0 || loadingChats) {
             hasInitialLoadHappened.current = true;
        }
      });
      return () => unsubscribe();
    }
  }, [user, chatLimit]);

  // 2. Detectar navegación desde Agenda
  useEffect(() => {
    if (location.state?.targetChatId && chats.length > 0) {
        setSelectedChatId(location.state.targetChatId);
        window.history.replaceState({}, document.title);
    }
  }, [location.state, chats]);

  const handleNewChat = () => {
    setSelectedChatId(null);
    setIsMobileMenuOpen(false);
  };

  const handleChatCreated = (newId) => {
    setSelectedChatId(newId);
  };

  const handleLoadMoreChats = () => {
    setChatLimit(prev => prev + 20);
  };

  const handleDeleteChatRequest = (chatId) => {
    setChatToDelete(chatId);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteChat = async () => {
    if (chatToDelete) {
      await deleteChat(chatToDelete);
      if (selectedChatId === chatToDelete) {
        setSelectedChatId(null);
      }
      setChatToDelete(null);
      setIsDeleteModalOpen(false);
    }
  };

  const currentChatData = chats.find(c => c.id === selectedChatId);

  return (
    <div className="h-screen w-screen flex bg-[#F0F0F0] overflow-hidden relative">
      
      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteChat}
        title="¿Eliminar Chat?"
        message="Se perderá todo el historial de esta conversación."
      />

      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 flex-shrink-0 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar 
          chats={chats} 
          selectedChatId={selectedChatId} 
          onSelectChat={(id) => {
            setSelectedChatId(id);
            setIsMobileMenuOpen(false);
          }}
          onNewChat={handleNewChat}
          onDeleteChat={handleDeleteChatRequest}
          onLoadMore={handleLoadMoreChats}
          hasMoreChats={chats.length >= chatLimit}
        />
      </div>

      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      <div className="flex-grow flex flex-col w-full h-full overflow-hidden">
        <Header 
          chatData={currentChatData} 
          onToggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
        />
        
        <ChatWindow 
            chatId={selectedChatId} 
            onChatCreated={handleChatCreated} 
        />
      </div>
    </div>
  );
};

export default ChatPage;