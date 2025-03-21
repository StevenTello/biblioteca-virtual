const express = require('express');
const mysql = require('mysql2/promise');
const path = require("path");
const multer = require("multer");
const router = express.Router();

const storage = multer.diskStorage({
    destination: "public/uploads/",
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + "-" + file.originalname);
    },
});

const upload = multer({ storage: storage });

// 📌 Conexión a la base de datos
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'sa123456/',
    database: 'biblioteca_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

//Crud

// ✅ Obtener todos los cursos disponibles
router.get('/cursos', async (req, res) => {
    try {
        const [results] = await db.query('SELECT * FROM cursos');
        res.json(results);
    } catch (err) {
        console.error("❌ Error al obtener los cursos:", err);
        res.status(500).json({ message: "Error en el servidor" });
    }
});


// 🔹 Obtener los cursos a los que un usuario está suscrito
router.get('/mis-cursos/:userId', async (req, res) => {
    const userId = req.params.userId;
    const query = `
        SELECT c.* FROM cursos c
        JOIN inscripciones i ON c.id = i.curso_id
        WHERE i.usuario_id = ?`;

    try {
        const [results] = await db.query(query, [userId]);
        res.json(results);
    } catch (err) {
        console.error("❌ Error al obtener los cursos del usuario:", err);
        res.status(500).json({ message: "Error en el servidor" });
    }
});


// 📌 Agregar un nuevo curso (Verificando duplicados)
router.post('/cursos', async (req, res) => {
    const { titulo, descripcion } = req.body;

    if (!titulo || !descripcion) {
        return res.status(400).json({ message: "❌ Todos los campos son obligatorios." });
    }

    try {
        console.log("📌 Verificando si el curso ya existe:", titulo);

        // 📌 Verificar si el curso ya existe
        const [existingCourse] = await db.query('SELECT id FROM cursos WHERE titulo = ?', [titulo]);

        if (existingCourse.length > 0) {
            return res.status(400).json({ message: "❌ Ya existe un curso con este título. Por favor, elige otro." });
        }

        // 📌 Insertar solo si no existe
        await db.query('INSERT INTO cursos (titulo, descripcion) VALUES (?, ?)', [titulo, descripcion]);

        // 🔄 Devolver la lista actualizada de cursos después de agregar
        const [cursos] = await db.query('SELECT * FROM cursos');
        
        console.log("✅ Curso agregado y lista de cursos actualizada.");
        res.status(201).json({ message: "✅ Curso agregado exitosamente.", cursos });

    } catch (error) {
        console.error("❌ Error al agregar curso:", error);
        res.status(500).json({ message: "Error en el servidor" });
    }
});

// 📌 Modificar un curso existente (evitando duplicados)
router.put('/cursos/:id', async (req, res) => {
    const { titulo, descripcion } = req.body;
    const id = req.params.id;

    if (!titulo || !descripcion) {
        return res.status(400).json({ message: "❌ Todos los campos son obligatorios." });
    }

    try {
        console.log("📌 Verificando si otro curso ya tiene este título:", titulo);

        // 📌 Verificar si ya existe un curso con el mismo título (excluyendo el actual)
        const [existingCourse] = await db.query(
            'SELECT id FROM cursos WHERE titulo = ? AND id != ?',
            [titulo, id]
        );

        if (existingCourse.length > 0) {
            return res.status(400).json({ message: "❌ Ya existe otro curso con este título. Por favor, elige otro." });
        }

        // 📌 Actualizar el curso si el título no está en uso
        const [result] = await db.query(
            'UPDATE cursos SET titulo = ?, descripcion = ? WHERE id = ?',
            [titulo, descripcion, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "❌ Curso no encontrado." });
        }

        res.json({ message: "✅ Curso actualizado correctamente." });

    } catch (err) {
        console.error("❌ Error al editar curso:", err);
        res.status(500).json({ message: "Error en el servidor" });
    }
});



// 📌 Eliminar un curso por ID
router.delete('/cursos/:id', async (req, res) => {
    const cursoId = req.params.id;

    try {
        const [result] = await db.query('DELETE FROM cursos WHERE id = ?', [cursoId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "❌ Curso no encontrado." });
        }

        res.json({ message: "✅ Curso eliminado correctamente" });

    } catch (err) {
        console.error("❌ Error al eliminar curso:", err);
        res.status(500).json({ message: "❌ Error en el servidor" });
    }
});



