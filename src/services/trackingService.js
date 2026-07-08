import { db } from '../firebase/config';
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { getDocs } from 'firebase/firestore';

// 1. Guardar un nuevo plan (Ahora recibe sourceChatId)
export const saveHealthPlan = async (userId, planData, sourceChatId) => {
  try {
    const plansRef = collection(db, "users", userId, "health_plans");
    await addDoc(plansRef, {
      ...planData,
      sourceChatId: sourceChatId || null, // Guardamos el origen
      createdAt: serverTimestamp(),
      active: true,
      // Estructura optimizada: progress: { "2025-11-27": [0, 2] } (Indices completados)
      progress: {} 
    });
    return true;
  } catch (error) {
    console.error("Error guardando plan:", error);
    return false;
  }
};

// 2. Leer planes (Igual que antes)
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

// 3. Marcar/Desmarcar tarea (NUEVO)
export const toggleTaskCompletion = async (userId, planId, taskIndex) => {
  try {
    const planRef = doc(db, "users", userId, "health_plans", planId);
    const planSnap = await getDoc(planRef);
    
    if (planSnap.exists()) {
      const data = planSnap.data();
      const today = new Date().toISOString().split('T')[0]; // "2025-11-27"
      
      // Obtenemos el array de tareas completadas hoy (o vacío si no existe)
      let completedToday = data.progress && data.progress[today] ? [...data.progress[today]] : [];

      if (completedToday.includes(taskIndex)) {
        // Si ya está, lo quitamos (desmarcar)
        completedToday = completedToday.filter(i => i !== taskIndex);
      } else {
        // Si no está, lo agregamos (marcar)
        completedToday.push(taskIndex);
      }

      // Actualizamos solo ese campo en la BD (Optimizado)
      await updateDoc(planRef, {
        [`progress.${today}`]: completedToday
      });
    }
  } catch (error) {
    console.error("Error actualizando tarea:", error);
  }
};

// 4. Eliminar plan (Igual que antes)
export const deleteHealthPlan = async (userId, planId) => {
    try {
        const planRef = doc(db, "users", userId, "health_plans", planId);
        await deleteDoc(planRef);
    } catch (error) {
        console.error("Error borrando plan:", error);
    }
};

// 5. Verificar si existe un plan duplicado
export const checkDuplicatePlan = async (userId, planTitle) => {
  try {
    const plansRef = collection(db, "users", userId, "health_plans");
    // Buscamos planes activos con el mismo título
    const q = query(
      plansRef, 
      where("titulo", "==", planTitle),
      where("active", "==", true)
    );
    
    const snapshot = await getDocs(q);
    return !snapshot.empty; // Retorna TRUE si ya existe, FALSE si no.
  } catch (error) {
    console.error("Error verificando duplicados:", error);
    return false; // Ante la duda, permitimos guardar
  }
};