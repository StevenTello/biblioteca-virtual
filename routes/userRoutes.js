const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const mysql = require('mysql2/promise');
const db = require('../server'); // 🔥 Importar conexión global


router.stack.forEach(layer => {
    if (layer.route) {
        console.log(`✅ ${layer.route.path}`);
    }
});

// Configuración de almacenamiento de imágenes
const storage = multer.diskStorage({
    destination: "public/uploads/",
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

//Usar avatares
router.put("/avatar/:id", async (req, res) => {
    const { id } = req.params;
    const { avatar } = req.body; // Recibe el nombre del avatar elegido

    try {
        await db.execute("UPDATE users SET avatar = ? WHERE id = ?", [avatar, id]);
        res.json({ success: true, message: "Avatar actualizado correctamente", avatarUrl: `/avatars/${avatar}` });
    } catch (error) {
        console.error("❌ Error actualizando avatar:", error);
        res.status(500).json({ success: false, message: "Error en el servidor" });
    }
});

//Llamar usuarios
router.get("/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.execute(
            "SELECT id, nombre, email, rol, avatar FROM users WHERE id = ?", 
            [id]
        );
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Usuario no encontrado" });
        }
        res.json(rows[0]);
    } 
    catch (error) {
        console.error("❌ Error obteniendo usuario:", error);
        res.status(500).json({ success: false, message: "Error en el servidor" });
    }
});


// Ruta para actualizar perfil
router.put("/:id", upload.single("avatar"), async (req, res) => {
    const { id } = req.params;
    const { nombre } = req.body;
    const avatar = req.file ? req.file.filename : null; // Guardar solo si hay una imagen

    try {
        const query = avatar
            ? "UPDATE users SET nombre = ?, avatar = ? WHERE id = ?"
            : "UPDATE users SET nombre = ? WHERE id = ?";

        const params = avatar ? [nombre, avatar, id] : [nombre, id];

        await db.query(query, params);

        res.json({ success: true, message: "Perfil actualizado correctamente", avatarUrl: avatar });
    } catch (error) {
        console.error("❌ Error actualizando usuario:", error);
        res.status(500).json({ success: false, message: "Error en el servidor" });
    }
});


//Cambiar de contraseña
const bcrypt = require("bcrypt");

// 📌 Cambiar Contraseña con verificación segura
router.put("/password/:id", async (req, res) => {
    const { id } = req.params;
    const { actual, nueva } = req.body;

    try {
        // 📌 Obtener la contraseña actual del usuario
        const [rows] = await db.query("SELECT password FROM users WHERE id = ?", [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: "Usuario no encontrado" });
        }

        const contraseñaAlmacenada = rows[0].password;

        // 📌 Comparar la contraseña ingresada con la almacenada usando bcrypt
        const contraseñaValida = await bcrypt.compare(actual, contraseñaAlmacenada);
        
        if (!contraseñaValida) {
            return res.status(400).json({ success: false, message: "❌ Contraseña actual incorrecta." });
        }

        // 📌 Hashear la nueva contraseña antes de guardarla
        const nuevaContraseñaHash = await bcrypt.hash(nueva, 10);

        // 📌 Actualizar la contraseña en la base de datos
        await db.query("UPDATE users SET password = ? WHERE id = ?", [nuevaContraseñaHash, id]);

        res.json({ success: true, message: "✅ Contraseña actualizada correctamente." });
    } catch (error) {
        console.error("❌ Error actualizando contraseña:", error);
        res.status(500).json({ success: false, message: "Error en el servidor" });
    }
});


// 📌 Ruta para que el administrador cambie la contraseña de cualquier usuario
router.put("/password/admin/:id", async (req, res) => {
    const { id } = req.params;
    const { nueva } = req.body;

    try {
        if (!nueva) {
            return res.status(400).json({ success: false, message: "❌ Debes ingresar una nueva contraseña." });
        }

        // 📌 Hashear la nueva contraseña antes de guardarla
        const nuevaContraseñaHash = await bcrypt.hash(nueva, 10);

        // 📌 Actualizar la contraseña en la base de datos
        await db.query("UPDATE users SET password = ? WHERE id = ?", [nuevaContraseñaHash, id]);

        res.json({ success: true, message: "✅ Contraseña actualizada correctamente." });
    } catch (error) {
        console.error("❌ Error actualizando contraseña:", error);
        res.status(500).json({ success: false, message: "Error en el servidor" });
    }
});


// 📌 Ruta para obtener todos los usuarios
router.get("/", async (req, res) => {
    try {
        const [rows] = await db.query("SELECT id, nombre, email, rol FROM users");
        res.json(rows);
    } catch (error) {
        console.error("❌ Error obteniendo usuarios:", error);
        res.status(500).json({ success: false, message: "Error en el servidor" });
    }
});

// 📌 Ruta para eliminar un usuario por ID
router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query("DELETE FROM users WHERE id = ?", [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Usuario no encontrado" });
        }
        res.json({ success: true, message: "✅ Usuario eliminado correctamente." });
    } catch (error) {
        console.error("❌ Error eliminando usuario:", error);
        res.status(500).json({ success: false, message: "Error en el servidor" });
    }
});

module.exports = router;
