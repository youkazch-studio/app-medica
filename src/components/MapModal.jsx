// src/components/MapModal.jsx
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { FiX, FiMapPin, FiNavigation } from 'react-icons/fi';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
});
L.Marker.prototype.options.icon = DefaultIcon;

// --- DICCIONARIO DE TRADUCCIÓN (Español -> OSM Tags) ---
// --- DICCIONARIO DE TRADUCCIÓN MEJORADO (Español -> OSM Tags) ---
// --- DICCIONARIO DE TRADUCCIÓN EXTENDIDO (Español -> OSM Tags) ---
const CATEGORY_MAPPING = {
  // --- 1. GENERAL ---
  'hospital': 'amenity=hospital',
  'clínica': 'amenity=clinic',
  'clinica': 'amenity=clinic',
  'centro médico': 'amenity=clinic',
  'centro medico': 'amenity=clinic',
  'unidad de salud': 'amenity=clinic',
  'consultorio': 'amenity=doctors',
  'doctor': 'amenity=doctors',
  'médico': 'amenity=doctors',
  'medico': 'amenity=doctors',
  'salud': 'amenity=clinic',

  // --- 2. EMERGENCIAS ---
  'urgencia': 'amenity=hospital', // Las urgencias suelen estar en hospitales
  'emergencia': 'amenity=hospital',
  'trauma': 'amenity=hospital',
  'cruz roja': 'amenity=hospital',
  'ambulancia': 'amenity=hospital',

  // --- 3. FARMACIAS Y MEDICAMENTOS ---
  'farmacia': 'amenity=pharmacy',
  'medicina': 'amenity=pharmacy',
  'medicamento': 'amenity=pharmacy',
  'pastilla': 'amenity=pharmacy',
  'receta': 'amenity=pharmacy',
  'drogería': 'amenity=pharmacy',
  'botica': 'amenity=pharmacy',

  // --- 4. LABORATORIOS E IMÁGENES ---
  'laboratorio': 'healthcare=laboratory',
  'analisis': 'healthcare=laboratory',
  'análisis': 'healthcare=laboratory',
  'sangre': 'healthcare=laboratory',
  'rayos x': 'healthcare=laboratory', // A veces están en clínicas, pero lab es buen intento
  'radiografía': 'healthcare=laboratory',
  'ultrasonido': 'amenity=clinic',

  // --- 5. DENTAL ---
  'dentista': 'amenity=dentist',
  'odontólogo': 'amenity=dentist',
  'odontologo': 'amenity=dentist',
  'diente': 'amenity=dentist',
  'muela': 'amenity=dentist',
  'ortodoncia': 'amenity=dentist',

  // --- 6. VISTA / OJOS ---
  'oftalmólogo': 'amenity=clinic', // Ojos suelen ser clínicas especializadas
  'oftalmologo': 'amenity=clinic',
  'oculista': 'amenity=clinic',
  'óptica': 'shop=optician',       // Para lentes
  'optica': 'shop=optician',
  'lentes': 'shop=optician',
  'ojos': 'amenity=clinic',

  // --- 7. ESPECIALIDADES (Mapeadas a 'Doctors' o 'Clinic') ---
  // Huesos / Lesiones
  'traumatólogo': 'amenity=clinic', 
  'traumatologo': 'amenity=clinic',
  'ortopeda': 'amenity=clinic',
  'fisioterapia': 'healthcare=physiotherapist',
  'fisio': 'healthcare=physiotherapist',
  
  // Mujer / Niños
  'ginecólogo': 'amenity=doctors',
  'ginecologo': 'amenity=doctors',
  'pediatra': 'amenity=doctors',
  'bebé': 'amenity=doctors',
  'embarazo': 'amenity=doctors',

  // Corazón
  'cardiólogo': 'amenity=clinic',
  'cardiologo': 'amenity=clinic',
  'corazón': 'amenity=clinic',

  // Piel
  'dermatólogo': 'amenity=doctors',
  'dermatologo': 'amenity=doctors',
  'piel': 'amenity=doctors',

  // Mente
  'psicólogo': 'amenity=doctors',
  'psicologo': 'amenity=doctors',
  'psiquiatra': 'amenity=doctors',
  'salud mental': 'amenity=clinic',

  // Otras
  'nutricionista': 'amenity=doctors',
  'dieta': 'amenity=doctors',
  'otorrino': 'amenity=doctors', // Oído
  'urólogo': 'amenity=doctors',
  'neurologo': 'amenity=clinic',
  'gastro': 'amenity=doctors'
};

