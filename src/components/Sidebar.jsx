/**
 * Panel lateral izquierdo con el historial de chats del usuario.
 *
 * Incluye:
 * - Logo y nombre de la app
 * - Botón para nuevo chat
 * - Enlace a "Mi Agenda" (TrackingPage)
 * - Lista de chats ordenada por última interacción (con scroll)
 * - Botón de cerrar sesión
 *
 * @param {{ chats: Array, selectedChatId: string|null, onSelectChat: Function, onNewChat: Function, onDeleteChat: Function }} props
 */
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';
import { FiPlus, FiLogOut, FiMessageSquare, FiTrash2, FiActivity } from 'react-icons/fi';
import logo from '../assets/logodefinitivo.png';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Sidebar = ({ chats, selectedChatId, onSelectChat, onNewChat, onDeleteChat }) => {
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    try { await signOut(auth); } catch (error) { console.error(error); }
  };

  return (
    <div className="h-full w-full bg-[#082F6D] text-white flex flex-col p-4 shadow-2xl">
      {/* Header con Logo */}
      <div className="flex items-center mb-6 pt-2 cursor-pointer" onClick={() => navigate('/')}>
        <img src={logo} alt="ClariDoc Logo" className="w-10 h-10 rounded-lg mr-3 bg-white p-1" />
        <h1 className="text-xl font-bold tracking-wider font-['Montserrat']">ClariDoc</h1>
      </div>

      {/* Botón Nuevo Chat */}
      <button 
        onClick={onNewChat}
        className="flex items-center justify-center w-full bg-[#50E3C2] text-[#082F6D] font-bold py-3 px-4 rounded-lg hover:bg-opacity-80 transition-all duration-300 mb-3 shadow-md"
      >
        <FiPlus className="mr-2 h-5 w-5" />
        Nuevo Chat
      </button>

      {/* --- NUEVO BOTÓN: MI AGENDA --- */}
      <button 
        onClick={() => navigate('/tracking')}
        className="flex items-center justify-center w-full bg-white/10 text-white font-semibold py-3 px-4 rounded-lg hover:bg-white/20 transition-all duration-300 mb-6 border border-white/10"
      >
        <FiActivity className="mr-2 h-5 w-5 text-[#50E3C2]" />
        Mi Agenda
      </button>
      {/* ----------------------------- */}

      {/* Lista de Chats */}
      <div className="flex-grow overflow-y-auto custom-scrollbar pr-2">
        <h2 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">Historial</h2>
        
        <ul className="space-y-2">
          <AnimatePresence>
          {chats.map((chat) => (
            <motion.li 
              key={chat.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onClick={() => onSelectChat(chat.id)}
              className={`group flex items-center justify-between p-3 rounded-md cursor-pointer transition-colors duration-200 relative
                ${selectedChatId === chat.id ? 'bg-white/20 border-l-4 border-[#50E3C2]' : 'hover:bg-white/10'}`}
            >
              <div className="flex items-center overflow-hidden w-full">
                <FiMessageSquare className={`mr-3 flex-shrink-0 ${selectedChatId === chat.id ? 'text-[#50E3C2]' : 'text-gray-400'}`} />
                <div className="overflow-hidden">
                  <p className="truncate text-sm font-medium text-gray-200">
                    {chat.title || "Nuevo Chat"}
                  </p>
                </div>
              </div>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteChat(chat.id);
                }}
                className={`
                  ml-2 p-1.5 rounded-md text-gray-400 hover:text-red-400 hover:bg-red-900/30 transition-all
                  ${selectedChatId === chat.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                `}
                title="Eliminar chat"
              >
                <FiTrash2 size={16} />
              </button>
            </motion.li>
          ))}
          </AnimatePresence>
        </ul>
      </div>
      
      {/* Footer */}
      <button 
        onClick={handleLogout}
        className="flex items-center w-full text-left p-3 rounded-md text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-all duration-300 mt-4 text-sm font-semibold border border-transparent hover:border-red-500/50 flex-shrink-0">
        <FiLogOut className="mr-3 h-5 w-5" />
        Cerrar Sesión
      </button>
    </div>
  );
};

export default Sidebar;