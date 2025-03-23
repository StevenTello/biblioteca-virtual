import API_URL from "./config.js";

document.addEventListener("DOMContentLoaded", async () => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user || !user.id) {
        alert("⚠️ Debes iniciar sesión primero");
        window.location.href = "index.html";
        return;
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    const cursoId = urlParams.get("id");

    if (!cursoId) {
        alert("⚠️ No se ha seleccionado un curso.");
        window.location.href = "dashboard.html";
        return;
    }

    // ✅ Cargar solo la información del curso seleccionado
    cargarInformacionCurso(cursoId);
    cargarModulos(cursoId);
    cargarNavbar(user.rol);
    cargarCurso();
});

// 📌 Función para cargar el navbar correcto
function cargarNavbar(rol) {
    const navLinks = document.getElementById("nav-links");

    if (rol === "admin") {
        navLinks.innerHTML = `
            <li class="nav-item"><a class="nav-link" href="admin.html">🏠 Admin</a></li>
            <li class="nav-item"><a class="nav-link" href="gestion-cursos.html">⚙️ Cursos</a></li>
            <li class="nav-item"><a class="nav-link" href="gestion-recursos.html">📂 Recursos</a></li>
            <li class="nav-item"><a class="nav-link" href="gestion-usuarios.html">👥 Usuarios</a></li>
            <li class="nav-item"><button id="logout-btn" class="btn btn-danger">Cerrar Sesión</button></li>
        `;
    } else {
        navLinks.innerHTML = `
            <li class="nav-item"><a class="nav-link" href="dashboard.html">🏠 Dashboard</a></li>
            <li class="nav-item"><a class="nav-link" href="profile.html">👤 Perfil</a></li>
            <li class="nav-item"><a class="nav-link" href="recursos.html">📂 Recursos</a></li>
            <li class="nav-item"><button id="logout-btn" class="btn btn-danger">Cerrar Sesión</button></li>
        `;
    }

    // 📌 Agregar evento al botón de cerrar sesión
    document.getElementById("logout-btn").addEventListener("click", logout);
}

// 📌 Función para cargar el curso
function cargarCurso() {
    const params = new URLSearchParams(window.location.search);
    const cursoId = params.get("id");

    fetch(`${API_URL}/cursos/${cursoId}`)
        .then(response => response.json())
        .then(curso => {
            document.getElementById("titulo-curso").innerText = curso.titulo;
            document.getElementById("descripcion-curso").innerText = curso.descripcion;
        })
        .catch(error => console.error("❌ Error al cargar curso:", error));
}

/* 📌 Función para cargar información del curso */
async function cargarInformacionCurso(cursoId) {
    try {
        const response = await fetch(`${API_URL}/cursos/${cursoId}`);
        if (!response.ok) throw new Error("No se pudo obtener el curso");

        const curso = await response.json();
        document.getElementById("curso-titulo").textContent = curso.titulo;
        document.getElementById("curso-descripcion").textContent = curso.descripcion;
    } catch (error) {
        console.error("❌ Error al cargar el curso:", error);
    }
}

/* 📌 Función para cargar módulos del curso */
async function cargarModulos(cursoId) {
    try {
        const response = await fetch(`${API_URL}/cursos/${cursoId}/modulos`);
        if (!response.ok) throw new Error("No se pudieron obtener los módulos");

        const modulos = await response.json();
        const listaModulos = document.getElementById("lista-modulos");
        listaModulos.innerHTML = "";

        modulos.forEach(modulo => {
            const cardDiv = document.createElement("div");
            cardDiv.className = "col-md-6";

            cardDiv.innerHTML = `
                <div class="card shadow-sm mb-4">
                    <div class="card-body text-center">
                        <h5 class="card-title">${modulo.titulo}</h5>
                        <p class="card-text">${modulo.descripcion}</p>
                        <button class='btn btn-primary' onclick="verContenido(${modulo.id})">📂 Ver Contenido</button>
                        <div id="contenido-modulo-${modulo.id}" class="contenido mt-3 d-none"></div>
                    </div>
                </div>
            `;
            listaModulos.appendChild(cardDiv);
        });

    } catch (error) {
        console.error("❌ Error al cargar módulos:", error);
    }
}

