/**
 * Modal de avatar animado con Text-To-Speech.
 *
 * Muestra un video en loop del avatar mientras reproduce el texto
 * mediante la Web Speech API. Soporta 3 modos con diferentes videos:
 * - 'chat': Conversación general (avatar_speaking.mp4)
 * - 'reading': Lectura de plan de salud (avatar_reading.mp4)
 * - 'celebrating': Celebración por tareas completadas (avatar_celebrating.mp4)
 *
 * @param {{ isOpen: boolean, onClose: Function, textToSpeak: string, mode?: 'chat'|'reading'|'celebrating' }} props
 */
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiVolume2 } from 'react-icons/fi';

const AvatarSpeakingModal = ({ isOpen, onClose, textToSpeak, mode = 'chat' }) => {
  const videoRef = useRef(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Lógica para elegir el video correcto según el modo
  const getVideoSource = () => {
    switch (mode) {
      case 'celebrating': return '/avatar_celebrating.mp4'; // 100% completado
      case 'reading': return '/avatar_reading.mp4';         // Instrucciones de agenda
      case 'chat':                                          // Explicaciones del chat
      default: return '/avatar_speaking.mp4'; 
    }
  };

  const videoSrc = getVideoSource();

  // Texto del indicador superior
  const getStatusText = () => {
    if (!isSpeaking) return 'Finalizado';
    switch (mode) {
      case 'celebrating': return '¡Felicidades!';
      case 'reading': return 'Leyendo Plan...';
      default: return 'Explicando...';
    }
  };

  // Color del borde según el modo
  const getBorderColor = () => {
    if (isSpeaking) return 'speaking-active'; // Animación
    switch (mode) {
      case 'celebrating': return 'border-4 border-green-400';
      case 'reading': return 'border-4 border-purple-400'; // Color diferente para lectura
      default: return 'border-4 border-[#082F6D]';
    }
  };

  useEffect(() => {
    let closeTimer;

    if (isOpen && textToSpeak) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'es-ES';
      utterance.rate = 1.0;
      
      const voices = window.speechSynthesis.getVoices();
      const googleVoice = voices.find(v => v.name.includes('Google') && v.lang.includes('es'));
      if (googleVoice) utterance.voice = googleVoice;

      utterance.onstart = () => {
        setIsSpeaking(true);
        if (videoRef.current) {
            videoRef.current.currentTime = 0;
            videoRef.current.play();
        }
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        videoRef.current?.pause();
        // Cerramos automáticamente en 3 segundos
        closeTimer = setTimeout(() => { onClose(); }, 3000); 
      };
        
      utterance.onerror = () => { setIsSpeaking(false); videoRef.current?.pause(); };

      window.speechSynthesis.speak(utterance);
    }

    return () => {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      if (closeTimer) clearTimeout(closeTimer);
    };
  }, [isOpen, textToSpeak]); 

  const handleStop = () => {
    window.speechSynthesis.cancel();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-[70] flex flex-col items-end"
        >
          <button onClick={handleStop} className="bg-white text-gray-600 rounded-full p-2 shadow-lg mb-2 hover:bg-gray-100 transition-colors">
            <FiX size={20} />
          </button>

          <div className={`
            relative bg-[#082F6D] rounded-2xl overflow-hidden shadow-2xl w-48 h-48 md:w-64 md:h-64
            transition-all duration-500 ease-in-out
            ${getBorderColor()}
          `}>
            <div className="absolute top-3 left-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full flex items-center backdrop-blur-sm z-10">
               <FiVolume2 className={`mr-1 ${isSpeaking ? 'animate-pulse text-[#50E3C2]' : 'text-gray-300'}`} />
               {getStatusText()}
            </div>

            {/* Key fuerza a React a recargar el video si cambia el src */}
            <video 
              key={videoSrc} 
              ref={videoRef}
              src={videoSrc} 
              className="w-full h-full object-cover"
              loop
              muted
              playsInline
            />
            
            <div className="absolute inset-0 bg-gradient-to-t from-[#082F6D]/80 via-transparent to-transparent pointer-events-none"></div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AvatarSpeakingModal;