// 🔹 Suscribir a un usuario a un curso con MySQL Promise
router.post('/cursos/suscribirse', async (req, res) => {
    const { usuario_id, curso_id } = req.body;

    if (!usuario_id || !curso_id) {
        return res.status(400).json({ message: "❌ Datos incompletos. Se requiere usuario_id y curso_id" });
    }

    try {
        console.log(`🔍 Intentando suscribir usuario_id=${usuario_id} al curso_id=${curso_id}`);

        // 📌 Verificar si el usuario ya está suscrito al curso
        const [results] = await db.query(
            'SELECT * FROM inscripciones WHERE usuario_id = ? AND curso_id = ?',
            [usuario_id, curso_id]
        );

        if (results.length > 0) {
            console.log(`⚠️ El usuario_id=${usuario_id} ya está suscrito al curso_id=${curso_id}.`);
            return res.status(400).json({ message: "⚠️ Ya estás suscrito a este curso" });
        }

        // 📌 Insertar la inscripción si no existe
        await db.query(
            'INSERT INTO inscripciones (usuario_id, curso_id) VALUES (?, ?)',
            [usuario_id, curso_id]
        );

        console.log(`✅ Suscripción exitosa: usuario_id=${usuario_id}, curso_id=${curso_id}`);
        res.status(201).json({ message: "✅ Suscripción exitosa" });

    } catch (error) {
        console.error("❌ Error al suscribirse al curso:", error);
        res.status(500).json({ message: "❌ Error en el servidor" });
    }
});



