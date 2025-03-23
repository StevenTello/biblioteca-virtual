import API_URL from "./config.js";

document.addEventListener("DOMContentLoaded", async () => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user || !user.id) {
        alert("⚠️ Debes iniciar sesión primero");
        window.location.href = "index.html";
        return;
    }

    // ✅ Corregir asignación del nombre
    document.getElementById("user-name").textContent = user.nombre || "Usuario";

    // ✅ Redirigir a admin si es administrador
    if (user.rol === "admin") {
        window.location.href = "admin.html";
        return;
    } else {
        document.querySelector(".admin-only")?.classList.add("d-none");
    }
    
    try {
        // ✅ Obtener cursos disponibles
        const response = await fetch(`${API_URL}/cursos`);
        if (!response.ok) throw new Error("Error al obtener cursos");

        const courses = await response.json();
        console.log("📚 Cursos obtenidos:", courses);

        const container = document.getElementById("courses-container");
        container.innerHTML = "";

        // ✅ Obtener los cursos a los que está suscrito el usuario
        const resUserCourses = await fetch(`${API_URL}/mis-cursos/${user.id}`);
        if (!resUserCourses.ok) throw new Error("Error al obtener cursos del usuario");

        const userCourses = await resUserCourses.json();
        const subscribedCourses = new Set(userCourses.map(c => c.id)); // Convertir a Set para búsqueda rápida

        courses.forEach((course, index) => {
            const cardDiv = document.createElement("div");
            cardDiv.classList.add("col-md-4", "d-flex");

            const isSubscribed = subscribedCourses.has(course.id);
            const buttonHTML = isSubscribed
                ? `<button class='btn btn-success' onclick="verCurso(${course.id})">Acceder</button>`
                : `<button class='btn btn-primary' onclick="suscribirse(${course.id})">Suscribirse</button>`;

            cardDiv.innerHTML = `
                <div class='card flex-fill'>
                    <div class='card-body text-center'>
                        <h5 class='card-title'>${course.titulo}</h5>
                        <p class='card-text'>${course.descripcion}</p>
                        ${buttonHTML}
                    </div>
                </div>
            `;
            container.appendChild(cardDiv);

            // ✅ Agregar un salto de línea después de cada 3 tarjetas
            if ((index + 1) % 3 === 0) {
                const breakDiv = document.createElement("div");
                breakDiv.classList.add("w-100", "my-3");
                container.appendChild(breakDiv);
            }
        });

    } catch (error) {
        console.error("❌ Error cargando cursos:", error);
    }
});


// ✅ Función para suscribirse a un curso
function suscribirse(cursoId) {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return;

    fetch(`${API_URL}/cursos/suscribirse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario_id: user.id, curso_id: cursoId })
    })
    .then(res => res.json())
    .then(data => {
        alert(data.message);
        location.reload(); // Recargar para actualizar estado de suscripción
    })
    .catch(error => console.error("❌ Error al suscribirse:", error));
}

// ✅ Función para ver el curso si ya está suscrito
function verCurso(id) {
    window.location.href = `curso.html?id=${id}`;
}

// ✅ Cerrar sesión
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
window.suscribirse = suscribirse;
window.verCurso = verCurso;
window.logout = logout;
