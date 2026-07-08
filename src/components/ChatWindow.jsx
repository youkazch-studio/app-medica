/**
 * Componente principal de la ventana de chat.
 *
 * Gestiona la interacción completa con el usuario:
 * - Visualización de mensajes (Markdown, archivos adjuntos)
 * - Envío de mensajes y archivos a la IA (Gemini via Cloud Function)
 * - Parseo de marcadores IA: MAPA, PLAN_JSON y SUGERENCIAS
 * - Carga de mensajes anteriores (paginación)
 * - Modales de avatar, mapa y confirmación de planes
 *
 * @param {{ chatId: string|null, onChatCreated: Function }} props
 */
import React, { useState, useEffect, useRef } from 'react';
import { 
  FiSend, FiPaperclip, FiX, FiFileText, FiArrowRight, 
  FiVolume2, FiRefreshCw, FiMap, FiImage, FiDownload, 
  FiCalendar, FiCheckCircle, FiAlertCircle, FiClock 
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { sendMessageToFirestore, subscribeToChatMessages, createNewChat } from '../services/chatService';
import { uploadFileToStorage, compressImage, fileToBase64, extractTextFromDocx } from '../services/fileService';
import { saveHealthPlan, checkDuplicatePlan } from '../services/trackingService';
import AvatarSpeakingModal from './AvatarSpeakingModal';
import MapModal from './MapModal';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const CLARI_DOC_FUNCTION_URL = "https://askclaridoc-7futczxi6q-uc.a.run.app"; 

const ChatWindow = ({ chatId, onChatCreated }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados Archivos & Avatar & Mapa
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [messageLimit, setMessageLimit] = useState(20);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [textToSpeak, setTextToSpeak] = useState('');
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [mapQuery, setMapQuery] = useState('');

  // --- ESTADOS PARA PLANES ---
  const [planToSave, setPlanToSave] = useState(null); 
  const [showToast, setShowToast] = useState(false); 
  const [isDuplicate, setIsDuplicate] = useState(false); // Estado para duplicados
  // ---------------------------

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const WELCOME_MESSAGE = {
    id: 'welcome',
    from: 'ai',
    text: "¡Hola! Soy ClariDoc. 👋\n\nEstoy aquí para ayudarte a interpretar tus resultados médicos o responder tus dudas de salud.\n\n**¿En qué puedo ayudarte hoy?** Puedes subir una foto, un documento o escribir tu pregunta."
  };

  useEffect(() => {
    if (chatId) {
      setMessageLimit(20);
      setMessages([]); 
      const unsubscribe = subscribeToChatMessages(chatId, messageLimit, (newMessages) => setMessages(newMessages));
      return () => unsubscribe();
    } else {
      setMessages([]);
    }
  }, [chatId, messageLimit]);
  
  useEffect(() => {
    if (messageLimit === 20) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, messageLimit]);

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setPreviewUrl(null);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSpeakClick = (text) => {
    const cleanText = text
      .replace(/\|\|\|MAPA:.*?\|\|\|/g, '')
      .replace(/\|\|\|PLAN_JSON:.*?\|\|\|/g, '')
      .replace(/\*\*/g, '')
      .replace(/\*/g, '');
    setTextToSpeak(cleanText);
    setIsAvatarModalOpen(true);
  };

  const parseMessageContent = (text) => {
    if (!text) return { content: '', suggestions: [], mapQuery: null, planData: null };
    
    let tempText = text;
    let planData = null;
    let mapQuery = null;

    const planParts = tempText.split('|||PLAN_JSON:');
    if (planParts.length > 1) {
        const planEnd = planParts[1].split('|||');
        try {
            planData = JSON.parse(planEnd[0]);
        } catch (e) { console.error("Error JSON:", e); }
        tempText = planParts[0] + (planEnd[1] || '');
    }

    const mapParts = tempText.split('|||MAPA:');
    if (mapParts.length > 1) {
      const mapEnd = mapParts[1].split('|||');
      mapQuery = mapEnd[0].trim();
      tempText = mapParts[0] + (mapEnd[1] || '');
    }

    const parts = tempText.split('|||SUGERENCIAS|||');
    const content = parts[0].trim();
    let suggestions = parts.length > 1 ? parts[1].split('\n').filter(s => s.trim().length > 0) : [];

    return { content, suggestions, mapQuery, planData };
  };

  const processMessageSending = async (textToSend, fileToSend = null) => {
    if ((!textToSend.trim() && !fileToSend) || isLoading) return;

    const historyPayload = messages
      .slice(-10)
      .map(msg => {
         let clean = msg.text.split('|||SUGERENCIAS|||')[0];
         clean = clean.replace(/\|\|\|MAPA:.*?\|\|\|/g, '');
         clean = clean.replace(/\|\|\|PLAN_JSON:.*?\|\|\|/g, '');
         return {
            role: msg.from === 'user' ? 'user' : 'model', 
            parts: [{ text: clean.trim() }] 
         };
      })
      .filter(msg => msg.parts[0].text.length > 0 && !msg.parts[0].text.startsWith("❌"));

    setInput('');
    clearFile();
    setIsLoading(true);

    try {
      let activeChatId = chatId;
      if (!activeChatId) {
        activeChatId = await createNewChat(user.uid);
        if (onChatCreated) onChatCreated(activeChatId);
      }

      let attachmentData = null;
      let promptToSend = textToSend;
      let fileStorageUrl = null;
      let fileDataForDB = null;

      if (fileToSend) {
        fileStorageUrl = await uploadFileToStorage(fileToSend);
        fileDataForDB = {
            url: fileStorageUrl,
            type: fileToSend.type,
            name: fileToSend.name
        };
        
        if (fileToSend.type.includes("wordprocessingml")) {
          const extractedText = await extractTextFromDocx(fileToSend);
          promptToSend = `${textToSend}\n\n[DOC ADJUNTO]:\n${extractedText}`;
        } 
        else if (fileToSend.type.startsWith('image/')) {
          const compressedFile = await compressImage(fileToSend);
          const base64 = await fileToBase64(compressedFile);
          attachmentData = { mimeType: fileToSend.type, data: base64 };
        }
        else if (fileToSend.type === "application/pdf") {
          const base64 = await fileToBase64(fileToSend);
          attachmentData = { mimeType: "application/pdf", data: base64 };
        }
      }

      await sendMessageToFirestore(activeChatId, textToSend, 'user', fileDataForDB);
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

      const response = await axios.post(CLARI_DOC_FUNCTION_URL, {
        message: promptToSend,
        attachment: attachmentData,
        history: historyPayload
      });

      const aiText = response.data.reply;
      await sendMessageToFirestore(activeChatId, aiText, 'ai');
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      
    } catch (error) {
      console.error("Error:", error);
      if (chatId) await sendMessageToFirestore(chatId, "❌ Error procesando tu solicitud.", 'ai');
      else alert("Error iniciando el chat.");
    }
    setIsLoading(false);
  };

  // --- LÓGICA DE CONFIRMACIÓN Y GUARDADO ---
  const handleInitiateSave = async (plan) => {
    if (!user) return;
    // 1. Verificar duplicados
    const exists = await checkDuplicatePlan(user.uid, plan.titulo);
    setIsDuplicate(exists);
    setPlanToSave(plan); // 2. Abrir modal
  };

  const confirmSavePlan = async () => {
    if (!user || !planToSave) return;
    
    // Pasamos chatId para guardar la referencia
    const success = await saveHealthPlan(user.uid, planToSave, chatId);
    
    setPlanToSave(null); 
    
    if (success) {
        setShowToast(true); 
    } else {
        alert("Error al guardar el plan");
    }
  };

  const displayMessages = messages.length > 0 ? messages : [WELCOME_MESSAGE];

  return (
    <div className="flex-grow flex flex-col bg-[#F0F0F0] p-4 md:p-6 relative h-full overflow-hidden">
      
      {/* Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -20, x: 20 }}
            className="absolute top-4 right-4 z-[100] bg-white border-l-4 border-[#50E3C2] shadow-2xl rounded-lg p-4 flex items-center min-w-[300px]"
          >
            <div className="bg-green-100 p-2 rounded-full mr-3 text-green-600">
              <FiCheckCircle size={24} />
            </div>
            <div>
              <h4 className="font-bold text-gray-800 text-sm">¡Plan Guardado!</h4>
              <p className="text-xs text-gray-500">Se ha añadido a tu agenda de seguimiento.</p>
            </div>
            <button 
                onClick={() => navigate('/tracking')}
                className="ml-auto text-xs font-bold text-[#082F6D] hover:underline"
            >
                VER
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Confirmación de Plan */}
      <AnimatePresence>
        {planToSave && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border-t-4 border-[#082F6D]"
            >
                <div className="flex items-center mb-4 text-[#082F6D]">
                    {isDuplicate ? (
                        <FiAlertCircle className="mr-2 text-yellow-500" size={24} />
                    ) : (
                        <FiCalendar className="mr-2" size={24} />
                    )}
                    <h3 className="text-xl font-bold font-['Montserrat']">
                        {isDuplicate ? '⚠️ ¿Plan Duplicado?' : 'Confirmar Plan'}
                    </h3>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-xl mb-6 border border-blue-100">
                    <p className="text-sm text-gray-500 uppercase font-bold mb-1">{planToSave.tipo}</p>
                    <h4 className="text-lg font-bold text-gray-800 mb-2">{planToSave.titulo}</h4>
                    <div className="flex items-center text-sm text-gray-600 mb-3">
                        <FiClock className="mr-1" /> Duración: {planToSave.duracion}
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                        {planToSave.detalles.slice(0, 3).map((d, i) => (
                            <li key={i}>{d}</li>
                        ))}
                    </ul>
                </div>

                <p className={`text-sm text-center mb-6 ${isDuplicate ? 'text-yellow-600 font-medium' : 'text-gray-500'}`}>
                    {isDuplicate 
                        ? "Ya tienes un plan activo con este nombre. ¿Deseas guardarlo otra vez?" 
                        : "¿Deseas agregar este seguimiento a tu perfil?"}
                </p>

                <div className="flex gap-3">
                    <button 
                        onClick={() => setPlanToSave(null)}
                        className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={confirmSavePlan}
                        className={`flex-1 py-2.5 rounded-xl text-white font-bold transition-colors shadow-lg ${
                            isDuplicate 
                                ? 'bg-yellow-500 hover:bg-yellow-600' 
                                : 'bg-[#082F6D] hover:bg-opacity-90'
                        }`}
                    >
                        {isDuplicate ? 'Sí, Duplicar' : 'Sí, Guardar'}
                    </button>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AvatarSpeakingModal isOpen={isAvatarModalOpen} onClose={() => setIsAvatarModalOpen(false)} textToSpeak={textToSpeak} />
      <MapModal isOpen={isMapOpen} onClose={() => setIsMapOpen(false)} searchQuery={mapQuery} />

      <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar pb-4">
        {messages.length >= messageLimit && chatId && (
          <div className="flex justify-center mb-4">
            <button onClick={() => setMessageLimit(prev => prev + 20)} className="text-xs text-gray-400 hover:text-[#082F6D] flex items-center gap-1 bg-white px-3 py-1 rounded-full shadow-sm">
              <FiRefreshCw size={12} /> Cargar mensajes anteriores
            </button>
          </div>
        )}

        {displayMessages.map((msg, index) => {
          const isLastMessage = messages.length > 0 && index === messages.length - 1;
          const { content, suggestions, mapQuery: currentMapQuery, planData } = (msg.from === 'ai') 
            ? parseMessageContent(msg.text) 
            : { content: msg.text, suggestions: [], mapQuery: null, planData: null };

          return (
            <motion.div 
              key={msg.id || index} 
              className={`flex flex-col items-${msg.from === 'user' ? 'end' : 'start'} mb-4 group ${msg.from === 'ai' ? 'pr-12' : ''}`} 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
            >
              <div className={`flex items-end gap-2 md:gap-3 max-w-full ${msg.from === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {msg.from === 'ai' && <div className="w-8 h-8 rounded-full bg-[#082F6D] flex-shrink-0 flex items-center justify-center text-white text-xs">AI</div>}
                
                <div className={`relative p-3 md:p-4 rounded-2xl shadow-sm overflow-hidden ${msg.from === 'user' ? 'bg-[#50E3C2] text-[#082F6D] rounded-br-none max-w-[85%]' : 'bg-white text-gray-800 rounded-bl-none max-w-[75%]'}`}>
                  
                  {/* ARCHIVOS */}
                  {msg.fileUrl && (
                    <div className="mb-3">
                        {msg.fileType && msg.fileType.startsWith('image/') ? (
                            <div className="rounded-lg overflow-hidden border border-black/10 shadow-sm bg-black/5">
                                <img src={msg.fileUrl} alt="Adjunto" className="max-w-full h-auto max-h-64 object-cover cursor-pointer hover:opacity-95" onClick={() => window.open(msg.fileUrl, '_blank')} />
                            </div>
                        ) : (
                            <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className={`flex items-center p-3 rounded-lg border ${msg.from === 'user' ? 'bg-white/20 border-white/30 hover:bg-white/30' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'} transition-colors`}>
                                <div className={`p-2 rounded-full mr-3 ${msg.from === 'user' ? 'bg-white/20 text-white' : 'bg-blue-100 text-[#082F6D]'}`}>
                                    {msg.fileType && msg.fileType.includes('pdf') ? <FiFileText size={20} /> : <FiPaperclip size={20} />}
                                </div>
                                <div className="overflow-hidden text-left">
                                    <p className="text-sm font-bold truncate">{msg.fileName || 'Documento'}</p>
                                    <p className="text-xs opacity-80 flex items-center gap-1">Click para abrir <FiDownload size={10}/></p>
                                </div>
                            </a>
                        )}
                    </div>
                  )}

                  <div className="prose prose-sm max-w-none break-words">
                    <ReactMarkdown>{content}</ReactMarkdown>
                  </div>
                  
                  {/* BOTONES DE ACCIÓN (MAPA Y PLAN) */}
                  {currentMapQuery && (
                    <button onClick={() => { setMapQuery(currentMapQuery); setIsMapOpen(true); }} className="mt-3 w-full px-3 py-2 bg-green-50 text-green-700 text-xs font-bold rounded-lg border border-green-200 hover:bg-green-100 transition-colors flex items-center justify-center gap-2 shadow-sm">
                      <FiMap size={14} /> Ver {currentMapQuery} cercanos
                    </button>
                  )}

                  {planData && (
                    <button
                      onClick={() => handleInitiateSave(planData)}
                      className="mt-3 w-full px-3 py-2 bg-blue-50 text-[#082F6D] text-xs font-bold rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                      <FiCalendar size={14} /> 
                      Agregar a mi Agenda
                    </button>
                  )}
                </div>

                {/* BOTÓN AUDIO */}
                {msg.from === 'ai' && (
                  <button onClick={() => handleSpeakClick(content)} className="p-2 text-gray-400 hover:text-[#082F6D] rounded-full transition-colors flex-shrink-0 self-center shadow-sm bg-white/50 hover:bg-white" title="Escuchar">
                    <FiVolume2 size={20} />
                  </button>
                )}
              </div>

              {/* SUGERENCIAS */}
              {msg.from === 'ai' && isLastMessage && suggestions.length > 0 && (
                <div className="mt-3 ml-12 flex flex-wrap gap-2 animate-slide-up">
                  {suggestions.map((s, idx) => (
                    <button key={idx} onClick={() => processMessageSending(s)} className="text-xs md:text-sm bg-white border border-[#50E3C2] text-[#082F6D] px-3 py-1.5 rounded-full hover:bg-[#50E3C2] hover:text-white transition-colors shadow-sm flex items-center" disabled={isLoading}>
                      {s} <FiArrowRight className="ml-1" size={12} />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}
        
        {isLoading && (
          <div className="flex items-end gap-3 justify-start animate-pulse">
            <div className="w-8 h-8 rounded-full bg-[#082F6D]"></div>
            <div className="bg-white p-3 rounded-2xl shadow-sm"><p className="text-gray-500 text-sm">Analizando...</p></div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {selectedFile && (
        <div className="mx-2 mb-2 p-2 bg-white rounded-lg shadow-lg flex items-center justify-between border-l-4 border-[#082F6D]">
          <div className="flex items-center overflow-hidden">
            {previewUrl ? <img src={previewUrl} alt="Preview" className="w-10 h-10 object-cover rounded mr-3" /> : <FiFileText className="w-8 h-8 text-gray-500 mr-3" />}
            <p className="text-sm truncate">{selectedFile.name}</p>
          </div>
          <button onClick={clearFile}><FiX /></button>
        </div>
      )}

      <div className="mt-2">
        <form onSubmit={(e) => { e.preventDefault(); processMessageSending(input, selectedFile); }} className="flex items-center bg-white rounded-xl shadow-lg p-2 border border-gray-200 focus-within:ring-2 focus-within:ring-[#50E3C2]">
          <button type="button" onClick={() => fileInputRef.current?.click()} className="p-3 text-gray-400 hover:text-[#082F6D]" disabled={isLoading}><FiPaperclip size={20} /></button>
          <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} accept="image/*,application/pdf,.docx" />
          <input type="text" placeholder={selectedFile ? "Comentario..." : "Escribe tu pregunta..."} className="w-full bg-transparent outline-none px-4 py-3" value={input} onChange={(e) => setInput(e.target.value)} disabled={isLoading} />
          <button type="submit" className="bg-[#082F6D] text-white p-3 rounded-lg shadow-lg disabled:opacity-50" disabled={isLoading}><FiSend size={20} /></button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;