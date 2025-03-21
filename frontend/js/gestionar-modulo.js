import API_URL from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
    
    const user = JSON.parse(localStorage.getItem("user"));
        
    if (!user || !user.id) {
        alert("⚠️ Debes iniciar sesión primero");
        window.location.href = "login.html";
        return;
    }
        
    if (user.rol !== "admin") {
        alert("⛔ Acceso restringido. Solo administradores.");
        window.location.href = "dashboard.html";
         return;
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    const moduloId = urlParams.get("id");

    if (!moduloId) {
        alert("⚠️ No se ha seleccionado un módulo.");
        window.location.href = "gestion-cursos.html";
        return;
    }

    cargarInformacionModulo(moduloId);
    cargarContenidosModulo(moduloId);
});


// 📌 Cargar la información del módulo seleccionado
async function cargarInformacionModulo(moduloId) {
    try {
        const response = await fetch(`${API_URL}/modulos/${moduloId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const modulo = await response.json();

        document.getElementById("modulo-titulo").textContent = modulo.titulo;
        document.getElementById("modulo-descripcion").textContent = modulo.descripcion;

    } catch (error) {
        console.error("❌ Error al cargar la información del módulo:", error);
    }
}

// 📌 Cargar los contenidos del módulo
async function cargarContenidosModulo(moduloId) {
    try {
        const response = await fetch(`${API_URL}/modulos/${moduloId}/contenido`);
        const contenidos = await response.json();

        const listaContenidos = document.getElementById("lista-contenidos");
        listaContenidos.innerHTML = "";

        contenidos.forEach(contenido => {
            const li = document.createElement("li");
            li.className = "list-group-item d-flex justify-content-between align-items-center";
            li.innerHTML = `
                <span>${contenido.titulo} (${contenido.tipo})</span>
                <div>
                    <button class="btn btn-danger btn-sm" onclick="eliminarContenido(${contenido.id})">❌ Eliminar</button>
                </div>
            `;
            listaContenidos.appendChild(li);
        });

    } catch (error) {
        console.error("❌ Error al cargar contenidos:", error);
    }
}

// 📌 Agregar un nuevo contenido
async function agregarContenido() {
    const moduloId = new URLSearchParams(window.location.search).get("id");
    const titulo = prompt("Ingrese el título del contenido:");
    const tipo = prompt("Ingrese el tipo de contenido (PDF, Video, Imagen, etc.):");

    if (!titulo || !tipo) return;

    try {
        const response = await fetch(`${API_URL}/modulos/${moduloId}/contenido/agregar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ titulo, tipo, descripcion: "", archivo_url: "", contenido_html: "", orden: 1 })
        });

        const data = await response.json();
        alert(data.message);
        cargarContenidosModulo(moduloId);
    } catch (error) {
        console.error("❌ Error al agregar contenido:", error);
    }
}
