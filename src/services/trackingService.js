/**
 * Servicio CRUD para planes de salud (tracking) en Firestore.
 *
 * Permite guardar, leer, eliminar y actualizar el progreso diario
 * de los planes generados por la IA (medicación, dieta, ejercicio).
 *
 * @module trackingService
 */
import { db } from '../firebase/config';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, deleteDoc, getDoc, getDocs } from 'firebase/firestore';

/**
 * Guarda un nuevo plan de salud para el usuario.
 * @param {string} userId - ID del usuario
 * @param {object} planData - Datos del plan (titulo, tipo, detalles, duracion)
 * @param {string|null} sourceChatId - ID del chat que originó el plan (opcional)
 * @returns {Promise<boolean>} true si se guardó correctamente
 */
export const saveHealthPlan = async (userId, planData, sourceChatId) => {
  try {
    const plansRef = collection(db, "users", userId, "health_plans");
    await addDoc(plansRef, {
      ...planData,
      sourceChatId: sourceChatId || null,
      createdAt: serverTimestamp(),
      active: true,
      progress: {}
    });
    return true;
  } catch (error) {
    console.error("Error guardando plan:", error);
    return false;
  }
};

/**
 * Se suscribe en tiempo real a los planes de salud del usuario.
 * @param {string} userId - ID del usuario
 * @param {Function} callback - Función que recibe el array de planes
 * @returns {Function} Función para desuscribirse
 */
export const subscribeToHealthPlans = (userId, callback) => {
  const plansRef = collection(db, "users", userId, "health_plans");
  const q = query(plansRef, orderBy("createdAt", "desc"));

  return onSnapshot(q, (snapshot) => {
    const plans = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(plans);
  });
};

/**
 * Marca o desmarca una tarea como completada para el día de hoy.
 * Usa un mapa de fechas a índices de tareas completadas: { "YYYY-MM-DD": [0, 2] }
 * @param {string} userId - ID del usuario
 * @param {string} planId - ID del plan
 * @param {number} taskIndex - Índice de la tarea dentro del array detalles
 */
export const toggleTaskCompletion = async (userId, planId, taskIndex) => {
  try {
    const planRef = doc(db, "users", userId, "health_plans", planId);
    const planSnap = await getDoc(planRef);
    
    if (planSnap.exists()) {
      const data = planSnap.data();
      const today = new Date().toISOString().split('T')[0];
      
      let completedToday = data.progress && data.progress[today] ? [...data.progress[today]] : [];

      if (completedToday.includes(taskIndex)) {
        completedToday = completedToday.filter(i => i !== taskIndex);
      } else {
        completedToday.push(taskIndex);
      }

      await updateDoc(planRef, {
        [`progress.${today}`]: completedToday
      });
    }
  } catch (error) {
    console.error("Error actualizando tarea:", error);
  }
};

/**
 * Elimina un plan de salud por su ID.
 * @param {string} userId - ID del usuario
 * @param {string} planId - ID del plan a eliminar
 */
export const deleteHealthPlan = async (userId, planId) => {
    try {
        const planRef = doc(db, "users", userId, "health_plans", planId);
        await deleteDoc(planRef);
    } catch (error) {
        console.error("Error borrando plan:", error);
    }
};

/**
 * Verifica si ya existe un plan activo con el mismo título (para evitar duplicados).
 * @param {string} userId - ID del usuario
 * @param {string} planTitle - Título del plan a verificar
 * @returns {Promise<boolean>} true si ya existe un plan con ese título
 */
export const checkDuplicatePlan = async (userId, planTitle) => {
  try {
    const plansRef = collection(db, "users", userId, "health_plans");
    const q = query(
      plansRef, 
      where("titulo", "==", planTitle),
      where("active", "==", true)
    );
    
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error("Error verificando duplicados:", error);
    return false;
  }
};