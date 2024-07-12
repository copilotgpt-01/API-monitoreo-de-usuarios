const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/verify-token-rol");
const pool = require("../config/db");

// ESTOS endpoints utilizan verifyToken con un argumento de 2, lo cual indica que solo los usuarios con el rol de "organizador" (que se asume tiene el ID 2 en la tabla de roles) pueden realizar consultas a este endpoint. Se asume que el rol con ID 1 corresponde a "cliente". Por lo tanto, esta verificación asegura que únicamente los usuarios con el rol de organizador tengan acceso.

/* Descripción: Permitir a los organizadores ver la lista de usuarios registrados en un evento específico. */
router.get("/:eventId/users", verifyToken(2), async (req, res) => {
  try {
    const { eventId } = req.params;
    // Verificar si el evento existe
    const [eventExists] = await pool.query(
      `
          SELECT nombre FROM Eventos WHERE evento_id = ?
      `,
      [eventId]
    );
    if (eventExists.length === 0) {
      return res
        .status(404)
        .json({ error: "No se encontró el evento con el ID proporcionado" });
    }
    // Si el evento existe, obtener los usuarios inscritos sin incluir el nombre del evento en cada usuario

    const [users] = await pool.query(
      `
          SELECT Usuarios.nombre AS usuarioNombre, Usuarios.email
          FROM Usuarios
          JOIN Asistentes ON Usuarios.usuario_id = Asistentes.usuario_id
          WHERE Asistentes.evento_id = ?
      `,
      [eventId]
    );

    if (users.length > 0) {
      // Incluir el nombre del evento y el total de usuarios solo una vez en la respuesta
      res.json({
        evento: eventExists[0].nombre,
        usuarios: users,
        total: users.length,
      });
    } else {
      res.status(404).json({ error: "No hay usuarios inscritos en el evento" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Error en el servidor");
  }
});

/* Descripción: Permitir a los organizadores modificar el estado de inscripción de un usuario en un evento. */

router.put("/:eventId/users/:userId", verifyToken(2), async (req, res) => {
  try {
    const { eventId, userId } = req.params;
    const { nuevoEstado } = req.body;

    if (!eventId || !userId || !nuevoEstado) {
      return res.status(400).send("Faltan datos");
    }
    // Verificar si el evento existe
    const [eventoExiste] = await pool.query(
      "SELECT 1 FROM Eventos WHERE evento_id = ?",
      [eventId]
    );
    if (eventoExiste.length === 0) {
      return res.status(404).json({ error: "Evento no encontrado." });
    }

    const [usuarioExiste] = await pool.query(
      "SELECT 1 FROM Usuarios WHERE usuario_id = ?",
      [userId]
    );

    if (usuarioExiste.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado." });
    }

    // Actualizar el estado de inscripción
    const [result] = await pool.query(
      `
          UPDATE Asistentes
          SET estado_inscripcion = ?
          WHERE evento_id = ? AND usuario_id = ?
        `,
      [nuevoEstado, eventId, userId]
    );
    if (result.affectedRows === 0) {
      throw new Error("NoRowsAffected");
    }
    res.json({
      mensaje: "El estado de inscripción ha sido actualizado.",
    });
  } catch (error) {
    if (error.message === "NoRowsAffected") {
      res.status(404).json({ error: "No se encontró el usuario en el evento" });
    } else {
      console.error(error);
      res.status(500).send("Error en el servidor");
    }
  }
});

module.exports = router;
