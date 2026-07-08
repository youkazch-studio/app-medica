// src/pages/LandingPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiArrowRight, FiLogIn, FiUploadCloud, FiCpu, 
  FiCheckSquare, FiHeart, FiBookOpen, FiHelpCircle, FiLock 
} from 'react-icons/fi';
import logo from '../assets/logodefinitivo.png';
import appMockup from '../assets/app-mockup.png';

const LandingPage = () => {
  
  // Variantes de animación para Framer Motion
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F0F0F0] font-sans overflow-x-hidden">
      
      {/* --- Encabezado --- */}
      <motion.nav 
        className="w-full bg-white shadow-md p-4 flex justify-between items-center fixed top-0 left-0 z-50"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center">
          <img src={logo} alt="ClariDoc Logo" className="w-10 h-10 rounded-lg mr-3" />
          <span className="text-2xl font-bold text-[#082F6D] font-['Montserrat']">ClariDoc</span>
        </div>
        <Link 
          to="/login" 
          className="flex items-center bg-[#50E3C2] text-[#082F6D] font-bold py-2 px-5 rounded-lg hover:bg-opacity-80 transition-all duration-300 shadow-sm"
        >
          <FiLogIn className="mr-2" />
          Iniciar Sesión
        </Link>
      </motion.nav>

      {/* --- Sección Hero --- */}
      <section className="flex-grow flex flex-col justify-center items-center text-center p-8 pt-40 md:pt-32 bg-white">
        <motion.div 
          className="max-w-3xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <h1 className="text-5xl md:text-6xl font-extrabold text-[#082F6D] font-['Montserrat'] mb-6">
            Entiende tus exámenes médicos. Al instante.
          </h1>
          <p className="text-xl text-gray-700 mb-12">
            ClariDoc utiliza inteligencia artificial para traducir la jerga médica complicada en explicaciones simples y claras. 
            Toma el control de tu salud entendiendo tus resultados.
          </p>
          <Link 
            to="/login" 
            className="inline-flex items-center bg-[#082F6D] text-white font-bold text-lg py-4 px-10 rounded-lg hover:bg-opacity-90 transition-all duration-300 shadow-lg transform hover:scale-105"
          >
            Comenzar Ahora
            <FiArrowRight className="ml-3 h-6 w-6" />
          </Link>
        </motion.div>
      </section>

      {/* --- Sección "Cómo Funciona" --- */}
      <section className="py-20 bg-[#F0F0F0]">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">Simple, Rápido y Confidencial</h2>
          <p className="text-lg text-gray-600 mb-16 max-w-2xl mx-auto">
            Transforma tus reportes médicos en resúmenes claros en solo 3 pasos.
          </p>
          <motion.div 
            className="flex flex-wrap justify-center gap-10"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
          >
            {/* Paso 1 */}
            <motion.div className="max-w-xs bg-white p-8 rounded-xl shadow-lg" variants={itemVariants}>
              <FiUploadCloud className="h-16 w-16 text-[#50E3C2] mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-[#082F6D] mb-2">1. Sube tu Reporte</h3>
              <p className="text-gray-600">Sube una foto o el PDF de tu examen de laboratorio de forma segura.</p>
            </motion.div>
            {/* Paso 2 */}
            <motion.div className="max-w-xs bg-white p-8 rounded-xl shadow-lg" variants={itemVariants}>
              <FiCpu className="h-16 w-16 text-[#50E3C2] mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-[#082F6D] mb-2">2. Nuestra IA Analiza</h3>
              <p className="text-gray-600">ClariDoc procesa el texto e identifica los términos y valores clave.</p>
            </motion.div>
            {/* Paso 3 */}
            <motion.div className="max-w-xs bg-white p-8 rounded-xl shadow-lg" variants={itemVariants}>
              <FiCheckSquare className="h-16 w-16 text-[#50E3C2] mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-[#082F6D] mb-2">3. Recibe Claridad</h3>
              <p className="text-gray-600">Obtén un resumen fácil de entender que te explica qué significa todo.</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* --- Sección de Beneficios Clave --- */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center gap-16">
          <motion.div 
            className="md:w-1/2"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-4xl font-extrabold text-[#082F6D] mb-6">El poder de entender, <br />la calma de saber.</h2>
            <p className="text-lg text-gray-700 mb-8">
              Nuestro objetivo es reducir tu ansiedad y darte las herramientas para tener conversaciones más informadas con tu médico.
            </p>
            <ul className="space-y-6">
              <li className="flex items-start">
                <FiHeart className="h-8 w-8 text-[#50E3C2] mr-4 flex-shrink-0" />
                <div>
                  <h4 className="text-xl font-bold text-gray-800">Reduce la Ansiedad</h4>
                  <p className="text-gray-600">Entiende qué es normal, qué está elevado o bajo, y por qué, sin tener que esperar a tu cita.</p>
                </div>
              </li>
              <li className="flex items-start">
                <FiBookOpen className="h-8 w-8 text-[#50E3C2] mr-4 flex-shrink-0" />
                <div>
                  <h4 className="text-xl font-bold text-gray-800">Glosario Interactivo</h4>
                  <p className="text-gray-600">Toca cualquier término médico complicado (ej. "hemoglobina") para obtener una definición simple al instante.</p>
                </div>
              </li>
              <li className="flex items-start">
                <FiHelpCircle className="h-8 w-8 text-[#50E3C2] mr-4 flex-shrink-0" />
                <div>
                  <h4 className="text-xl font-bold text-gray-800">Prepara tu Cita</h4>
                  <p className="text-gray-600">Generamos una lista de preguntas inteligentes y relevantes para que puedas discutir tus resultados con tu doctor.</p>
                </div>
              </li>
            </ul>
          </motion.div>
        <motion.div 
        className="md:w-1/2 flex justify-center items-center" // Clases añadidas para centrar
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        >
        <img 
            src={appMockup} 
            alt="Ejemplo de un resumen de ClariDoc en un teléfono" 
            className="rounded-xl shadow-2xl max-w-md w-full" 
        />
        </motion.div>
        </div>
      </section>

      {/* --- Sección de Seguridad --- */}
      <section className="py-20 bg-[#082F6D] text-white">
        <motion.div 
          className="container mx-auto px-6 text-center max-w-3xl"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <FiLock className="h-16 w-16 text-[#50E3C2] mx-auto mb-6" />
          <h2 className="text-4xl font-bold mb-4 font-['Montserrat']">Tu Privacidad es Nuestra Prioridad</h2>
          <p className="text-lg text-gray-300">
            Construido con seguridad a nivel hospitalario. Tus documentos son encriptados, anónimos y nunca se comparten. Eres el único dueño de tus datos, siempre.
          </p>
        </motion.div>
      </section>
      
      {/* --- Llamado a la Acción (CTA) Final --- */}
      <section className="py-24 bg-white text-center">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
        >
          <h2 className="text-4xl font-extrabold text-[#082F6D] font-['Montserrat'] mb-6">
            ¿Listo para tomar el control de tu salud?
          </h2>
          <p className="text-xl text-gray-700 mb-12 max-w-2xl mx-auto">
            Deja de adivinar. Obtén la claridad que mereces en menos de un minuto.
          </p>
          <Link 
            to="/login" 
            className="inline-flex items-center bg-[#082F6D] text-white font-bold text-lg py-4 px-10 rounded-lg hover:bg-opacity-90 transition-all duration-300 shadow-lg transform hover:scale-105"
          >
            Obtén tu Resumen Gratis
            <FiArrowRight className="ml-3 h-6 w-6" />
          </Link>
        </motion.div>
      </section>
      
      {/* --- Pie de Página --- */}
      <footer className="text-center p-8 text-gray-500 text-sm bg-gray-200">
        <p>© {new Date().getFullYear()} ClariDoc. Todos los derechos reservados.</p>
        <div className="flex justify-center gap-6 mt-4">
          <a href="#" className="hover:text-[#082F6D]">Política de Privacidad</a>
          <a href="#" className="hover:text-[#082F6D]">Términos de Servicio</a>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;