// 📌 Obtener información de un curso por ID
router.get("/cursos/:id", async (req, res) => {
    console.log("Solicitud recibida para curso ID:", req.params.id);
    const { id } = req.params;
    try {
        const [curso] = await db.query("SELECT * FROM cursos WHERE id = ?", [id]);
        if (curso.length === 0) {
            return res.status(404).json({ message: "Curso no encontrado" });
        }
        res.json(curso[0]);
    } catch (error) {
        console.error("Error al obtener curso:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
});

// 📌 Obtener módulos de un curso
router.get("/cursos/:cursoId/modulos", async (req, res) => {
    const { cursoId } = req.params;
    try {
        const [modulos] = await db.execute("SELECT * FROM modulos_curso WHERE curso_id = ? ORDER BY orden ASC", [cursoId]);
        res.json(modulos);
    } catch (error) {
        console.error("Error al obtener módulos:", error);
        res.status(500).json({ message: "Error en la base de datos" });
    }
});

// 📌 Obtener información de un módulo por ID
router.get("/modulos/:moduloId", async (req, res) => {
    const { moduloId } = req.params;
    
    try {
        const [modulo] = await db.query("SELECT * FROM modulos_curso WHERE id = ?", [moduloId]);

        if (modulo.length === 0) {
            return res.status(404).json({ message: "Módulo no encontrado" });
        }

        res.json(modulo[0]);
    } catch (error) {
        console.error("❌ Error al obtener módulo:", error);
        res.status(500).json({ message: "Error en la base de datos" });
    }
});

// 📌 Agregar módulo a un curso (evitar duplicados)
router.post("/cursos/:cursoId/modulos/agregar", async (req, res) => {
    const { cursoId } = req.params;
    const { titulo, descripcion, orden } = req.body;

    if (!titulo || !descripcion || orden === undefined) {
        return res.status(400).json({ success: false, message: "❌ Todos los campos son obligatorios." });
    }

    try {
        console.log("📌 Verificando si ya existe un módulo con este título en el curso", cursoId);

        // 📌 Verificar si ya existe un módulo con el mismo título en el mismo curso
        const [existingModule] = await db.query(
            "SELECT id FROM modulos_curso WHERE curso_id = ? AND titulo = ?",
            [cursoId, titulo]
        );

        if (existingModule.length > 0) {
            return res.status(400).json({ success: false, message: "❌ Ya existe un módulo con este título en el curso." });
        }

        // 📌 Insertar el módulo solo si no existe un duplicado
        await db.query(
            "INSERT INTO modulos_curso (curso_id, titulo, descripcion, orden) VALUES (?, ?, ?, ?)",
            [cursoId, titulo, descripcion, orden]
        );

        res.status(201).json({ success: true, message: "✅ Módulo agregado correctamente." });

    } catch (error) {
        console.error("❌ Error en la base de datos:", error);
        res.status(500).json({ success: false, message: "Error en la base de datos" });
    }
});


// 📌 Obtener contenido de un módulo
router.get("/modulos/:moduloId/contenido", async (req, res) => {
    const { moduloId } = req.params;
    
    try {
        const [contenido] = await db.query("SELECT * FROM contenido_curso WHERE modulo_id = ?", [moduloId]);
        res.json(contenido);
    } catch (error) {
        console.error("❌ Error al obtener contenido:", error);
        res.status(500).json({ message: "Error en la base de datos" });
    }
});


// 📌 Agregar contenido a un módulo (Solo permite archivos PDF en la categoría "archivo" y "actividad") Sin duplicados
// 📌 Agregar contenido a un módulo (Evitar duplicados)
router.post("/modulos/:moduloId/contenido/agregar", upload.single("archivo"), async (req, res) => {
    const { moduloId } = req.params;
    const { tipo, titulo, descripcion, archivo_url } = req.body;
    let filePath = archivo_url; // Mantener URL si es un enlace externo

    // ✅ Si se sube un archivo, verificar la extensión
    if (req.file) {
        const fileExtension = req.file.mimetype.split("/")[1].toLowerCase();
        if ((tipo === "archivo" || tipo === "actividad") && fileExtension !== "pdf") {
            return res.status(400).json({ success: false, message: "⚠️ Solo se permiten archivos PDF en esta categoría." });
        }
        filePath = `/uploads/${req.file.filename}`;
    }

    // ✅ Validaciones
    const tiposValidos = ["archivo", "video", "imagen", "actividad", "juego", "test"];
    if (!tiposValidos.includes(tipo)) {
        return res.status(400).json({ success: false, message: "❌ Tipo de contenido inválido." });
    }

    if (!tipo || !titulo || !descripcion) {
        return res.status(400).json({ success: false, message: "❌ Todos los campos son obligatorios." });
    }

    try {
        // 📌 Verificar si ya existe un contenido con el mismo título en el módulo
        const [existingContent] = await db.query(
            "SELECT id FROM contenido_curso WHERE modulo_id = ? AND titulo = ?",
            [moduloId, titulo]
        );

        if (existingContent.length > 0) {
            return res.status(400).json({ success: false, message: "❌ Ya existe un contenido con este título en el módulo." });
        }

        // 📌 Insertar contenido si no hay duplicados
        await db.query(
            "INSERT INTO contenido_curso (modulo_id, tipo, titulo, descripcion, archivo_url, orden) VALUES (?, ?, ?, ?, ?, ?)",
            [moduloId, tipo, titulo, descripcion, filePath, 1]
        );

        res.status(201).json({ success: true, message: "✅ Contenido agregado correctamente." });

    } catch (error) {
        console.error("❌ Error en la base de datos:", error);
        res.status(500).json({ success: false, message: "❌ Error en la base de datos." });
    }
});


// 📌 Editar contenido de un módulo (Solo permite archivos PDF en "archivo" y "actividad")
router.put("/contenido/:contenidoId", upload.single("archivo"), async (req, res) => {
    const { contenidoId } = req.params;
    const { titulo, tipo, descripcion, archivo_url } = req.body;
    let filePath = archivo_url; // Mantener el archivo actual si no se sube uno nuevo

    // ✅ Verificar tipo y extensión de archivo
    if (req.file) {
        const fileExtension = req.file.mimetype.split("/")[1].toLowerCase();
        if ((tipo === "archivo" || tipo === "actividad") && fileExtension !== "pdf") {
            return res.status(400).json({ success: false, message: "⚠️ Solo se permiten archivos PDF en esta categoría." });
        }
        filePath = `/uploads/${req.file.filename}`;
    }

    if (!titulo || !tipo || !descripcion) {
        return res.status(400).json({ success: false, message: "❌ Todos los campos son obligatorios." });
    }

    try {
        // 📌 Verificar si el nuevo título ya existe en otro contenido del mismo módulo
        const [existingContent] = await db.query(
            "SELECT id FROM contenido_curso WHERE titulo = ? AND id != ?",
            [titulo, contenidoId]
        );

        if (existingContent.length > 0) {
            return res.status(400).json({ success: false, message: "❌ Ya existe otro contenido con este título." });
        }

        // 📌 Actualizar contenido si no hay duplicados
        await db.query(
            "UPDATE contenido_curso SET titulo = ?, tipo = ?, descripcion = ?, archivo_url = ? WHERE id = ?",
            [titulo, tipo, descripcion, filePath, contenidoId]
        );

        res.json({ success: true, message: "✅ Contenido actualizado correctamente." });

    } catch (error) {
        console.error("❌ Error en la base de datos:", error);
        res.status(500).json({ success: false, message: "❌ Error en la base de datos." });
    }
});



// 📌 Eliminar un módulo
router.delete("/modulos/:moduloId", async (req, res) => {
    const { moduloId } = req.params;

    try {
        const [result] = await db.query("DELETE FROM modulos_curso WHERE id = ?", [moduloId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "⚠️ Módulo no encontrado o ya eliminado." });
        }

        console.log(`✅ Módulo con ID ${moduloId} eliminado correctamente.`);
        res.json({ success: true, message: "✅ Módulo eliminado correctamente." });

    } catch (error) {
        console.error("❌ Error en la base de datos:", error);
        res.status(500).json({ success: false, message: "❌ Error en la base de datos." });
    }
});





// 📌 Eliminar contenido de un módulo
router.delete("/contenido/:contenidoId", async (req, res) => {
    const { contenidoId } = req.params;

    try {
        await db.query("DELETE FROM contenido_curso WHERE id = ?", [contenidoId]);
        res.json({ success: true, message: "Contenido eliminado correctamente." });
    } catch (error) {
        console.error("Error en la base de datos:", error);
        res.status(500).json({ success: false, message: "Error en la base de datos" });
    }
});



module.exports = router;
