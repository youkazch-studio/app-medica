// src/pages/TrackingPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { subscribeToHealthPlans, deleteHealthPlan, toggleTaskCompletion } from '../services/trackingService';
import { FiArrowLeft, FiActivity, FiTrash2, FiCheckCircle, FiClock, FiPlusCircle, FiVolume2, FiMessageSquare, FiCircle, FiCalendar } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../assets/logodefinitivo.png'; 
import ConfirmModal from '../components/ConfirmModal';
import AvatarSpeakingModal from '../components/AvatarSpeakingModal';
import CalendarModal from '../components/CalendarModal'; // <--- 1. IMPORTAR
import Confetti from 'react-confetti'; 
import { useWindowSize } from 'react-use';

const TrackingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { width, height } = useWindowSize();
  
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const todayDate = new Date().toISOString().split('T')[0]; 

  // Estados Modales
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState(null);
  const [isAvatarOpen, setIsAvatarOpen] = useState(false);
  const [textToSpeak, setTextToSpeak] = useState('');
  const [avatarMode, setAvatarMode] = useState('reading');
  
  // --- NUEVO ESTADO PARA CALENDARIO ---
  const [calendarPlan, setCalendarPlan] = useState(null);
  // ------------------------------------

  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToHealthPlans(user.uid, (data) => {
        setPlans(data);
        setLoading(false);
        checkAllCompleted(data);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const checkAllCompleted = (currentPlans) => {
    if (currentPlans.length === 0) return;
    const allDone = currentPlans.every(plan => {
        const completedToday = plan.progress && plan.progress[todayDate] ? plan.progress[todayDate] : [];
        return completedToday.length === plan.detalles.length;
    });
    if (allDone && currentPlans.length > 0) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
    }
  };

  const getDayCounter = (createdAtTimestamp) => {
    if (!createdAtTimestamp) return 1;
    const start = createdAtTimestamp.toDate();
    const now = new Date();
    const diffTime = Math.abs(now - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays;
  };

  const handleDeleteRequest = (planId) => {
    setPlanToDelete(planId);
    setIsDeleteModalOpen(true);
  };

  const confirmDeletePlan = async () => {
    if (user && planToDelete) {
      await deleteHealthPlan(user.uid, planToDelete);
      setIsDeleteModalOpen(false);
      setPlanToDelete(null);
    }
  };

  const handleListenPlan = (plan) => {
    const completedToday = plan.progress && plan.progress[todayDate] ? plan.progress[todayDate] : [];
    const totalTasks = plan.detalles.length;
    
    // Verificamos si está completo HOY
    const isComplete = completedToday.length === totalTasks && totalTasks > 0;

    let message = "";

    if (isComplete) {
        // MODO CELEBRACIÓN
        setAvatarMode('celebrating');
        message = `¡Excelente trabajo! Has completado el plan ${plan.titulo} por hoy. Estoy muy orgulloso de tu disciplina. ¡Sigue así mañana!`;
    } else {
        // MODO LECTURA NORMAL
        setAvatarMode('reading');
        message = `Plan de ${plan.tipo}: ${plan.titulo}. Llevas ${completedToday.length} de ${totalTasks} tareas. Aquí tienes las instrucciones pendientes: ${plan.detalles.join('. ')}. ¡Ánimo!`;
    }
    
    setTextToSpeak(message);
    setIsAvatarOpen(true);
  };

  const handleGoToChat = (sourceChatId) => {
    navigate('/chat', { state: { targetChatId: sourceChatId } });
  };

  return (
    <div className="min-h-screen bg-[#F0F0F0] font-sans pb-20 relative overflow-x-hidden">
      
      {showConfetti && <Confetti width={width} height={height} numberOfPieces={200} recycle={false} />}

      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeletePlan}
        title="¿Eliminar Plan?"
        message="¿Estás seguro? Se perderá tu progreso diario."
      />
      
      <AvatarSpeakingModal 
        isOpen={isAvatarOpen}
        onClose={() => setIsAvatarOpen(false)}
        textToSpeak={textToSpeak}
        mode={avatarMode} // <--- AQUÍ PASAMOS EL MODO
      />

      {/* --- 2. RENDERIZAR CALENDARIO --- */}
      <CalendarModal
        isOpen={!!calendarPlan}
        onClose={() => setCalendarPlan(null)}
        plan={calendarPlan}
      />
      {/* ------------------------------- */}

      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center">
                <img src={logo} alt="ClariDoc" className="w-10 h-10 rounded-lg mr-3" />
                <div>
                    <h1 className="text-xl font-bold text-[#082F6D] font-['Montserrat']">Mi Agenda</h1>
                    <p className="text-xs text-gray-500 capitalize">
                        {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                </div>
            </div>
            <Link to="/chat" className="flex items-center text-sm font-semibold text-gray-600 hover:text-[#082F6D] bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-full transition-colors">
                <FiArrowLeft className="mr-2" /> Volver
            </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 md:p-8">
        {loading ? (
           <div className="flex justify-center items-center h-64"><div className="w-10 h-10 border-4 border-[#50E3C2] border-t-transparent rounded-full animate-spin"></div></div>
        ) : plans.length === 0 ? (
           <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl shadow-sm text-center border border-dashed border-gray-300 mt-8">
             <div className="bg-blue-50 p-6 rounded-full mb-4"><FiActivity size={48} className="text-[#082F6D]" /></div>
             <h2 className="text-2xl font-bold text-gray-800 mb-2">Tu agenda está vacía</h2>
             <p className="text-gray-500 max-w-md mb-6">Pide a ClariDoc en el chat que te genere una dieta, rutina o recordatorio.</p>
             <Link to="/chat" className="flex items-center bg-[#082F6D] text-white px-6 py-3 rounded-xl font-bold hover:bg-opacity-90 shadow-lg transition-transform hover:scale-105">
                <FiPlusCircle className="mr-2" size={20}/> Ir al Chat
             </Link>
           </motion.div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => {
              const completedToday = plan.progress && plan.progress[todayDate] ? plan.progress[todayDate] : [];
              const totalTasks = plan.detalles.length;
              const progressPercent = Math.round((completedToday.length / totalTasks) * 100);
              const isDayComplete = progressPercent === 100;
              const dayNumber = getDayCounter(plan.createdAt);

              return (
                <motion.div 
                  key={plan.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`bg-white rounded-2xl shadow-md p-6 border-t-4 transition-all duration-300 relative flex flex-col h-full ${isDayComplete ? 'border-green-500 ring-2 ring-green-100' : 'border-[#50E3C2] hover:shadow-xl'}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${plan.tipo === 'medicamento' ? 'bg-blue-100 text-blue-700' : plan.tipo === 'dieta' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>
                        {plan.tipo}
                        </span>
                        <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded-full flex items-center">
                            <FiCalendar className="mr-1" /> Día {dayNumber}
                        </span>
                    </div>
                    <button onClick={() => handleDeleteRequest(plan.id)} className="text-gray-300 hover:text-red-500 p-1.5 rounded-full hover:bg-red-50 transition-colors"><FiTrash2 size={16}/></button>
                  </div>

                  <h3 className="text-lg font-bold text-[#082F6D] mb-1 leading-tight">{plan.titulo}</h3>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span className="flex items-center"><FiClock className="mr-1" /> {plan.duracion}</span>
                    
                    {/* --- BOTÓN ABRIR CALENDARIO --- */}
                    <button 
                        onClick={() => setCalendarPlan(plan)}
                        className="flex items-center text-[#50E3C2] hover:underline font-bold"
                    >
                        <FiCalendar className="mr-1" /> Ver Historial
                    </button>
                    {/* ------------------------------ */}
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1 font-semibold text-gray-500">
                        <span>Progreso Diario</span>
                        <span className={isDayComplete ? 'text-green-600' : ''}>{progressPercent}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ease-out ${isDayComplete ? 'bg-green-500' : 'bg-[#50E3C2]'}`} style={{ width: `${progressPercent}%` }}></div>
                    </div>
                  </div>

                  <div className={`rounded-xl p-3 mb-4 flex-grow transition-colors ${isDayComplete ? 'bg-green-50' : 'bg-gray-50'}`}>
                    <ul className="space-y-3">
                      {plan.detalles.map((detalle, idx) => {
                        const isDone = completedToday.includes(idx);
                        return (
                          <li key={idx} onClick={() => toggleTaskCompletion(user.uid, plan.id, idx)} className={`flex items-start text-sm cursor-pointer transition-all select-none group rounded p-1 ${isDone ? 'opacity-60' : 'hover:bg-white/50'}`}>
                            <div className={`mt-0.5 mr-2 flex-shrink-0 transition-colors duration-300 transform ${isDone ? 'text-green-500 scale-110' : 'text-gray-300 group-hover:text-[#50E3C2]'}`}>
                                {isDone ? <FiCheckCircle size={20} /> : <FiCircle size={20} />}
                            </div>
                            <span className={`leading-snug transition-all ${isDone ? 'line-through text-gray-400' : 'text-gray-700'}`}>{detalle}</span>
                          </li>
                        );
                      })}
                    </ul>
                    {isDayComplete && <div className="mt-3 text-center text-xs font-bold text-green-600 animate-pulse">¡Excelente trabajo hoy! 🎉</div>}
                  </div>

                  <div className="mt-auto pt-2 border-t border-gray-100 flex gap-2">
                     <button onClick={() => handleListenPlan(plan)} className="flex-1 flex items-center justify-center py-2 text-sm font-bold text-[#082F6D] bg-white border border-gray-200 hover:bg-blue-50 hover:border-blue-200 rounded-lg transition-colors gap-2">
                        <FiVolume2 size={16} /> Coach
                     </button>
                     {/* Enlace al chat (si existe) */}
                     {plan.sourceChatId && (
                        <button onClick={() => handleGoToChat(plan.sourceChatId)} className="px-3 py-2 text-gray-400 hover:text-[#50E3C2] hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-200 transition-colors" title="Ir al Chat">
                            <FiMessageSquare size={18} />
                        </button>
                     )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackingPage;