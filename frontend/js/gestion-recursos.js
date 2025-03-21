import API_URL from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user || !user.id) {
        alert("⚠️ Debes iniciar sesión primero");
        window.location.href = "index.html";
        return;
    }

    if (user.rol !== "admin") {
        alert("⛔ Acceso restringido. Solo administradores.");
        window.location.href = "dashboard.html";
        return;
    }

    // Cargar recursos al cargar la página
    cargarRecursos();
});

//Cambiar tipo de recurso
function cambiarTipo() {
    const tipo = document.getElementById("tipo-recurso").value;

    document.getElementById("input-archivo").style.display = tipo === "archivo" || tipo === "imagen" ? "block" : "none";
    document.getElementById("input-video").style.display = tipo === "video" ? "block" : "none";
}

//Subir recurso
async function subirRecurso() {
    const tipo = document.getElementById("tipo-recurso").value;
    const titulo = document.getElementById("titulo").value.trim();
    const descripcion = document.getElementById("descripcion").value.trim();
    const categoria = document.getElementById("categoria").value.trim();
    const usuario_id = JSON.parse(localStorage.getItem("user")).id;

    if (!titulo || !descripcion || !categoria) {
        alert("❌ Todos los campos son obligatorios.");
        return;
    }

    let formData = new FormData();
    formData.append("titulo", titulo);
    formData.append("descripcion", descripcion);
    formData.append("categoria", categoria);
    formData.append("usuario_id", usuario_id);
    formData.append("tipo", tipo);

    if (tipo === "archivo" || tipo === "imagen") {
        const archivo = document.getElementById("archivo").files[0];
        if (!archivo) {
            alert("❌ Debes seleccionar un archivo.");
            return;
        }
        formData.append("archivo", archivo);
    } else if (tipo === "video") {
        const videoUrl = document.getElementById("video-url").value.trim();
        const videoArchivo = document.getElementById("video-archivo").files[0];

        if (!videoUrl && !videoArchivo) {
            alert("❌ Debes ingresar un enlace de YouTube o subir un archivo de video.");
            return;
        }

        if (videoArchivo) {
            formData.append("archivo", videoArchivo);
        } else {
            formData.append("video_url", videoUrl);
        }
    }

    try {
        const response = await fetch(`${API_URL}/recursos/subir`, {
            method: "POST",
            body: formData
        });

        const data = await response.json();
        alert(data.message);

        if (data.success) {
            limpiarFormulario();
            cargarRecursos();
        }
    } catch (error) {
        console.error("❌ Error al subir recurso:", error);
        alert("❌ Error en el servidor.");
    }
}


//Cargar recurso
async function cargarRecursos() {
    try {
        const response = await fetch(`${API_URL}/recursos`);
        const recursos = await response.json();
        const lista = document.getElementById("lista-recursos");
        lista.innerHTML = "";

        recursos.forEach(recurso => {
            const archivoUrl = recurso.archivo_url.startsWith("http") 
                ? recurso.archivo_url  // URL completa (YouTube)
                : `${API_URL}/uploads/${recurso.archivo_url}`; // Archivos locales

            const enlace = recurso.tipo === "video" && recurso.archivo_url.includes("youtube.com")
                ? `<a href="${archivoUrl}" target="_blank">${recurso.titulo} (Video)</a>`
                : `<a href="${archivoUrl}" target="_blank">${recurso.titulo}</a>`;

            let botonDescarga = recurso.tipo === "video" && recurso.archivo_url.includes("youtube.com")
                ? "" 
                : `<button class="btn btn-success btn-sm me-2" onclick="descargarRecurso('${recurso.archivo_url}')">⬇ Descargar</button>`;

            // 🔹 CORRECCIÓN: Definir correctamente la variable li
            const li = document.createElement("li");
            li.className = "list-group-item d-flex justify-content-between align-items-center";

            li.innerHTML = `
                <span>${enlace}</span>
                <div>
                    ${botonDescarga}
                    <button class="btn btn-warning btn-sm me-2" onclick="cargarDatosRecurso('${recurso.id}', '${recurso.titulo}', '${recurso.descripcion}', '${recurso.categoria}', '${recurso.tipo}', '${recurso.archivo_url}')">✏ Editar</button>
                    <button class="btn btn-danger btn-sm" onclick="eliminarRecurso('${recurso.id}')">🗑 Eliminar</button>
                </div>
            `;
            lista.appendChild(li);
        });

    } catch (error) {
        console.error("❌ Error al cargar recursos:", error);
    }
}



//Descargar recurso
function descargarRecurso(nombreArchivo) {
    const url = nombreArchivo.startsWith("http") 
        ? nombreArchivo 
        : `${API_URL}/uploads/${nombreArchivo}`;
    window.open(url, "_blank");
}

//Cargar datos del recurso
function cargarDatosRecurso(id, titulo, descripcion, categoria, tipo, archivo) {
    document.getElementById("titulo").value = titulo;
    document.getElementById("descripcion").value = descripcion;
    document.getElementById("categoria").value = categoria;
    document.getElementById("tipo-recurso").value = tipo;

    document.getElementById("titulo").dataset.idRecurso = id;
    document.getElementById("archivo").dataset.archivoActual = archivo;

    document.getElementById("boton-subir").textContent = "Actualizar";
    document.getElementById("boton-subir").setAttribute("onclick", "actualizarRecurso()");
}

