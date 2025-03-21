const express = require("express");
const multer = require("multer");
const mysql = require("mysql2");
const path = require("path");
const fs = require("fs");

const router = express.Router();

// 📌 Configuración de almacenamiento con Multer (para archivos, imágenes y videos)
const storage = multer.diskStorage({
    destination: "public/uploads/",
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// 📌 Conexión a la base de datos
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "sa123456/",
    database: "biblioteca_db"
});


// 📌 Subir recurso (archivo, imagen o video)
router.post("/subir", upload.single("archivo"), (req, res) => {
    const { titulo, descripcion, categoria, usuario_id, tipo, video_url } = req.body;
    let archivo_url = req.file ? req.file.filename : null;

    // Si es un video de YouTube, usamos la URL proporcionada
    if (tipo === "video" && video_url) {
        archivo_url = video_url;
    }

    if (!titulo || !descripcion || !categoria || !usuario_id || !archivo_url) {
        return res.status(400).json({ success: false, message: "❌ Todos los campos son obligatorios." });
    }

    db.query(
        "INSERT INTO resources (titulo, descripcion, categoria, archivo_url, usuario_id, tipo) VALUES (?, ?, ?, ?, ?, ?)",
        [titulo, descripcion, categoria, archivo_url, usuario_id, tipo],
        (err, result) => {
            if (err) {
                console.error("❌ Error en la base de datos:", err);
                return res.status(500).json({ success: false, message: "Error en la base de datos" });
            }
            res.status(201).json({ success: true, message: "✅ Recurso subido exitosamente", archivo_url });
        }
    );
});


// 📌 Obtener todos los recursos
router.get("/", (req, res) => {
    db.query("SELECT * FROM resources", (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});


// 📌 Editar información del recurso
router.put("/editar/:id", upload.single("archivo"), (req, res) => {
    const { id } = req.params;
    const { titulo, descripcion, categoria, tipo, video_url } = req.body;
    let nuevoArchivoUrl = req.file ? req.file.filename : null;

    if (!titulo || !descripcion || !categoria) {
        return res.status(400).json({ success: false, message: "❌ Todos los campos son obligatorios." });
    }

    db.query("SELECT archivo_url FROM resources WHERE id = ?", [id], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: "❌ Error en la base de datos." });
        if (results.length === 0) return res.status(404).json({ success: false, message: "❌ Recurso no encontrado." });

        let archivoAnterior = results[0].archivo_url;

        // 📌 Manejo de actualización de archivos
        if (nuevoArchivoUrl && archivoAnterior && tipo !== "video") {
            const filePath = path.join("public/uploads/", archivoAnterior);
            fs.unlink(filePath, err => {
                if (err) console.warn("⚠️ No se pudo eliminar el archivo anterior (posiblemente no existe).");
            });
        } else if (tipo === "video") {
            if (video_url) {
                nuevoArchivoUrl = video_url;
            } else if (nuevoArchivoUrl) {
                nuevoArchivoUrl = nuevoArchivoUrl;
            } else {
                return res.status(400).json({ success: false, message: "❌ Debes subir un archivo de video o ingresar una URL de YouTube." });
            }
        } else {
            nuevoArchivoUrl = archivoAnterior;
        }

        // 📌 Actualizar la base de datos
        db.query(
            "UPDATE resources SET titulo = ?, descripcion = ?, categoria = ?, archivo_url = ?, tipo = ? WHERE id = ?",
            [titulo, descripcion, categoria, nuevoArchivoUrl, tipo, id],
            (err, result) => {
                if (err) return res.status(500).json({ success: false, message: "❌ Error al actualizar el recurso." });
                res.json({ success: true, message: "✅ Recurso actualizado correctamente.", archivo_url: nuevoArchivoUrl });
            }
        );
    });
});



// 📌 Eliminar recurso
router.delete("/:id", (req, res) => {
    const { id } = req.params;

    db.query("SELECT archivo_url, tipo FROM resources WHERE id = ?", [id], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: "❌ Error en la base de datos" });
        if (results.length === 0) return res.status(404).json({ success: false, message: "❌ Recurso no encontrado." });

        const archivo = results[0].archivo_url;
        const tipo = results[0].tipo;

        // 📌 Si no es un video de YouTube, eliminar el archivo físico
        if (tipo !== "video") {
            const filePath = path.join("public/uploads/", archivo);
            fs.unlink(filePath, err => {
                if (err) console.warn("⚠️ No se pudo eliminar el archivo físico.");
            });
        }

        db.query("DELETE FROM resources WHERE id = ?", [id], (err, result) => {
            if (err) throw err;
            res.json({ success: true, message: "✅ Recurso eliminado correctamente." });
        });
    });
});

// 📌 Descargar un recurso
router.get("/download/:filename", (req, res) => {
    const filePath = path.join(__dirname, "../public/uploads", req.params.filename);
    res.download(filePath, err => {
        if (err) {
            res.status(500).json({ message: "❌ Error al descargar el archivo" });
        }
    });
});

// 📌 Ver un recurso
router.get("/view/:id", (req, res) => {
    const { id } = req.params;
    const usuario_id = req.query.usuario_id;

    db.query("SELECT * FROM resources WHERE id = ?", [id], (err, results) => {
        if (err) throw err;
        if (results.length === 0) {
            return res.status(404).json({ message: "❌ Recurso no encontrado" });
        }

        res.json({ message: "✅ Recurso encontrado", recurso: results[0] });
    });
});

// 📌 Ruta para visualizar archivos subidos
router.get("/uploads/:filename", (req, res) => {
    const filePath = path.join(__dirname, "../public/uploads", req.params.filename);
    res.sendFile(filePath);
});



// 📌 Buscar recursos por título o categoría
router.get("/buscar", (req, res) => {
    const { q } = req.query;  // Ahora usamos "q" en lugar de "tipo"
    if (!q) {
        return res.status(400).json({ success: false, message: "❌ Parámetro de búsqueda requerido." });
    }

    db.query(
        "SELECT * FROM resources WHERE titulo LIKE ? OR categoria LIKE ?",
        [`%${q}%`, `%${q}%`], // Permite buscar coincidencias parciales
        (err, results) => {
            if (err) {
                console.error("❌ Error en la búsqueda:", err);
                return res.status(500).json({ success: false, message: "Error en el servidor" });
            }
            res.json(results);
        }
    );
});


module.exports = router;
