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

    // Obtener el curso actual
    const urlParams = new URLSearchParams(window.location.search);
    const cursoId = urlParams.get("id");

    if (!cursoId) {
        alert("⚠️ No se ha seleccionado un curso.");
        window.location.href = "gestion-cursos.html";
        return;
    }

    // ✅ Cargar información del curso y módulos al abrir la página
    cargarInformacionCurso(cursoId);
    cargarModulos(cursoId);
});

/* 📌 Función para cargar información del curso */
async function cargarInformacionCurso(cursoId) {
    try {
        const response = await fetch(`${API_URL}/cursos/${cursoId}`);
        const curso = await response.json();
        document.getElementById("curso-titulo").textContent = curso.titulo;
        document.getElementById("curso-descripcion").textContent = curso.descripcion;
    } catch (error) {
        console.error("❌ Error al cargar la información del curso:", error);
    }
}

/* 📌 Función para cargar los módulos del curso */
async function cargarModulos(cursoId) {
    try {
        const response = await fetch(`${API_URL}/cursos/${cursoId}/modulos`);
        const modulos = await response.json();
        const listaModulos = document.getElementById("lista-modulos");
        listaModulos.innerHTML = "";

        modulos.forEach(modulo => {
            const li = document.createElement("li");
            li.className = "list-group-item";
            li.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <span><strong>${modulo.titulo}</strong></span>
                    <div>
                        <button class="btn btn-primary btn-sm" onclick="abrirModalAgregarContenido(${modulo.id})">📂 Agregar Contenido</button>
                        <button class="btn btn-danger btn-sm" onclick="eliminarModulo(${modulo.id})">❌ Eliminar</button>
                    </div>
                </div>
                <ul id="contenido-modulo-${modulo.id}" class="list-group mt-2">
                    <!-- Aquí se cargará el contenido del módulo dinámicamente -->
                </ul>
            `;
            listaModulos.appendChild(li);
            cargarContenido(modulo.id);
        });

    } catch (error) {
        console.error("❌ Error al cargar módulos:", error);
    }
}

/* 📌 Función para abrir el modal de agregar/editar contenido */
function abrirModalAgregarContenido(moduloId, contenidoId = null, titulo = "", tipo = "archivo", descripcion = "", archivoUrl = "") {
    document.getElementById("contenido-modulo-id").value = moduloId;
    document.getElementById("contenido-id").value = contenidoId || "";
    document.getElementById("contenido-titulo").value = titulo;
    document.getElementById("contenido-tipo").value = tipo;
    document.getElementById("contenido-descripcion").value = descripcion;
    document.getElementById("contenido-url").value = archivoUrl || "";

    const modal = new bootstrap.Modal(document.getElementById("modalAgregarContenido"));
    modal.show();
}

/* 📌 Función para abrir el modal de agregar módulo */
function abrirModalAgregarModulo() {
    document.getElementById("modulo-titulo").value = "";
    document.getElementById("modulo-descripcion").value = "";

    const modal = new bootstrap.Modal(document.getElementById("modalAgregarModulo"));
    modal.show();
}

/* 📌 Evento para manejar el formulario de agregar módulo */
document.getElementById("formAgregarModulo").addEventListener("submit", async function (e) {
    e.preventDefault();
    agregarModulo();
});


/* 📌 Función para agregar un módulo (evitar duplicados) */
async function agregarModulo() {
    const cursoId = new URLSearchParams(window.location.search).get("id");
    const titulo = document.getElementById("modulo-titulo").value.trim();
    const descripcion = document.getElementById("modulo-descripcion").value.trim();
    
    if (!titulo || !descripcion) {
        alert("❌ Todos los campos son obligatorios.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/cursos/${cursoId}/modulos/agregar`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ titulo, descripcion, orden: 0 })
        });

        const data = await response.json();

        if (!response.ok) {
            alert("❌ " + data.message); // 📌 Muestra mensaje de error si el módulo ya existe
            return;
        }

        alert(data.message);

        // 📌 Cerrar modal y recargar módulos
        bootstrap.Modal.getInstance(document.getElementById("modalAgregarModulo")).hide();
        cargarModulos(cursoId);
    } catch (error) {
        console.error("❌ Error al agregar módulo:", error);
    }
}


/* 📌 Evento para manejar agregar/editar contenido */
document.getElementById("formAgregarContenido").addEventListener("submit", async function (e) {
    e.preventDefault();
    const contenidoId = document.getElementById("contenido-id").value;

    if (contenidoId) {
        editarContenido();
    } else {
        agregarContenido();
    }
});


