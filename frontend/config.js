const API_URL = typeof import.meta.env !== "undefined" && import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL
    : "https://biblioteca-virtual-production-377f.up.railway.app"; // Valor por defecto si Netlify no lo pasa

console.log("🔍 API_URL cargada:", API_URL); // Depuración
export default API_URL;
