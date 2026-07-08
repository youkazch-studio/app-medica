/**
 * Barra superior de la interfaz de chat.
 *
 * Muestra el título del chat activo, tiempo relativo desde su creación,
 * y el avatar/nombre del usuario autenticado.
 * Incluye un botón de menú hamburguesa para la sidebar en móviles.
 *
 * @param {{ chatData: object|null, onToggleMenu: Function }} props
 */
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { FiMenu } from 'react-icons/fi';
import { formatRelativeTime } from '../services/chatService';

const Header = ({ chatData, onToggleMenu }) => {
  const { user } = useAuth();

  return (
    <motion.header 
      className="bg-white shadow-sm p-4 flex justify-between items-center border-b border-gray-200 h-16 z-30"
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      <div className="flex items-center">
        {/* Botón de Menú para Móvil (Solo visible en pantallas pequeñas 'md:hidden') */}
        <button 
          onClick={onToggleMenu}
          className="mr-4 text-gray-600 hover:text-[#082F6D] focus:outline-none md:hidden"
        >
          <FiMenu className="h-6 w-6" />
        </button>

        <div>
          <h2 className="text-lg md:text-xl font-bold text-gray-800 truncate max-w-[200px] md:max-w-md">
            {chatData?.title || 'Nuevo Chat'}
          </h2>
          <p className="text-xs text-gray-500">
            {chatData?.createdAt ? `Iniciado ${formatRelativeTime(chatData.createdAt)}` : 'Recién creado'}
          </p>
        </div>
      </div>

      <div className="flex items-center">
        {user && (
          <div className="flex items-center">
            <div className="text-right mr-3 hidden sm:block">
              <p className="font-semibold text-sm text-gray-700">{user.displayName || 'Usuario'}</p>
            </div>
            <img 
              src={user.photoURL || 'https://via.placeholder.com/40'} 
              alt="Avatar"
              className="w-8 h-8 md:w-10 md:h-10 rounded-full shadow-md border-2 border-[#50E3C2]"
            />
          </div>
        )}
      </div>
    </motion.header>
  );
};

export default Header;