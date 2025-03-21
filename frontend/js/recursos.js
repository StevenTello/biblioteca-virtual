document.addEventListener("DOMContentLoaded", async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.id) {
        alert("⚠️ Debes iniciar sesión primero");
        window.location.href = "login.html";
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
        const response = await fetch("http://localhost:3000/recursos");
        const recursos = await response.json();
        const contenedor = document.getElementById("lista-recursos");
        contenedor.innerHTML = "";

        recursos.forEach(recurso => {
            if (filtro !== "todos" && recurso.tipo !== filtro) return; // Aplica el filtro correctamente

            const recursoItem = document.createElement("a");
            recursoItem.href = "#";
            recursoItem.className = "list-group-item list-group-item-action recurso-item";
            
            // ✅ Corrección: Evitar rutas duplicadas
            let recursoUrl = recurso.archivo_url.startsWith("/uploads/") 
                ? `http://localhost:3000${recurso.archivo_url}` 
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
        : `http://localhost:3000/uploads/${url}`;

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
        if (recursoUrl.endsWith(".pdf")) {
            contenidoHTML = `<iframe src="${recursoUrl}" class="file-embed" frameborder="0"></iframe>`;
        } else {
            contenidoHTML = `<p>📂 <a href="${recursoUrl}" target="_blank">Abrir Archivo</a></p>`;
        }
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
function logout() {
    localStorage.clear();
    window.location.href = "login.html";
}

// Agregar evento al botón de cerrar sesión
document.addEventListener("DOMContentLoaded", () => {
    const logoutButton = document.getElementById("logout-btn");
    if (logoutButton) {
        logoutButton.addEventListener("click", logout);
    }
});
