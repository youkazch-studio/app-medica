# ClariDoc App 🩺

**Entiende tus exámenes médicos. Al instante.**

ClariDoc es una aplicación web que utiliza inteligencia artificial (Google Gemini) para ayudar a pacientes a interpretar sus resultados médicos y documentos de salud. Subís análisis, recetas o informes médicos, y la IA traduce la jerga complicada en explicaciones simples y claras.

---

## ✨ Funcionalidades

### 🤖 Chat con IA Médica
- Subí fotos, PDFs o documentos Word de tus estudios médicos
- La IA analiza y te explica los resultados en lenguaje sencillo
- Soporte para imágenes, PDFs y archivos DOCX
- Compresión de imágenes y extracción de texto del lado del cliente

### 📋 Planes de Salud Personalizados
- La IA genera automáticamente planes de medicación, dieta y ejercicio
- Seguimiento diario con checklist de tareas
- Barra de progreso y calendario mensual con historial

### 🗺️ Mapa de Centros de Salud
- Búsqueda de hospitales, farmacias, clínicas y especialistas cercanos
- Usa OpenStreetMap + Overpass API (sin API keys de Google)
- Diccionario de 50+ términos médicos en español mapeados a categorías OSM
- Geolocalización automática y orden por distancia

### 🗣️ Coach con Avatar
- Avatar animado con 3 modos: conversación, lectura de planes y celebración
- Text-to-Speech con Web Speech API (voz en español)
- Reproduce explicaciones y planes de salud en voz alta

### 🔐 Autenticación y Privacidad
- Login con email/contraseña o Google Sign-In
- Arquitectura de doble proyecto Firebase:
  - Proyecto grupal: Auth + Firestore
  - Proyecto privado: Storage para archivos médicos

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| **Frontend** | React 19 + Vite 7 |
| **Routing** | React Router DOM 7 |
| **Estilos** | Tailwind CSS 4 |
| **Animaciones** | Framer Motion |
| **Mapas** | Leaflet + React-Leaflet + Overpass API |
| **Backend** | Firebase Cloud Functions (Node 22) |
| **IA** | Google Gemini 2.5 Flash |
| **Base de Datos** | Cloud Firestore |
| **Auth** | Firebase Authentication |
| **Storage** | Firebase Cloud Storage |
| **Hosting** | Firebase Hosting |

---

## 📁 Estructura del Proyecto

```
app-medica/
├── functions/                  # Cloud Functions (backend IA)
│   └── index.js               # askClariDoc - endpoint Gemini
├── public/                     # Archivos estáticos
│   ├── avatar_speaking.mp4    # Avatar modo conversación
│   ├── avatar_reading.mp4     # Avatar modo lectura
│   └── avatar_celebrating.mp4 # Avatar modo celebración
├── src/
│   ├── components/            # Componentes reutilizables
│   │   ├── ChatWindow.jsx     # Ventana principal de chat
│   │   ├── Sidebar.jsx        # Historial de chats
│   │   ├── Header.jsx         # Barra superior
│   │   ├── AvatarSpeakingModal.jsx  # Avatar con TTS
│   │   ├── MapModal.jsx       # Mapa de centros de salud
│   │   ├── CalendarModal.jsx  # Calendario de progreso
│   │   └── ConfirmModal.jsx   # Diálogo de confirmación
│   ├── pages/                 # Páginas de la aplicación
│   │   ├── LandingPage.jsx    # Página de marketing
│   │   ├── LoginPage.jsx      # Inicio de sesión
│   │   ├── ChatPage.jsx       # Chat principal
│   │   └── TrackingPage.jsx   # Agenda de seguimiento
│   ├── context/
│   │   └── AuthContext.jsx    # Estado de autenticación
│   ├── firebase/
│   │   └── config.js          # Configuración dual de Firebase
│   ├── services/              # Lógica de negocio
│   │   ├── chatService.js     # CRUD de chats y mensajes
│   │   ├── fileService.js     # Subida y procesamiento de archivos
│   │   └── trackingService.js # CRUD de planes de salud
│   ├── assets/                # Imágenes y recursos
│   ├── App.jsx                # Definición de rutas
│   ├── main.jsx               # Punto de entrada
│   └── index.css              # Estilos globales
├── .gitignore
├── firebase.json              # Configuración Firebase Hosting
├── tailwind.config.js
├── vite.config.js
└── package.json
```

---

## 🚀 Cómo ejecutar localmente

### Requisitos previos
- Node.js 18+
- Una cuenta de Firebase
- Una API key de Google Gemini

### Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/youkazch-studio/app-medica.git
cd app-medica

# 2. Instalar dependencias del frontend
npm install

# 3. Instalar dependencias de Cloud Functions
cd functions
npm install
cd ..

# 4. Configurar variables de entorno
# Crear functions/.env.claridoc-backend-kevin con:
# GEMINI_KEY=tu-api-key-de-gemini

# 5. Iniciar en modo desarrollo
npm run dev
```

### Despliegue en Firebase

```bash
# Construir el frontend
npm run build

# Desplegar hosting + functions
firebase deploy
```

---

## 🧠 Arquitectura destacada

### Comunicación Frontend ↔ IA
1. El usuario envía un mensaje y/o archivo adjunto
2. El frontend procesa el archivo (comprime imágenes, extrae texto de DOCX, convierte a Base64)
3. Se envía una petición POST a la Cloud Function `askClariDoc`
4. La función construye un historial de conversación y lo envía a Gemini 2.5 Flash
5. La IA responde con markdown y **marcadores estructurados**:
   - `|||MAPA: [término]|||` → Abre el modal de mapa
   - `|||PLAN_JSON: {...}|||` → Muestra confirmación para guardar plan
   - `|||SUGERENCIAS|||` → Muestra preguntas de seguimiento
6. El frontend parsea estos marcadores y ejecuta las acciones correspondientes

### Base de datos (Firestore)
```
chats/{chatId}
  ├── userId: string
  ├── title: string
  ├── createdAt: timestamp
  ├── updatedAt: timestamp
  ├── lastMessage: string
  └── messages/{messageId}
      ├── text: string
      ├── from: "user" | "ai"
      ├── createdAt: timestamp
      ├── fileUrl?: string
      ├── fileType?: string
      └── fileName?: string

users/{userId}
  └── health_plans/{planId}
      ├── titulo: string
      ├── tipo: "medicamento" | "dieta" | "ejercicio"
      ├── detalles: string[]
      ├── duracion: string
      ├── sourceChatId?: string
      ├── createdAt: timestamp
      ├── active: boolean
      └── progress: { "YYYY-MM-DD": number[] }
```

---

## 📸 Capturas

| Landing Page | Chat | Agenda |
|:---:|:---:|:---:|
| Página de marketing animada | Chat con IA y subida de archivos | Seguimiento diario de planes |

---

## 📄 Licencia

Este proyecto es de uso educativo y personal.
