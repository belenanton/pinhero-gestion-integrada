const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res, next) => {
  try {
    // Se usa un LATERAL JOIN para traer la última ubicación de cada máquina sin perder la información base de la máquina.
    const result = await pool.query(`
      SELECT m.*, u.latitud, u.longitud, u.direccion_referencia, u.motivo, u.fecha_movimiento
      FROM maquinas m
      LEFT JOIN LATERAL (
        SELECT * FROM ubicaciones_maquina
        WHERE maquina_id = m.id
        ORDER BY fecha_movimiento DESC
        LIMIT 1
      ) u ON true
      ORDER BY m.id
    `);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const maquinaRes = await pool.query('SELECT * FROM maquinas WHERE id = $1', [req.params.id]);
    if (maquinaRes.rowCount === 0) {
      return res.status(404).json({ error: 'Máquina no encontrada' });
    }

    const historialRes = await pool.query(`
      SELECT * FROM ubicaciones_maquina
      WHERE maquina_id = $1
      ORDER BY fecha_movimiento DESC
    `, [req.params.id]);

    res.json({ maquina: maquinaRes.rows[0], historial: historialRes.rows });
  } catch (error) {
    next(error);
  }
});

router.put('/:id/estado', async (req, res, next) => {
  try {
    const { estado_operativo } = req.body;
    const result = await pool.query(`
      UPDATE maquinas
      SET estado_operativo = $1
      WHERE id = $2
      RETURNING *
    `, [estado_operativo, req.params.id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Máquina no encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/ubicacion', async (req, res, next) => {
  try {
    const { latitud, longitud, direccion_referencia, motivo } = req.body;
    const result = await pool.query(`
      INSERT INTO ubicaciones_maquina (maquina_id, latitud, longitud, direccion_referencia, motivo)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [req.params.id, latitud, longitud, direccion_referencia, motivo]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.put('/:maquinaId/ubicacion/:ubicacionId', async (req, res, next) => {
  try {
    const { maquinaId, ubicacionId } = req.params;
    const { latitud, longitud, direccion_referencia, motivo } = req.body;
    const result = await pool.query(`
      UPDATE ubicaciones_maquina
      SET latitud = $1,
          longitud = $2,
          direccion_referencia = $3,
          motivo = $4
      WHERE maquina_id = $5 AND id = $6
      RETURNING *
    `, [latitud, longitud, direccion_referencia, motivo, maquinaId, ubicacionId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Ubicación no encontrada' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.delete('/:maquinaId/ubicacion/:ubicacionId', async (req, res, next) => {
  try {
    const { maquinaId, ubicacionId } = req.params;
    const result = await pool.query(`
      DELETE FROM ubicaciones_maquina
      WHERE maquina_id = $1 AND id = $2
      RETURNING *
    `, [maquinaId, ubicacionId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Ubicación no encontrada' });
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
