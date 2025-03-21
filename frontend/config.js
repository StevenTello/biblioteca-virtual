console.log("Variables de entorno:", import.meta.env); // Ver todas las variables disponibles

const API_URL = import.meta.env.VITE_API_URL || "https://biblioteca-virtual-production-377f.up.railway.app";
console.log("API_URL:", API_URL); // Ver si la variable se carga correctamente

export default API_URL;