/* 📌 Función para agregar contenido (Evitar duplicados) */
async function agregarContenido() {
    const moduloId = document.getElementById("contenido-modulo-id").value;
    const titulo = document.getElementById("contenido-titulo").value.trim();
    const tipo = document.getElementById("contenido-tipo").value;
    const descripcion = document.getElementById("contenido-descripcion").value.trim();
    const archivoUrl = document.getElementById("contenido-url").value || null;
    const archivo = document.getElementById("contenido-archivo").files[0];

    // ✅ Verificar tipo de archivo si aplica
    if (archivo) {
        const fileExtension = archivo.name.split(".").pop().toLowerCase();
        if ((tipo === "archivo" || tipo === "actividad") && fileExtension !== "pdf") {
            alert("⚠️ Solo se permiten archivos en formato PDF.");
            return;
        }
    }

    if (!titulo || !tipo || !descripcion) {
        alert("❌ Todos los campos son obligatorios.");
        return;
    }

    const formData = new FormData();
    formData.append("titulo", titulo);
    formData.append("tipo", tipo);
    formData.append("descripcion", descripcion);
    formData.append("archivo_url", archivoUrl);
    if (archivo) {
        formData.append("archivo", archivo);
    }

    try {
        const response = await fetch(`${API_URL}/modulos/${moduloId}/contenido/agregar`, {
            method: "POST",
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            alert("❌ " + data.message);
            return;
        }

        alert(data.message);
        bootstrap.Modal.getInstance(document.getElementById("modalAgregarContenido")).hide();
        limpiarFormulario();
        cargarModulos(new URLSearchParams(window.location.search).get("id"));
    } catch (error) {
        console.error("❌ Error al agregar contenido:", error);
    }
}



/* 📌 Función para editar contenido (Evitar duplicados) */
async function editarContenido() {
    const contenidoId = document.getElementById("contenido-id").value;
    const titulo = document.getElementById("contenido-titulo").value.trim();
    const tipo = document.getElementById("contenido-tipo").value;
    const descripcion = document.getElementById("contenido-descripcion").value.trim();
    const archivoUrl = document.getElementById("contenido-url").value || null;
    const archivo = document.getElementById("contenido-archivo").files[0];

    if (!titulo || !tipo || !descripcion) {
        alert("❌ Todos los campos son obligatorios.");
        return;
    }

    if (archivo) {
        const fileExtension = archivo.name.split(".").pop().toLowerCase();
        if ((tipo === "archivo" || tipo === "actividad") && fileExtension !== "pdf") {
            alert("⚠️ Solo se permiten archivos PDF en esta categoría.");
            return;
        }
    }

    const formData = new FormData();
    formData.append("titulo", titulo);
    formData.append("tipo", tipo);
    formData.append("descripcion", descripcion);
    formData.append("archivo_url", archivoUrl);
    if (archivo) {
        formData.append("archivo", archivo);
    }

    try {
        const response = await fetch(`${API_URL}/contenido/${contenidoId}`, {
            method: "PUT",
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            alert("❌ " + data.message);
            return;
        }

        alert(data.message);
        bootstrap.Modal.getInstance(document.getElementById("modalAgregarContenido")).hide();
        limpiarFormulario();
        cargarModulos(new URLSearchParams(window.location.search).get("id"));
    } catch (error) {
        console.error("❌ Error al editar contenido:", error);
    }
}


/* 📌 Función para limpiar el formulario del modal */
function limpiarFormulario() {
    document.getElementById("contenido-id").value = "";
    document.getElementById("contenido-titulo").value = "";
    document.getElementById("contenido-tipo").value = "archivo";
    document.getElementById("contenido-descripcion").value = "";
    document.getElementById("contenido-url").value = "";
    document.getElementById("contenido-archivo").value = "";
}


/* 📌 Función para cargar contenido de un módulo */
async function cargarContenido(moduloId) {
    try {
        const response = await fetch(`${API_URL}/modulos/${moduloId}/contenido`);
        const contenidos = await response.json();

        const listaContenidos = document.getElementById(`contenido-modulo-${moduloId}`);
        listaContenidos.innerHTML = "";

        contenidos.forEach(contenido => {
            const li = document.createElement("li");
            li.className = "list-group-item d-flex justify-content-between align-items-center";
            li.innerHTML = `
                <span>${contenido.titulo} (${contenido.tipo}): ${contenido.descripcion}</span>
                <div>
                    <button class="btn btn-primary btn-sm" onclick="abrirModalAgregarContenido(${moduloId}, ${contenido.id}, '${contenido.titulo}', '${contenido.tipo}', '${contenido.descripcion}', '${contenido.archivo_url || ""}')"> ✏️ Editar </button>
                    <button class="btn btn-danger btn-sm" onclick="eliminarContenido(${contenido.id}, ${moduloId})">❌ Eliminar</button>
                </div>
            `;
            listaContenidos.appendChild(li);
        });
    } catch (error) {
        console.error("❌ Error al cargar contenido del módulo:", error);
    }
}

/* 📌 Función para eliminar contenido */
async function eliminarContenido(contenidoId, moduloId) {
    if (!confirm("¿Estás seguro de eliminar este contenido?")) return;

    try {
        const response = await fetch(`${API_URL}/contenido/${contenidoId}`, { method: "DELETE" });
        const data = await response.json();
        alert(data.message);
        cargarContenido(moduloId);
    } catch (error) {
        console.error("❌ Error al eliminar contenido:", error);
    }
}

/* 📌 Función para eliminar un módulo */
async function eliminarModulo(moduloId) {
    const confirmacion = confirm("⚠️ ¿Estás seguro de eliminar este módulo? Esta acción no se puede deshacer.");
    if (!confirmacion) return;

    try {
        const response = await fetch(`${API_URL}/modulos/${moduloId}`, { method: "DELETE" });

        if (!response.ok) {
            const errorText = await response.text(); // Captura la respuesta del servidor
            throw new Error(`Error en el servidor: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log("✅ Respuesta del servidor:", data); // 👀 Ver la respuesta en la consola

        alert(data.message || "✅ Módulo eliminado correctamente.");

        console.log("🔄 Recargando módulos...");
        location.reload(); // 🔄 Recargar la página para ver los cambios reflejados

    } catch (error) {
        console.error("❌ Error al eliminar módulo:", error);
        alert(`Hubo un error al eliminar el módulo.\n${error.message}`);
    }
}



/* 📌 Cerrar sesión */
function logout() {
    localStorage.clear();
    window.location.href = "index.html";
}

document.getElementById("logout-btn").addEventListener("click", logout);

