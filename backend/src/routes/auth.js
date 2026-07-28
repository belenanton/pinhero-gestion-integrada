const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const router = express.Router();

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Faltan credenciales' });
    }

    const result = await pool.query('SELECT id, email, password_hash, rol FROM usuarios WHERE email = $1', [email]);
    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // El token incluye el identificador y el rol del usuario para que las rutas protegidas puedan autorizar acciones sin consultar la base de datos en cada request.
    const payload = { id: user.id, email: user.email, rol: user.rol };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });

    res.json({ token, usuario: { id: user.id, email: user.email, rol: user.rol } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
