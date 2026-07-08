/**
 * Modal de confirmación reutilizable para acciones destructivas.
 *
 * Muestra un título, mensaje, y botones de "Cancelar" / "Eliminar"
 * con animaciones de entrada/salida mediante Framer Motion.
 *
 * @param {{ isOpen: boolean, onClose: Function, onConfirm: Function, title: string, message: string }} props
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertTriangle } from 'react-icons/fi';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
          
          {/* 1. Fondo Oscuro (Backdrop) */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose} // Cierra si haces clic fuera
          />

          {/* 2. La Tarjeta del Modal */}
          <motion.div
            className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm relative z-10 border border-gray-100"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <div className="flex flex-col items-center text-center">
              {/* Ícono de Alerta */}
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-500">
                <FiAlertTriangle size={24} />
              </div>

              <h3 className="text-xl font-bold text-gray-800 mb-2 font-['Montserrat']">
                {title}
              </h3>
              
              <p className="text-gray-500 mb-6 text-sm">
                {message}
              </p>

              {/* Botones de Acción */}
              <div className="flex gap-3 w-full">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={onConfirm}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 shadow-lg hover:shadow-red-500/30 transition-all focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;