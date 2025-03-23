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

    // Cargar cursos al cargar la página
    fetchCursos();
});



// 📌 Cargar cursos
async function fetchCursos() {
    console.log("🔄 Cargando cursos...");
    
    try {
        const response = await fetch(`${API_URL}/cursos`);
        const courses = await response.json();

        console.log("📚 Cursos obtenidos:", courses);

        const tableBody = document.getElementById("courses-list");
        tableBody.innerHTML = "";

        courses.forEach(course => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${course.titulo}</td>
                <td>${course.descripcion}</td>
                <td>
                    <button class="btn btn-warning btn-sm" onclick="llenarFormulario(${course.id}, '${course.titulo}', '${course.descripcion}')">✎ Editar</button>
                    <button class="btn btn-warning btn-sm border-0" style="background-color:rgb(46, 139, 245);" onclick="administrarCurso(${course.id})">📂 Administrar</button>
                    <button class="btn btn-warning btn-sm border-0" style="background-color:rgb(245, 38, 38);" onclick="eliminarCurso(${course.id})">✖ Eliminar</button>
                </td>
            `;
            tableBody.appendChild(row);
        });

        console.log("✅ Cursos cargados correctamente.");

    } catch (error) {
        console.error("❌ Error cargando cursos:", error);
    }
}


// 📂 Redirigir a la administración del curso
function administrarCurso(id) {
    window.location.href = `administrar-curso.html?id=${id}`;
}

// 📌 Llenar formulario al editar
function llenarFormulario(id, titulo, descripcion) {
    document.getElementById("course-id").value = id; // Colocar ID en el campo oculto
    document.getElementById("course-title").value = titulo;
    document.getElementById("course-description").value = descripcion;
}

// 📌 Guardar curso (Crear o Editar) y actualizar lista automáticamente
async function guardarCurso() {
    const id = document.getElementById("course-id").value;
    const titulo = document.getElementById("course-title").value.trim();
    const descripcion = document.getElementById("course-description").value.trim();

    if (!titulo || !descripcion) {
        alert("❌ Todos los campos son obligatorios");
        return;
    }

    const datos = { titulo, descripcion };
    const metodo = id ? "PUT" : "POST";
    const url = id ? `${API_URL}/cursos/${id}` : `${API_URL}/cursos`;

    try {
        const response = await fetch(url, {
            method: metodo,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datos)
        });

        const data = await response.json();

        if (!response.ok) {
            alert("❌ " + data.message); // 📌 Muestra mensaje de error si el curso ya existe
            return;
        }

        alert(data.message);

        // 📌 Limpiar formulario después de guardar
        document.getElementById("course-title").value = "";
        document.getElementById("course-description").value = "";
        document.getElementById("course-id").value = "";

        console.log("🔄 Ejecutando fetchCursos() después de guardar curso...");
        fetchCursos(); // 🔄 Recargar lista de cursos sin recargar la página
    } catch (error) {
        console.error("❌ Error guardando curso:", error);
    }
}


// 📌 Eliminar curso y actualizar lista automáticamente
async function eliminarCurso(id) {
    if (!confirm("¿Estás seguro de eliminar este curso?")) return;

    try {
        const response = await fetch(`${API_URL}/cursos/${id}`, { method: "DELETE" });
        const data = await response.json();
        alert(data.message);

        fetchCursos(); // 🔄 Recargar lista de cursos sin recargar la página
    } catch (error) {
        console.error("❌ Error eliminando curso:", error);
    }
}

async function logout() {
    try {
        await fetch(`${API_URL}/auth/logout`, { method: "POST" });
    } catch (error) {
        console.error("Error cerrando sesión:", error);
    }
    localStorage.clear();
    window.location.href = "index.html";
}

//
// 🔓 EXPONER FUNCIONES AL SCOPE GLOBAL
//
window.guardarCurso = guardarCurso;
window.eliminarCurso = eliminarCurso;
window.llenarFormulario = llenarFormulario;
window.administrarCurso = administrarCurso;
window.logout = logout;