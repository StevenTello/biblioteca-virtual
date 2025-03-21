require('dotenv').config(); 
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require("path");

const app = express();
app.use(express.json());
app.use(cors());

// Crear conexión a MySQL con variables de entorno
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10000,
    queueLimit: 0,
    ssl: { rejectUnauthorized: true } // Agrega SSL si es requerido por Railway
});

module.exports = db;

// 📌 Verificar la conexión a MySQL
async function checkDBConnection() {
    try {
        const connection = await db.getConnection();
        console.log("📦 Conectado a MySQL");
        connection.release(); // Liberar conexión al pool
    } catch (error) {
        console.error("❌ Error al conectar a MySQL:", error);
    }
}
checkDBConnection(); // Llamar a la función para verificar la conexión

// Ruta para archivos estáticos (imagenes de perfil)
app.use("/avatars", express.static("public/avatars"));

//Ruta para archivos estaticos (contenido)
app.use("/uploads", express.static("public/uploads"));

// 📌 Servir archivos estáticos
app.use(express.static("public")); // Sirve la carpeta "public"
app.use(express.static(path.join(__dirname, "frontend")));
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));


// 📌 Importar rutas (asegúrate de que los archivos están en CommonJS)
const authRoutes = require('./routes/authRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const coursesRoutes = require("./routes/coursesRoutes");
const userRoutes = require("./routes/userRoutes");


app.use('/auth', authRoutes);
app.use('/recursos', resourceRoutes);
app.use("/", coursesRoutes);
app.use("/usuarios", userRoutes);

// 📌 Iniciar servidor
app.listen(3000, () => {
    console.log("🔥 Servidor corriendo en http://localhost:3000");
});
