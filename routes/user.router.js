const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const pool = require("../config/db");
const ENV = require("../config/config");

const { comparePasswords } = require("../middlewares/bcryptPassword");

/* ESTE ES UN LOGIN DE PRUEBA PARA LOS TOKENS */

router.post("/login", async (req, res) => {
  const { email, contrasena } = req.body;
  if (!email || !contrasena) {
    return res.status(400).send("Email y contraseña son requeridos");
  }
  try {
    const [users] = await pool.query("SELECT * FROM Usuarios WHERE email = ?", [
      email,
    ]);
    if (users.length === 0) {
      return res.status(401).send("Usuario no encontrado");
    }
    const user = users[0];
    const hashedPassword = user.contrasena;
    if (comparePasswords(contrasena, hashedPassword)) {
      const token = jwt.sign(
        { id: user.usuario_id, role: user.rol_id },
        ENV.jwtSecret,
        {
          expiresIn: "1h",
        }
      );
      res.json({ token });
    } else {
      res.status(401).send("Contraseña incorrecta");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Error en el servidor");
  }
});

module.exports = router;
