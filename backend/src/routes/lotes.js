const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res, next) => {
  try {
    const { unidad_negocio, estado } = req.query;
    let query = 'SELECT * FROM lotes';
    const params = [];
    const conditions = [];

    if (unidad_negocio) {
      conditions.push(`unidad_negocio = $${params.length + 1}`);
      params.push(unidad_negocio);
    }

    if (estado) {
      conditions.push(`estado = $${params.length + 1}`);
      params.push(estado);
    }

    if (conditions.length) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ' ORDER BY id';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const loteRes = await pool.query('SELECT * FROM lotes WHERE id = $1', [id]);
    if (loteRes.rowCount === 0) {
      return res.status(404).json({ error: 'Lote no encontrado' });
    }

    const lote = loteRes.rows[0];
    if (lote.estado !== 'vendido') {
      return res.json({ lote });
    }

    const ventaRes = await pool.query(`
      SELECT f.*, c.nombre AS cliente_nombre, c.dni, c.telefono, c.email
      FROM financiaciones f
      JOIN clientes c ON c.id = f.cliente_id
      WHERE f.lote_id = $1
      LIMIT 1
    `, [id]);

    const financiacion = ventaRes.rows[0] || null;
    const cuotasRes = await pool.query(`
      SELECT COUNT(*) FILTER (WHERE estado = 'pagada') AS pagadas,
             COUNT(*) AS total
      FROM cuotas
      WHERE financiacion_id = $1
    `, [financiacion?.id || null]);

    const cuotasDetalleRes = await pool.query(`
      SELECT id, numero_cuota, monto, fecha_vencimiento, fecha_pago, estado
      FROM cuotas
      WHERE financiacion_id = $1
      ORDER BY numero_cuota
    `, [financiacion?.id || null]);

    const cuotas = cuotasRes.rows[0];
    res.json({
      lote,
      financiacion,
      cliente: financiacion ? {
        nombre: financiacion.cliente_nombre,
        dni: financiacion.dni,
        telefono: financiacion.telefono,
        email: financiacion.email
      } : null,
      cuotas: cuotasDetalleRes.rows,
      progreso: `${cuotas.pagadas} de ${cuotas.total} cuotas pagadas`
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { codigo, unidad_negocio, barrio, superficie_m2, estado = 'disponible', precio } = req.body;
    if (!codigo || !unidad_negocio || !superficie_m2 || !precio) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    const result = await pool.query(
      `INSERT INTO lotes (codigo, unidad_negocio, barrio, superficie_m2, estado, precio)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [codigo, unidad_negocio, barrio || '', superficie_m2, estado, precio]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.put('/:id/vender', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { cliente_id, metodo, monto_total, cantidad_cuotas } = req.body;
    const loteRes = await pool.query('SELECT * FROM lotes WHERE id = $1', [id]);
    if (loteRes.rowCount === 0) {
      return res.status(404).json({ error: 'Lote no encontrado' });
    }

    if (loteRes.rows[0].estado === 'vendido') {
      return res.status(400).json({ error: 'No se puede vender un lote ya vendido' });
    }

    if (!cliente_id || !metodo || !monto_total || !cantidad_cuotas) {
      return res.status(400).json({ error: 'Faltan datos para la venta' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const financingResult = await client.query(`
        INSERT INTO financiaciones (lote_id, cliente_id, metodo, monto_total, cantidad_cuotas_total, fecha_inicio)
        VALUES ($1, $2, $3, $4, $5, CURRENT_DATE)
        RETURNING id
      `, [id, cliente_id, metodo, monto_total, cantidad_cuotas]);

      const financiacionId = financingResult.rows[0].id;
      const cuotaMonto = Number(monto_total) / Number(cantidad_cuotas);
      const cuotas = [];
      for (let i = 1; i <= cantidad_cuotas; i += 1) {
        cuotas.push(`(${financiacionId}, ${i}, ${cuotaMonto}, CURRENT_DATE + INTERVAL '${i} month')`);
      }
      await client.query(`
        INSERT INTO cuotas (financiacion_id, numero_cuota, monto, fecha_vencimiento)
        VALUES ${cuotas.join(', ')}
      `);

      await client.query('UPDATE lotes SET estado = $1 WHERE id = $2', ['vendido', id]);
      await client.query('COMMIT');
      res.json({ success: true, message: 'Lote vendido correctamente' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
