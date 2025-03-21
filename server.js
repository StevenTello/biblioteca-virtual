require('dotenv').config(); 
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require("path");
const dns = require("dns");

const app = express();
app.use(express.json());
app.use(cors());

// 📌 Resolver el hostname de MySQL para verificar conexión de red
dns.lookup(process.env.DB_HOST, (err, address, family) => {
    if (err) {
        console.error("❌ No se pudo resolver el host de MySQL:", err);
    } else {
        console.log("✅ Host MySQL resuelto a:", address);
    }
});

// 📌 Crear conexión a MySQL con variables de entorno
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10, // Puedes ajustar según necesidad
    queueLimit: 0,
    ssl: { rejectUnauthorized: false }
});

db.getConnection()
    .then(connection => {
        console.log("📦 Conectado a MySQL en Railway");
        connection.release();
    })
    .catch(error => {
        console.error("❌ Error al conectar a MySQL:", error);
    });

module.exports = db;

// 📌 Ruta principal de prueba
app.get("/", (req, res) => {
    res.send("🚀 API de Biblioteca Virtual funcionando correctamente en Railway");
});

// 📌 Servir archivos estáticos
app.use("/avatars", express.static("public/avatars"));
app.use("/uploads", express.static("public/uploads"));
app.use(express.static("public"));
app.use(express.static(path.join(__dirname, "frontend")));
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// 📌 Importar rutas
const authRoutes = require('./routes/authRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const coursesRoutes = require("./routes/coursesRoutes");
const userRoutes = require("./routes/userRoutes");

app.use('/auth', authRoutes);
app.use('/recursos', resourceRoutes);
app.use("/", coursesRoutes);
app.use("/usuarios", userRoutes);

// 📌 Iniciar servidor en Railway
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`🔥 Servidor corriendo en el puerto ${PORT}`);
});
