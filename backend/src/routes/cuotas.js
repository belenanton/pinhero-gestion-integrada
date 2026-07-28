const express = require('express');
const router = express.Router();
const pool = require('../db');

router.put('/:id/pagar', async (req, res, next) => {
  try {
    const { id } = req.params;
    const cuotaRes = await pool.query('SELECT * FROM cuotas WHERE id = $1', [id]);
    if (cuotaRes.rowCount === 0) {
      return res.status(404).json({ error: 'Cuota no encontrada' });
    }

    const cuota = cuotaRes.rows[0];
    // La cuota solo puede pasar a pagada una vez para evitar registrar el mismo pago más de una vez.
    if (cuota.estado === 'pagada') {
      return res.status(400).json({ error: 'La cuota ya está pagada' });
    }

    const result = await pool.query(`
      UPDATE cuotas
      SET estado = 'pagada', fecha_pago = CURRENT_DATE
      WHERE id = $1
      RETURNING *
    `, [id]);

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
