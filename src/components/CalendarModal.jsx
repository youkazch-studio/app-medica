/**
 * Modal de calendario mensual que muestra el historial de progreso de un plan.
 *
 * Cada día se colorea según el nivel de cumplimiento:
 * - Verde: Completado (todas las tareas hechas)
 * - Amarillo: Parcial (algunas tareas completadas)
 * - Rojo: Pendiente (ninguna tarea hecha)
 * - Gris: Futuro o anterior a la creación del plan
 *
 * @param {{ isOpen: boolean, onClose: Function, plan: object }} props
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiChevronLeft, FiChevronRight, FiCheck } from 'react-icons/fi';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isAfter, subMonths, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';

const CalendarModal = ({ isOpen, onClose, plan }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  if (!isOpen || !plan) return null;

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = monthStart.getDay();
  const emptyDays = Array(startDayOfWeek).fill(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const createdAtStr = plan.createdAt?.toDate().toISOString().split('T')[0] || todayStr;

  const getDayStatus = (dateObj) => {
    const dateStr = format(dateObj, 'yyyy-MM-dd');
    if (isAfter(dateObj, new Date()) && dateStr !== todayStr) return 'future';
    if (dateStr < createdAtStr) return 'future';

    const completedTasks = plan.progress && plan.progress[dateStr] ? plan.progress[dateStr].length : 0;
    const totalTasks = plan.detalles.length;

    if (completedTasks === totalTasks) return 'complete';
    if (completedTasks > 0) return 'partial';
    return 'missed';
  };

  // --- NUEVOS ESTILOS DE ALTO CONTRASTE ---
  const statusStyles = {
    // Gris más oscuro para días inactivos
    future: 'bg-gray-200 text-gray-500 font-medium',
    // Verde sólido vibrante con texto blanco
    complete: 'bg-green-600 text-white font-bold shadow-md',
    // Amarillo intenso con texto oscuro para contraste
    partial: 'bg-yellow-400 text-yellow-900 font-bold shadow-md',
    // Rojo sólido vibrante con texto blanco
    missed: 'bg-red-600 text-white font-bold shadow-md',
  };
  // ----------------------------------------

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-[#082F6D] p-5 text-white flex justify-between items-center">
            <div>
                <h3 className="font-extrabold font-['Montserrat'] text-xl">Historial de Progreso</h3>
                <p className="text-sm text-[#50E3C2] opacity-90 truncate max-w-[250px]">{plan.titulo}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors"><FiX size={22} /></button>
          </div>

          <div className="p-6">
            {/* Navegación */}
            <div className="flex justify-between items-center mb-8">
                <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2 hover:bg-gray-100 rounded-full text-gray-700 transition-colors"><FiChevronLeft size={28} /></button>
                <h4 className="text-2xl font-black text-gray-800 capitalize font-['Montserrat']">
                    {format(currentDate, 'MMMM yyyy', { locale: es })}
                </h4>
                <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 hover:bg-gray-100 rounded-full text-gray-700 transition-colors"><FiChevronRight size={28} /></button>
            </div>

            {/* Grid de Días */}
            <div className="grid grid-cols-7 gap-3 mb-3 text-center">
                {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map(d => (
                    <span key={d} className="text-xs font-black text-gray-400 uppercase tracking-widest">{d}</span>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-3">
                {emptyDays.map((_, i) => <div key={`empty-${i}`} />)}
                
                {daysInMonth.map((day) => {
                    const status = getDayStatus(day);
                    const isToday = format(day, 'yyyy-MM-dd') === todayStr;
                    
                    return (
                        <div 
                            key={day.toString()}
                            className={`
                                h-11 w-11 flex items-center justify-center rounded-xl text-base transition-all relative
                                ${statusStyles[status]}
                                // Resaltado del día actual más prominente
                                ${isToday ? 'ring-[3px] ring-[#082F6D] ring-offset-2 font-extrabold z-10 scale-105' : 'hover:scale-105 cursor-default'}
                            `}
                        >
                            {format(day, 'd')}
                            {/* Checkmark mejorado */}
                            {status === 'complete' && !isToday && (
                                <div className="absolute -bottom-1.5 -right-1.5 bg-white text-green-600 rounded-full p-0.5 text-[10px] shadow-sm border-[1.5px] border-white">
                                    <FiCheck strokeWidth={4} />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Leyenda Mejorada */}
            <div className="mt-8 flex flex-wrap justify-center gap-y-3 gap-x-6 text-xs text-gray-700 font-bold uppercase tracking-wide">
                <div className="flex items-center"><div className="w-4 h-4 bg-green-600 rounded-md mr-2 shadow-sm"></div> Completado</div>
                <div className="flex items-center"><div className="w-4 h-4 bg-yellow-400 rounded-md mr-2 shadow-sm"></div> Parcial</div>
                <div className="flex items-center"><div className="w-4 h-4 bg-red-600 rounded-md mr-2 shadow-sm"></div> Pendiente</div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CalendarModal;