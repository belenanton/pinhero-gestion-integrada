const express = require('express');
const cors = require('cors');
const pool = require('./db');
const { verificarToken } = require('./middleware/auth');

const app = express();
const port = process.env.PORT || 4000;

// Las rutas de negocio requieren autenticación para evitar exponer operaciones sensibles sin validación previa.
app.use(cors());
app.use(express.json());
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/lotes', verificarToken, require('./routes/lotes'));
app.use('/api/cuotas', verificarToken, require('./routes/cuotas'));
app.use('/api/maquinas', verificarToken, require('./routes/maquinas'));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Error interno del servidor' });
});

const start = async () => {
  try {
    const client = await pool.connect();
    client.release();
    app.listen(port, () => console.log(`Backend running on port ${port}`));
  } catch (error) {
    console.error('Database connection failed', error);
    process.exit(1);
  }
};

start();

module.exports = { app, pool };