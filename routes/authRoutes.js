const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');

const router = express.Router();

// Conexión a la base de datos con Promises
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'sa123456/',
    database: 'biblioteca_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 🔹 Registro de usuario
router.post('/register', async (req, res) => {
    const { nombre, email, password, rol } = req.body;

    if (!nombre || !email || !password) {
        return res.status(400).json({ message: "❌ Todos los campos son obligatorios." });
    }

    const validRoles = ['usuario', 'admin'];
    if (!validRoles.includes(rol)) {
        return res.status(400).json({ message: "❌ Rol inválido. Debe ser 'usuario' o 'admin'." });
    }

    try {
        // Verificar si el usuario ya existe (email o nombre duplicado)
        const [existingUsers] = await db.query(
            "SELECT id FROM users WHERE nombre = ? OR email = ?",
            [nombre, email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ message: "❌ El email ya están en uso." });
        }

        // Encriptar contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insertar el nuevo usuario
        await db.query(
            "INSERT INTO users (nombre, email, password, rol) VALUES (?, ?, ?, ?)",
            [nombre, email, hashedPassword, rol]
        );

        console.log(`✅ Usuario ${rol} registrado exitosamente`);
        res.status(201).json({ message: `✅ Usuario ${rol} registrado exitosamente` });

    } catch (error) {
        console.error("❌ Error en el registro:", error);
        res.status(500).json({ message: "❌ Error en el servidor" });
    }
});

// 🔹 Login de usuario (con JWT y verificación de contraseña)
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Verificar si el usuario existe
        const [result] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

        if (result.length === 0) {
            return res.status(400).json({ message: "❌ Usuario no encontrado" });
        }

        const user = result[0];

        // Comparar contraseña
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "❌ Contraseña incorrecta" });
        }

        // Generar token JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, rol: user.rol },
            'secreto123',
            { expiresIn: '1h' }
        );

        res.json({
            message: "✅ Login exitoso",
            token,
            user: {
                id: user.id,
                nombre: user.nombre,
                email: user.email,
                rol: user.rol,
            }
        });

    } catch (error) {
        console.error("❌ Error en el login:", error);
        res.status(500).json({ message: "❌ Error en el servidor" });
    }
});

module.exports = router;
