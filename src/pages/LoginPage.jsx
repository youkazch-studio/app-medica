// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { FcGoogle } from "react-icons/fc";
import { FiArrowLeft } from "react-icons/fi";
import { handleGoogleLogin, handleSubmit } from '../firebase/config';
import { motion } from 'framer-motion';
import logo from '../assets/logodefinitivo.png';

const LoginPage = () => {
  const [error, setError] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-[#082F6D] to-gray-900 px-4 py-12 font-sans relative'>
      
      {/* --- BOTÓN DE REGRESAR (Ajustado) --- */}
      <Link 
        to="/" 
        className="absolute top-4 left-4 md:top-6 md:left-6 flex items-center text-white/80 hover:text-white transition-colors group z-20"
      >
        <div className="p-2 bg-white/10 rounded-full group-hover:bg-white/20 transition-all mr-2 backdrop-blur-sm">
          <FiArrowLeft size={20} />
        </div>
        <span className="text-sm font-medium hidden sm:block">Volver al Inicio</span>
      </Link>
      {/* ----------------------------- */}

      <motion.div 
        // CAMBIOS AQUÍ: p-6 para móvil, sm:p-10 para tablet/PC
        className="relative bg-white text-gray-800 shadow-xl rounded-2xl p-6 sm:p-10 max-w-md w-full border border-gray-200 
                   hover:ring-4 hover:ring-[#50E3C2] hover:ring-offset-2 hover:ring-offset-white 
                   transition-all duration-300 ease-in-out z-10"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      >
        <div className="flex flex-col items-center mb-6 sm:mb-8">
          {/* Logo responsivo: w-16 en móvil, w-20 en escritorio */}
          <img src={logo} alt="ClariDoc Logo" className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl mb-3 sm:mb-4" />
          <h2 className="text-2xl sm:text-3xl font-bold text-[#082F6D] font-['Montserrat'] text-center">Bienvenido a ClariDoc</h2>
          <p className='text-gray-500 mt-2 text-sm sm:text-base'>Ingresa para continuar</p>
        </div>

        {error && <p className='text-red-500 text-center mb-4 bg-red-100 p-3 rounded-lg text-sm'>{error}</p>}

        <form onSubmit={(e) => handleSubmit(e, setError)} className='space-y-5 sm:space-y-6'>
          <div>
            <label htmlFor="email" className='block text-gray-600 font-semibold mb-2 text-sm sm:text-base'>Correo Electrónico</label>
            <input 
              required 
              type="email" 
              name='email' 
              id='email' 
              placeholder='tu@correo.com' 
              className='w-full border border-gray-300 bg-gray-50 text-gray-800 px-4 py-2.5 sm:py-3 rounded-lg focus:ring-2 focus:ring-[#50E3C2] focus:border-[#50E3C2] focus:outline-none transition-all duration-300 text-sm sm:text-base' 
            />
          </div>

          <div className='relative'>
            <label htmlFor="password" className='block text-gray-600 font-semibold mb-2 text-sm sm:text-base'>Contraseña</label>
            <input 
              type={passwordVisible ? 'text' : 'password'} 
              id='password' 
              name='password' 
              placeholder='Introduce tu contraseña' 
              className='w-full border border-gray-300 bg-gray-50 text-gray-800 px-4 py-2.5 sm:py-3 rounded-lg focus:ring-2 focus:ring-[#50E3C2] focus:border-[#50E3C2] focus:outline-none transition-all duration-300 text-sm sm:text-base'
            />
            {/* Ajuste de posición del ojo para móvil */}
            <button type='button' onClick={() => setPasswordVisible(!passwordVisible)} className='absolute right-4 top-[2.4rem] sm:top-[2.8rem] text-gray-500 hover:text-[#082F6D] focus:outline-none'>
              {passwordVisible ? <AiOutlineEyeInvisible className='h-5 w-5 sm:h-6 sm:w-6' /> : <AiOutlineEye className='w-5 h-5 sm:h-6 sm:w-6' />}
            </button>
          </div>

          <button 
            type='submit' 
            className='w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-2.5 sm:py-3 rounded-lg font-bold text-base sm:text-lg hover:bg-gradient-to-l transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-cyan-400/50 shadow-md hover:shadow-lg'
          >
            Iniciar Sesión
          </button>
        </form>

        <div className='my-6 sm:my-8 flex items-center'>
          <span className='flex-grow border-t border-gray-300'></span>
          <span className='text-gray-400 text-xs sm:text-sm mx-4'>O</span>
          <span className='flex-grow border-t border-gray-300'></span>
        </div>

        <button 
          onClick={() => handleGoogleLogin(setError)} 
          className='w-full flex items-center justify-center bg-white border-2 border-gray-300 py-2.5 sm:py-3 rounded-lg shadow-sm hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-gray-200'
        >
          <FcGoogle className='h-5 w-5 sm:h-6 sm:w-6 mr-3' />
          <span className='font-semibold text-gray-700 text-sm sm:text-base'>Continuar con Google</span>
        </button>
      </motion.div>
    </div>
  );
};

export default LoginPage;