//Actualizar recurso
async function actualizarRecurso() {
    const id = document.getElementById("titulo").dataset.idRecurso;
    const titulo = document.getElementById("titulo").value.trim();
    const descripcion = document.getElementById("descripcion").value.trim();
    const categoria = document.getElementById("categoria").value.trim();
    const tipo = document.getElementById("tipo-recurso").value;
    const archivo = document.getElementById("archivo").files[0];
    const videoArchivo = document.getElementById("video-archivo").files[0];
    const videoUrl = document.getElementById("video-url").value.trim();

    if (!titulo || !descripcion || !categoria) {
        alert("❌ Todos los campos son obligatorios.");
        return;
    }

    let formData = new FormData();
    formData.append("titulo", titulo);
    formData.append("descripcion", descripcion);
    formData.append("categoria", categoria);
    formData.append("tipo", tipo);

    // 📌 Manejo de archivos y videos
    if (tipo === "archivo" || tipo === "imagen") {
        if (archivo) {
            formData.append("archivo", archivo);
        } else {
            formData.append("archivo_actual", document.getElementById("archivo").dataset.archivoActual || "");
        }
    } else if (tipo === "video") {
        if (videoArchivo) {
            formData.append("archivo", videoArchivo);
        } else if (videoUrl) {
            formData.append("video_url", videoUrl);
        } else {
            alert("❌ Debes subir un archivo de video o ingresar una URL de YouTube.");
            return;
        }
    }

    try {
        const response = await fetch(`${API_URL}/recursos/editar/${id}`, {
            method: "PUT",
            body: formData
        });

        const data = await response.json();
        alert(data.message);

        if (data.success) {
            limpiarFormulario();
            cargarRecursos();
        }
    } catch (error) {
        console.error("❌ Error al actualizar recurso:", error);
        alert("❌ Error en el servidor.");
    }
}



//Limpiar campos
function limpiarFormulario() {
    document.getElementById("titulo").value = "";
    document.getElementById("descripcion").value = "";
    document.getElementById("categoria").value = "";
    document.getElementById("archivo").value = "";
    document.getElementById("video-archivo").value = "";
    document.getElementById("video-url").value = "";

    document.getElementById("boton-subir").textContent = "Subir";
    document.getElementById("boton-subir").setAttribute("onclick", "subirRecurso()");
}


//Eliminar recurso
async function eliminarRecurso(id) { 
    if (!confirm("¿Estás seguro de eliminar este recurso?")) return;
    try {
        const response = await fetch(`${API_URL}/recursos/${id}`, {
            method: "DELETE"
        });

        const data = await response.json();
        alert(data.message);
        if (data.success) cargarRecursos();
    } catch (error) {
        console.error("❌ Error al eliminar recurso:", error);
    }
}


// 📌 Buscar recurso por título o categoría
async function buscarRecurso() {
    const query = document.getElementById("buscar-recurso").value.trim();
    
    // ✅ Si el campo está vacío, cargar todos los recursos sin recargar la página
    if (!query) {
        cargarRecursos();
        return;
    }

    try {
        const response = await fetch(`${API_URL}/recursos/buscar?q=${query}`);
        const recursos = await response.json();

        const lista = document.getElementById("lista-recursos");
        lista.innerHTML = "";

        if (recursos.length === 0) {
            lista.innerHTML = "<li class='list-group-item text-center'>⚠️ No se encontraron recursos.</li>";
            return;
        }

        recursos.forEach(recurso => {
            const li = document.createElement("li");
            li.className = "list-group-item d-flex justify-content-between align-items-center";

            let enlace = recurso.tipo === "archivo" || recurso.tipo === "imagen"
                ? `<a href="${API_URL}/uploads/${recurso.archivo_url}" target="_blank">${recurso.titulo}</a>`  
                : `<a href="${recurso.archivo_url}" target="_blank">${recurso.titulo} (Video)</a>`; 

            let botonDescarga = recurso.tipo === "video" && recurso.archivo_url.includes("youtube.com") 
                ? "" 
                : `<button class="btn btn-success btn-sm me-2" onclick="descargarRecurso('${recurso.archivo_url}')">⬇ Descargar</button>`;

            li.innerHTML = `
                <span>${enlace} - ${recurso.categoria}</span>
                <div>
                    ${botonDescarga}
                    <button class="btn btn-warning btn-sm me-2" onclick="cargarDatosRecurso('${recurso.id}', '${recurso.titulo}', '${recurso.descripcion}', '${recurso.categoria}')">✏ Editar</button>
                    <button class="btn btn-danger btn-sm" onclick="eliminarRecurso('${recurso.id}')">🗑 Eliminar</button>
                </div>
            `;
            lista.appendChild(li);
        });

    } catch (error) {
        console.error("❌ Error al buscar recurso:", error);
    }
}

// 📌 Detectar cuando el usuario borra el campo de búsqueda
document.getElementById("buscar-recurso").addEventListener("input", function() {
    if (this.value.trim() === "") {
        cargarRecursos();
    }
});




// 📌 Cerrar sesión
function logout() {
    localStorage.clear();
    window.location.href = "index.html";
}

// 📌 Agregar evento al botón de cerrar sesión
document.addEventListener("DOMContentLoaded", () => {
    const logoutButton = document.getElementById("logout-btn");
    if (logoutButton) {
        logoutButton.addEventListener("click", logout);
    }
});