const MapModal = ({ isOpen, onClose, searchQuery }) => {
  const [locations, setLocations] = useState([]);
  const [userPos, setUserPos] = useState(null);
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');

  useEffect(() => {
    if (isOpen && searchQuery) {
      setLoading(true);
      setLocations([]);
      setDebugInfo('');

      // 1. Limpieza del término
      let cleanQuery = searchQuery.split(/ o | y | e |,| para /i)[0].trim().toLowerCase();
      
      // 2. Buscar el tag correcto en el diccionario
      // Si no encuentra coincidencia exacta, busca si la palabra está contenida
      let osmTag = null;
      for (const [key, value] of Object.entries(CATEGORY_MAPPING)) {
        if (cleanQuery.includes(key)) {
          osmTag = value;
          break;
        }
      }

      // Si no encontramos categoría, usaremos búsqueda de texto normal como respaldo
      const searchType = osmTag ? 'CATEGORY' : 'TEXT';

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          const { latitude, longitude } = position.coords;
          setUserPos([latitude, longitude]);

          try {
            let data = [];

            if (searchType === 'CATEGORY') {
              // --- ESTRATEGIA A: OVERPASS API (Búsqueda por Categoría) ---
              // Busca en un radio de 5000 metros (5km)
              const [key, value] = osmTag.split('=');
              const overpassQuery = `
                [out:json][timeout:25];
                (
                  node["${key}"="${value}"](around:5000,${latitude},${longitude});
                  way["${key}"="${value}"](around:5000,${latitude},${longitude});
                  relation["${key}"="${value}"](around:5000,${latitude},${longitude});
                );
                out center;
              `;
              
              const response = await fetch('https://overpass-api.de/api/interpreter', {
                method: 'POST',
                body: overpassQuery
              });
              const result = await response.json();
              
              // Formatear datos de Overpass a nuestro formato
              data = result.elements.map(el => ({
                lat: el.lat || el.center.lat,
                lon: el.lon || el.center.lon,
                display_name: el.tags.name || `Ubicación de ${cleanQuery} (Sin nombre)`,
                type: el.tags.amenity || el.tags.healthcare || 'Salud'
              }));

            } else {
              // --- ESTRATEGIA B: NOMINATIM (Respaldo por Texto) ---
              // Si no sabemos la categoría, buscamos por texto en El Salvador
              const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanQuery)}&countrycodes=sv&limit=15`
              );
              data = await response.json();
            }

            // Ordenar por distancia
            const sortedData = data.sort((a, b) => {
                const distA = Math.sqrt(Math.pow(parseFloat(a.lat) - latitude, 2) + Math.pow(parseFloat(a.lon) - longitude, 2));
                const distB = Math.sqrt(Math.pow(parseFloat(b.lat) - latitude, 2) + Math.pow(parseFloat(b.lon) - longitude, 2));
                return distA - distB;
            });

            setLocations(sortedData);
            setDebugInfo(`Estrategia: ${searchType} | Resultados: ${sortedData.length}`);

          } catch (error) {
            console.error("Error buscando lugares:", error);
            setDebugInfo("Error de conexión con el servicio de mapas.");
          } finally {
            setLoading(false);
          }
        }, (error) => {
          console.error("Error geolocalización:", error);
          alert("Necesitamos tu ubicación para encontrar lugares cercanos.");
          setLoading(false);
        });
      } else {
        alert("Tu navegador no soporta geolocalización");
        setLoading(false);
      }
    }
  }, [isOpen, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-4xl h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden relative animate-scale-up">
        
        {/* Header */}
        <div className="bg-[#082F6D] p-4 flex justify-between items-center text-white shadow-md z-10">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/10 rounded-full">
                <FiMapPin className="text-[#50E3C2]" />
            </div>
            <div>
                <h3 className="font-bold font-['Montserrat'] text-lg">Explorador de Salud</h3>
                <p className="text-xs text-gray-300">Buscando: <span className="text-white font-semibold capitalize">{searchQuery}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition text-white">
            <FiX size={24} />
          </button>
        </div>

        {/* Mapa */}
        <div className="flex-grow relative bg-gray-100">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-20 backdrop-blur-sm">
              <div className="w-12 h-12 border-4 border-[#082F6D] border-t-[#50E3C2] rounded-full animate-spin mb-3"></div>
              <span className="text-[#082F6D] font-medium animate-pulse">Escaneando zona actual ...</span>
            </div>
          ) : userPos ? (
            <MapContainer center={userPos} zoom={14} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='© OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* Usuario */}
              <Marker position={userPos}>
                <Popup>
                    <div className="text-center"><strong>Tu Ubicación</strong></div>
                </Popup>
              </Marker>

              {/* Resultados */}
              {locations.map((loc, idx) => (
                <Marker key={idx} position={[parseFloat(loc.lat), parseFloat(loc.lon)]}>
                  <Popup>
                    <div className="min-w-[150px]">
                        <strong className="text-[#082F6D] block mb-1 capitalize">{loc.display_name.split(',')[0]}</strong>
                        <span className="text-xs text-gray-500 block mb-2">
                            {/* Intentamos limpiar la dirección si es muy larga */}
                            {loc.display_name.length > 50 ? 'Ver en mapa para detalle' : loc.display_name}
                        </span>
                        <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lon}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center w-full bg-[#50E3C2] text-[#082F6D] text-xs font-bold py-1.5 rounded hover:bg-opacity-80 transition-colors"
                        >
                            <FiNavigation className="mr-1" /> Cómo llegar
                        </a>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
                No se pudo obtener tu ubicación.
            </div>
          )}
          
          {!loading && locations.length === 0 && (
             <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white px-6 py-3 rounded-full shadow-lg z-[1000] text-sm text-red-500 font-medium border border-red-100 text-center">
                No encontramos "{searchQuery}" en un radio de 5km.<br/>
                <span className="text-xs text-gray-400">Intenta buscar una categoría más general.</span>
             </div>
          )}
        </div>
        
        {/* Debug Footer (Útil para entender qué pasa) */}
        <div className="bg-white p-2 text-[10px] flex justify-between text-gray-400 border-t">
        </div>
      </div>
    </div>
  );
};

export default MapModal;