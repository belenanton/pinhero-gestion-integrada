const bcrypt = require('bcrypt');
const pool = require('./src/db');

(async () => {
  try {
    const password = 'admin1234'; // Cambia esta contraseña antes de usar en producción
    const passwordHash = await bcrypt.hash(password, 10);

    await pool.query(
      `INSERT INTO usuarios (email, password_hash, rol)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO NOTHING`,
      ['admin@pinhero.com', passwordHash, 'admin']
    );

    console.log('Usuario admin@pinhero.com creado o ya existente.');
    process.exit(0);
  } catch (error) {
    console.error('Error creando admin:', error);
    process.exit(1);
  }
})();
