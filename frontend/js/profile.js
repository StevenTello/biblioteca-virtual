import API_URL from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user || !user.id) {
        alert("⚠️ Debes iniciar sesión primero");
        window.location.href = "index.html";
        return;
    }

    fetch(`${API_URL}/usuarios/${user.id}`)
        .then(response => response.json())
        .then(data => {
            document.getElementById("user-name").textContent = data.nombre;
            document.getElementById("user-email").textContent = data.email || "Correo no disponible";
            document.getElementById("user-role").textContent = data.rol === "admin" ? "Administrador" : "Usuario";

            const avatarUrl = data.avatar ? `/avatars/${data.avatar}` : "/avatars/default.png";
            document.getElementById("user-avatar").src = avatarUrl;

            user.avatar = avatarUrl;
            localStorage.setItem("user", JSON.stringify(user));

            cargarHistorialCursos(user.id);
        })
        .catch(error => console.error("❌ Error cargando datos de usuario:", error));
});



// 📌 Actualizar Perfil (nombre y avatar se mantienen tras cerrar sesión)
function actualizarPerfil() {
    const nuevoNombre = document.getElementById("edit-name").value.trim(); // 🔹 Eliminamos espacios innecesarios
    if (!nuevoNombre) {
        alert("❌ El nombre no puede estar vacío.");
        return;
    }

    const user = JSON.parse(localStorage.getItem("user"));

    fetch(`${API_URL}/usuarios/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nuevoNombre })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert("✅ Perfil actualizado correctamente.");
            
            // 🔹 Actualizar el nombre en la UI
            document.getElementById("user-name").textContent = nuevoNombre;

            // 🔹 Guardar el nuevo nombre en localStorage
            user.nombre = nuevoNombre;
            localStorage.setItem("user", JSON.stringify(user));

            // 🔹 Limpiar el campo de entrada después de guardar
            document.getElementById("edit-name").value = "";
        } else {
            alert("❌ Error al actualizar perfil.");
        }
    })
    .catch(error => console.error("❌ Error actualizando perfil:", error));
}



// 📌 Cambiar Contraseña 
function cambiarContraseña() {
    const actual = document.getElementById("current-password").value;
    const nueva = document.getElementById("new-password").value;
    const confirmar = document.getElementById("confirm-password").value;

    if (!actual || !nueva || !confirmar) {
        alert("❌ Todos los campos son obligatorios.");
        return;
    }

    if (nueva !== confirmar) {
        alert("❌ Las contraseñas no coinciden.");
        return;
    }

    const user = JSON.parse(localStorage.getItem("user"));

    fetch(`${API_URL}/usuarios/password/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actual, nueva })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert("✅ Contraseña actualizada correctamente. Inicia sesión de nuevo.");

            // 📌 Cerrar sesión para evitar inconsistencias
            localStorage.clear();
            window.location.href = "login.html";
        } else {
            alert("❌ " + data.message);
        }
    })
    .catch(error => console.error("❌ Error actualizando contraseña:", error));
}


// 📌 Cargar Historial de Cursos (corregido)
function cargarHistorialCursos(userId) {
    fetch(`${API_URL}/mis-cursos/${userId}`)
        .then(response => response.json())
        .then(courses => {
            const list = document.getElementById("courses-history");
            list.innerHTML = "";

            courses.forEach(course => {
                const item = `<li class="list-group-item">${course.titulo}</li>`;
                list.innerHTML += item;
            });
        })
        .catch(error => console.error("❌ Error cargando historial de cursos:", error));
}

//Avatares

const avatarGallery = document.getElementById("avatar-gallery");
const avatars = ["avatar1.png", "avatar2.png", "avatar3.png", "avatar4.png", "avatar5.png", "avatar6.png", "avatar7.png"]; // Avatares disponibles

avatars.forEach(avatar => {
    const img = document.createElement("img");
    img.src = `/avatars/${avatar}`;
    img.classList.add("avatar-option", "rounded-circle", "m-2");
    img.style.width = "80px";
    img.onclick = () => seleccionarAvatar(avatar);
    avatarGallery.appendChild(img);
});

// 📌 Función para seleccionar avatar
function seleccionarAvatar(avatar) {
    const user = JSON.parse(localStorage.getItem("user"));

    fetch(`${API_URL}/usuarios/avatar/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert("✅ Avatar actualizado correctamente.");

            // 🔹 Guardamos el avatar en localStorage
            user.avatar = `/avatars/${avatar}`;
            localStorage.setItem("user", JSON.stringify(user));

            // 🔹 Actualizamos la imagen del perfil
            document.getElementById("user-avatar").src = user.avatar;
        }
    })
    .catch(error => console.error("❌ Error actualizando avatar:", error));
}


// Cerrar sesión
function logout() {
    localStorage.clear();
    window.location.href = "index.html";
}

// Agregar evento al botón de cerrar sesión
document.addEventListener("DOMContentLoaded", () => {
    const logoutButton = document.getElementById("logout-btn");
    if (logoutButton) {
        logoutButton.addEventListener("click", logout);
    }
});