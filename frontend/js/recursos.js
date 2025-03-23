import API_URL from "./config.js";

document.addEventListener("DOMContentLoaded", async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.id) {
        alert("⚠️ Debes iniciar sesión primero");
        window.location.href = "index.html";
        return;
    }

    cargarRecursos();

    // ✅ Corrección: Agregar evento para actualizar cuando cambia el filtro
    document.getElementById("filtro").addEventListener("change", () => {
        cargarRecursos(document.getElementById("filtro").value);
    });
});


/* 📌 Cargar Recursos desde el servidor */
async function cargarRecursos(filtro = "todos") {
    try {
        const response = await fetch(`${API_URL}/recursos`);
        const recursos = await response.json();
        const contenedor = document.getElementById("lista-recursos");
        contenedor.innerHTML = "";

        recursos.forEach(recurso => {
            if (filtro !== "todos" && recurso.tipo !== filtro) return;

            const recursoItem = document.createElement("a");
            recursoItem.href = "#";
            recursoItem.className = "list-group-item list-group-item-action recurso-item";

            let recursoUrl = recurso.archivo_url.startsWith("/uploads/") 
                ? `${API_URL}${recurso.archivo_url}` 
                : recurso.archivo_url;

            recursoItem.innerHTML = `<strong>${recurso.titulo}</strong>`;
            recursoItem.onclick = () => verRecurso(recurso.tipo, recursoUrl);
            contenedor.appendChild(recursoItem);
        });

    } catch (error) {
        console.error("❌ Error al cargar recursos:", error);
    }
}


/* 📌 Filtrar recursos */
function filtrarRecursos() {
    const filtroSeleccionado = document.getElementById("filtro").value;
    cargarRecursos(filtroSeleccionado);
}

/* 📌 Mostrar lista de recursos */
function mostrarRecursos(recursos, filtro) {
    const contenedor = document.getElementById("lista-recursos");
    contenedor.innerHTML = "";

    recursos.filter(recurso => filtro === "todos" || recurso.tipo === filtro)
        .forEach(recurso => {
            const recursoItem = document.createElement("a");
            recursoItem.href = "#";
            recursoItem.className = "list-group-item list-group-item-action recurso-item";
            recursoItem.innerHTML = `<strong>${recurso.titulo}</strong>`;
            recursoItem.onclick = () => verRecurso(recurso.tipo, recurso.archivo_url);
            contenedor.appendChild(recursoItem);
        });
}

/* 📌 Visualizar el recurso seleccionado */
function verRecurso(tipo, url) {
    const visualizador = document.getElementById("visualizador");
    if (!visualizador) {
        console.error("❌ No se encontró el elemento 'visualizador'");
        return;
    }

    let recursoUrl = url.includes("youtube.com") || url.includes("youtu.be") 
        ? url 
        : `${API_URL}/uploads/${url}`;

    let contenidoHTML = "";

    if (tipo === "imagen") {
        contenidoHTML = `<img src="${recursoUrl}" class="img-fluid" alt="Imagen del recurso">`;
    } else if (tipo === "video") {
        if (url.includes("youtube.com") || url.includes("youtu.be")) {
            const videoId = extraerVideoID(url);
            contenidoHTML = `<iframe width="100%" height="400px" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen sandbox="allow-scripts allow-same-origin allow-presentation"></iframe>`;
        } else {
            contenidoHTML = `<video controls class="video-embed"><source src="${recursoUrl}" type="video/mp4">Tu navegador no soporta la reproducción de video.</video>`;
        }
    } else if (tipo === "archivo") {
        contenidoHTML = recursoUrl.endsWith(".pdf") 
            ? `<iframe src="${recursoUrl}" class="file-embed" frameborder="0"></iframe>` 
            : `<p>📂 <a href="${recursoUrl}" target="_blank">Abrir Archivo</a></p>`;
    }

    visualizador.innerHTML = contenidoHTML;
}


/* 📌 Función para extraer el ID de un video de YouTube */
function extraerVideoID(url) {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

// Cerrar sesión
async function logout() {
    try {
        await fetch(`${API_URL}/auth/logout`, { method: "POST" }); // Asegúrate de que tu backend tenga este endpoint
    } catch (error) {
        console.error("Error cerrando sesión:", error);
    }
    localStorage.clear();
    window.location.href = "index.html";
}


// Agregar evento al botón de cerrar sesión
async function logout() {
    try {
        await fetch(`${API_URL}/auth/logout`, { method: "POST" });
    } catch (error) {
        console.error("Error cerrando sesión:", error);
    }
    localStorage.clear();
    window.location.href = "index.html";
}

// 📌 Exponer funciones al objeto global para uso en HTML
window.filtrarRecursos = filtrarRecursos;
window.verRecurso = verRecurso;
window.logout = logout;
