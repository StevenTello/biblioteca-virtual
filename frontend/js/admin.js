import API_URL from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || user.rol !== "admin") {
        alert("⚠️ No tienes permisos para acceder.");
        window.location.href = "login.html";
        return;
    }

    // Cargar cursos y mostrarlos en tarjetas
    fetch(`${API_URL}/cursos`)
        .then(response => response.json())
        .then(courses => {
            const container = document.getElementById("courses-container");
            container.innerHTML = "";

            courses.forEach((course, index) => {
                const cardDiv = document.createElement("div");
                cardDiv.classList.add("col-md-4", "d-flex");

                cardDiv.innerHTML = `
                    <div class='card flex-fill shadow'>
                        <div class='card-body text-center'>
                            <h5 class='card-title'>${course.titulo}</h5>
                            <p class='card-text'>${course.descripcion}</p>
                            <button class='btn btn-primary' onclick="abrirCurso(${course.id})">Abrir</button>
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
        })
        .catch(error => console.error("❌ Error cargando cursos:", error));
});


// 📌 Función para abrir un curso desde el panel de administración
function abrirCurso(cursoId) {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user) {
        alert("⚠️ Debes iniciar sesión primero.");
        window.location.href = "login.html";
        return;
    }

    // 📌 Todos los usuarios, incluyendo admin, deben ir a curso.html
    window.location.href = `curso.html?id=${cursoId}`;
}




// Función para cerrar sesión
function logout() {
    localStorage.clear();
    window.location.href = "login.html";
}

document.getElementById("logout-btn").addEventListener("click", logout);
