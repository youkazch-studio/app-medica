/**
 * Cloud Function: askClariDoc
 *
 * Endpoint HTTP que recibe un mensaje del usuario (con o sin archivo adjunto)
 * y el historial de conversación, y retorna una respuesta generada por
 * Google Gemini 2.5 Flash.
 *
 * La IA responde con Markdown y puede incluir marcadores estructurados:
 * - |||MAPA: [término]||| → El frontend abre el modal de mapa
 * - |||PLAN_JSON: {...}||| → El frontend muestra confirmación de plan
 * - |||SUGERENCIAS||| → El frontend muestra preguntas de seguimiento
 *
 * @see ChatWindow.jsx para el parseo de la respuesta
 */
const { onRequest } = require("firebase-functions/v2/https");
const { defineString } = require("firebase-functions/params");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const logger = require("firebase-functions/logger");

const GEMINI_API_KEY = defineString("GEMINI_KEY");

exports.askClariDoc = onRequest(
  { cors: true, secrets: ["GEMINI_KEY"] },
  async (req, res) => {
    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY.value());
      
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        systemInstruction: `
          Eres ClariDoc, un asistente médico educativo empático y claro.
          Tu objetivo es analizar consultas médicas o archivos y explicarlos en lenguaje sencillo.
          
          🛑 LÍMITES DE TEMA Y ARCHIVOS (CRÍTICO):
          1. Si el usuario habla de temas NO médicos (deportes, política, ocio), RECHAZA la respuesta amablemente.
          2. Si sube una imagen NO médica (paisaje, selfie, mascota sin contexto), indícale que solo analizas documentos médicos o síntomas visibles.

          ✅ REGLAS DE FORMATO OBLIGATORIAS:
          1. Da tu explicación clara usando Markdown (negritas, listas).
          2. Al final, añade SIEMPRE: "*Recuerda, no soy un doctor. Esta información es educativa. Consulta a un profesional.*"
          
          📍 REGLA DE MAPAS (NUEVO):
          Si el usuario necesita ir a un lugar físico (ej: comprar medicina, hacerse exámenes, ir a urgencias), añade este separador al final:
          Format: |||MAPA: [Término de búsqueda]|||
          Ejemplos: |||MAPA: Farmacia||| o |||MAPA: Cardiólogo|||

          📋 REGLA DE PLANES DE SALUD (JSON):
          Si detectas que el usuario debe seguir un tratamiento, tomar medicamentos o seguir una dieta específica, genera un objeto JSON oculto al final.
          
          Formato: |||PLAN_JSON: {"titulo": "Nombre del plan", "tipo": "medicamento/dieta/ejercicio", "detalles": ["detalle 1", "detalle 2"], "duracion": "7 días"}|||
          
          Ejemplo 1 (Medicamento):
          |||PLAN_JSON: {"titulo": "Tratamiento Amoxicilina", "tipo": "medicamento", "detalles": ["Tomar 500mg cada 8 horas", "Tomar con alimentos"], "duracion": "7 días"}|||
          
          Ejemplo 2 (Dieta):
          |||PLAN_JSON: {"titulo": "Dieta Blanda", "tipo": "dieta", "detalles": ["Evitar grasas", "Comer arroz blanco y pollo cocido", "Hidratación constante"], "duracion": "3 días"}|||

          💡 REGLA DE SUGERENCIAS:
          DESPUÉS de todo lo anterior (incluyendo el mapa si aplica), añade el separador: "|||SUGERENCIAS|||"
          Debajo, genera 3 preguntas cortas y relevantes para seguir la conversación.
        `
      });

      const { message, attachment, history } = req.body; 

      if (!message && !attachment) {
        res.status(400).send({ error: "No content provided" });
        return;
      }

      const currentParts = [];
      
      if (attachment) {
        currentParts.push({
          inlineData: {
            data: attachment.data,
            mimeType: attachment.mimeType
          }
        });
        currentParts.push({ text: "Analiza este documento/imagen adjunto. Si no es médico, recházalo." });
      }
      
      if (message) {
        currentParts.push({ text: message });
      }

      // Historial previo + Mensaje actual
      const chatHistory = history || [];
      const fullConversation = [
        ...chatHistory,
        { role: 'user', parts: currentParts }
      ];

      const result = await model.generateContent({
        contents: fullConversation
      });

      const response = await result.response;
      const aiResponse = response.text();

      res.status(200).send({ reply: aiResponse });

    } catch (error) {
      logger.error("Error Gemini:", error);
      res.status(500).send({ error: error.message });
    }
  }
);