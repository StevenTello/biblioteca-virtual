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

    // Cargar usuarios al cargar la página
    cargarUsuarios();
});

// 📌 Cargar Usuarios desde la API
async function cargarUsuarios() {
    try {
        const response = await fetch(`${API_URL}/usuarios`);
        const usuarios = await response.json();
        const tabla = $('#tabla-usuarios').DataTable();
        tabla.clear();

        usuarios.forEach((usuario, index) => {
            const acciones = `
                <button class="btn btn-accion btn-cursos" data-title="Ver Cursos" onclick="verCursos(${usuario.id})">📚</button>
                <button class="btn btn-accion btn-password" data-title="Cambiar Contraseña" onclick="abrirModalPassword(${usuario.id}, '${usuario.nombre}')">🔑</button>
                <button class="btn btn-accion btn-eliminar" data-title="Eliminar Usuario" onclick="eliminarUsuario(${usuario.id})">🗑</button>
            `;

            tabla.row.add([
                index + 1,
                usuario.nombre,
                usuario.email,
                acciones
            ]).draw();
        });
    } catch (error) {
        console.error("❌ Error al cargar usuarios:", error);
    }
}

// 📌 Función para abrir el modal de cambio de contraseña
function abrirModalPassword(id, nombre) {
    document.getElementById("usuario-id").value = id; // Asigna el ID del usuario al input oculto
    document.getElementById("usuario-nombre").textContent = nombre; // Muestra el nombre del usuario en el modal
    let modalPassword = new bootstrap.Modal(document.getElementById("modalPassword"), { backdrop: 'static' });
    modalPassword.show();
}

// 📌 Guardar la nueva contraseña desde el modal
async function cambiarPasswordAdmin() {
    const id = document.getElementById("usuario-id").value;  // Obtiene el ID del usuario del input oculto
    const nuevaPassword = document.getElementById("nuevaPassword").value; // Obtiene la nueva contraseña del input

    if (!nuevaPassword) {
        alert("❌ Debes ingresar una nueva contraseña.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/usuarios/password/admin/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nueva: nuevaPassword })
        });

        const data = await response.json();

        if (data.success) {
            alert("✅ Contraseña actualizada correctamente.");

            // 📌 Cerrar el modal después del cambio
            let modal = bootstrap.Modal.getInstance(document.getElementById("modalPassword"));
            modal.hide();
            
            // 📌 Limpiar el campo de contraseña después de cerrar el modal
            document.getElementById("nuevaPassword").value = "";

            // 📌 Si el usuario cambió su propia contraseña, cerrar sesión
            const user = JSON.parse(localStorage.getItem("user"));
            if (user && user.id == id) {
                alert("⚠️ Tu contraseña ha sido cambiada. Debes iniciar sesión nuevamente.");
                localStorage.clear();
                window.location.href = "login.html";
            }
        } else {
            alert("❌ " + data.message);
        }
    } catch (error) {
        console.error("❌ Error al cambiar contraseña:", error);
    }
}



// 📌 Eliminar Usuario
async function eliminarUsuario(id) {
    if (!confirm("¿Estás seguro de eliminar este usuario?")) return;
    try {
        const response = await fetch(`${API_URL}/usuarios/${id}`, {
            method: "DELETE"
        });
        const data = await response.json();
        if (data.success) {
            alert("✅ Usuario eliminado correctamente.");
            cargarUsuarios();
        } else {
            alert("❌ " + data.message);
        }
    } catch (error) {
        console.error("❌ Error al eliminar usuario:", error);
    }
}




// 📌 Ver los cursos a los que un usuario está inscrito
async function verCursos(usuarioId) {
    try {
        const response = await fetch(`${API_URL}/mis-cursos/${usuarioId}`);

        if (!response.ok) {
            throw new Error(`Error HTTP ${response.status}`);
        }

        const cursos = await response.json();
        const listaCursos = document.getElementById("lista-cursos");
        listaCursos.innerHTML = ""; // Limpiar antes de agregar nuevos cursos

        if (cursos.length === 0) {
            listaCursos.innerHTML = "<li class='list-group-item text-center'>📌 No hay cursos inscritos.</li>";
        } else {
            cursos.forEach(curso => {
                const progreso = curso.progreso !== undefined ? `${curso.progreso}%` : "Sin progreso";
                const item = `<li class="list-group-item">${curso.titulo} </li>`;
                listaCursos.innerHTML += item;
            });
        }

        // 📌 Asegurar que el modal se muestra correctamente
        let modalCursos = new bootstrap.Modal(document.getElementById("modalCursos"), { backdrop: 'static' });
        // 📌 Asegurar que el modal sea accesible
        document.getElementById("modalCursos").setAttribute("aria-hidden", "false");
        modalCursos.show();

    } catch (error) {
        console.error("❌ Error al obtener cursos:", error);
    }
}


// 📌 Cerrar Sesión
function logout() {
    localStorage.clear();
    window.location.href = "login.html";
}

// 📌 Agregar evento al botón de cerrar sesión
document.addEventListener("DOMContentLoaded", () => {
    const logoutButton = document.getElementById("logout-btn");
    if (logoutButton) {
        logoutButton.addEventListener("click", logout);
    }
});