//Ver contenido
async function verContenido(moduloId) {
    const modalBody = document.getElementById("modal-contenido-body");
    modalBody.innerHTML = ""; // Limpiar contenido previo

    try {
        const response = await fetch(`${API_URL}/modulos/${moduloId}/contenido`);
        if (!response.ok) throw new Error("No se pudo obtener el contenido del módulo");

        const contenidos = await response.json();

        contenidos.forEach(contenido => {
            let contenidoHTML = `<p><strong>${contenido.titulo}</strong></p>`;

            if (contenido.tipo === "imagen") {
                contenidoHTML += `<img src="${contenido.archivo_url}" class="img-fluid rounded mt-2" style="max-width:100%; height:auto;" alt="Imagen del módulo">`;
            } else if (contenido.tipo === "archivo" || contenido.tipo === "actividad") {
                const fileExtension = contenido.archivo_url.split('.').pop().toLowerCase();

                if (["pdf"].includes(fileExtension)) {
                    contenidoHTML += `
                        <iframe class="file-embed" src="${contenido.archivo_url}" style="width:100%; height:500px;" frameborder="0"></iframe>
                    `;
                } else if (["doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(fileExtension)) {
                    contenidoHTML += `
                        <iframe class="file-embed" src="https://view.officeapps.live.com/op/embed.aspx?src=${window.location.origin}${contenido.archivo_url}" style="width:100%; height:500px;" frameborder="0"></iframe>
                    `;
                } else {
                    contenidoHTML += `
                        <p>📂 <a href="${contenido.archivo_url}" target="_blank">Abrir Archivo (${fileExtension})</a></p>
                    `;
                }
            } else if (contenido.tipo === "video") {
                if (contenido.archivo_url.includes("youtube.com") || contenido.archivo_url.includes("youtu.be")) {
                    let videoId = "";
                    if (contenido.archivo_url.includes("youtu.be")) {
                        videoId = contenido.archivo_url.split("youtu.be/")[1]; 
                    } else {
                        const urlParams = new URLSearchParams(new URL(contenido.archivo_url).search);
                        videoId = urlParams.get("v");
                    }
                    if (videoId) {
                        contenidoHTML += `<iframe class="video-embed" src="https://www.youtube.com/embed/${videoId}" style="width:100%; height:400px;" frameborder="0" allowfullscreen></iframe>`;
                    } else {
                        contenidoHTML += `<p>Error al cargar el video de YouTube</p>`;
                    }
                } else {
                    contenidoHTML += `<video width="100%" controls class="video-embed mt-2" style="height:400px;">
                        <source src="${contenido.archivo_url}" type="video/mp4">
                        Tu navegador no soporta la reproducción de video.
                    </video>`;
                }
            }  else if (contenido.tipo === "juego") {
                contenidoHTML += `
                    <iframe class="game-embed" src="${contenido.archivo_url}" style="width:100%; height:600px;" frameborder="0" allowfullscreen></iframe>
                `;
            }
            else if (contenido.tipo === "test") {
                // ✅ Cerrar el modal antes de abrir el test
                cerrarModalVerContenido();
            
                // ✅ Abrir el test en una nueva pestaña
                window.open(contenido.archivo_url, "_blank");
            
                return; // 🚨 Salir de la función para evitar agregar más contenido
            }
            
            
            const contenidoItem = document.createElement("div");
            contenidoItem.className = "mt-2";
            contenidoItem.innerHTML = contenidoHTML;
            modalBody.appendChild(contenidoItem);
        });

        // Mostrar el modal
        const modalElement = document.getElementById("modalVerContenido");
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    } catch (error) {
        console.error("❌ Error al cargar contenido del módulo:", error);
    }
}



/* 📌 Función para iniciar un test */
function iniciarTest(testId) {
    alert("Iniciar test: " + testId);
    // Aquí se puede cargar el test desde la base de datos y mostrarlo en el modal
}


/* 📌 Función para cerrar el modal y detener videos */
function cerrarModalVerContenido() {
    const modalElement = document.getElementById("modalVerContenido");
    const modal = bootstrap.Modal.getInstance(modalElement);
    
    if (modal) modal.hide();

    // 🚨 Detener videos locales
    document.querySelectorAll("#modal-contenido-body video").forEach(video => {
        video.pause();
        video.currentTime = 0;
    });

    // 🚨 Detener videos de YouTube
    document.querySelectorAll("#modal-contenido-body iframe").forEach(iframe => {
        iframe.src = iframe.src;
    });

    modalElement.setAttribute("aria-hidden", "true");
    modalElement.style.display = "none";
    document.activeElement.blur();
}


// Cerrar sesión
async function logout() {
    try {
        await fetch(`${API_URL}/auth/logout`, { method: "POST" });
    } catch (error) {
        console.error("Error cerrando sesión:", error);
    }
    localStorage.clear();
    window.location.href = "index.html";
}


// ✅ Exponer funciones globalmente para que funcionen con onclick desde el HTML
window.verContenido = verContenido;
window.iniciarTest = iniciarTest;
window.cerrarModalVerContenido = cerrarModalVerContenido;
window.logout = logout;

