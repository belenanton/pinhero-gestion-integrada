CREATE TABLE IF NOT EXISTS clientes (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  dni VARCHAR(20) UNIQUE NOT NULL,
  telefono VARCHAR(50),
  email VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS lotes (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(50) UNIQUE NOT NULL,
  unidad_negocio VARCHAR(50) NOT NULL,
  barrio VARCHAR(100),
  superficie_m2 NUMERIC(10,2) NOT NULL,
  estado VARCHAR(30) NOT NULL DEFAULT 'disponible',
  precio NUMERIC(12,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS financiaciones (
  id SERIAL PRIMARY KEY,
  lote_id INT NOT NULL REFERENCES lotes(id) ON DELETE CASCADE,
  cliente_id INT NOT NULL REFERENCES clientes(id),
  metodo VARCHAR(50) NOT NULL,
  monto_total NUMERIC(12,2) NOT NULL,
  cantidad_cuotas_total INT NOT NULL,
  fecha_inicio DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS cuotas (
  id SERIAL PRIMARY KEY,
  financiacion_id INT NOT NULL REFERENCES financiaciones(id) ON DELETE CASCADE,
  numero_cuota INT NOT NULL,
  monto NUMERIC(12,2) NOT NULL,
  fecha_vencimiento DATE NOT NULL,
  fecha_pago DATE,
  estado VARCHAR(20) NOT NULL DEFAULT 'pendiente'
);

CREATE TABLE IF NOT EXISTS maquinas (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  modelo VARCHAR(255),
  estado_operativo VARCHAR(30) NOT NULL DEFAULT 'operativa',
  unidad_negocio VARCHAR(50) NOT NULL DEFAULT 'Emana'
);

CREATE TABLE IF NOT EXISTS ubicaciones_maquina (
  id SERIAL PRIMARY KEY,
  maquina_id INT NOT NULL REFERENCES maquinas(id) ON DELETE CASCADE,
  latitud NUMERIC(9,6) NOT NULL,
  longitud NUMERIC(9,6) NOT NULL,
  direccion_referencia VARCHAR(255),
  fecha_movimiento TIMESTAMP NOT NULL DEFAULT NOW(),
  motivo VARCHAR(255)
);

INSERT INTO clientes (nombre, dni, telefono, email) VALUES
  ('María López', '30111222', '2615550123', 'maria@example.com'),
  ('Carlos Díaz', '30222333', '2615550456', 'carlos@example.com'),
  ('Lucía Pérez', '30333444', '2615550789', 'lucia@example.com')
ON CONFLICT (dni) DO NOTHING;

INSERT INTO lotes (codigo, unidad_negocio, barrio, superficie_m2, estado, precio) VALUES
  ('U360-045', 'U360', 'San Martín', 320.5, 'disponible', 1820000),
  ('U360-046', 'U360', 'Los Pinos', 290, 'disponible', 1690000),
  ('PIN-112', 'GrupoPinhero', 'El Sauce', 410, 'vendido', 2350000),
  ('PIN-113', 'GrupoPinhero', 'Las Rosas', 360, 'vendido', 2050000),
  ('PIN-114', 'GrupoPinhero', 'La Colina', 370, 'vendido', 2120000)
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO financiaciones (lote_id, cliente_id, metodo, monto_total, cantidad_cuotas_total, fecha_inicio)
SELECT id, 1, 'cuotas_propias', 2350000, 24, CURRENT_DATE FROM lotes WHERE codigo='PIN-112';
INSERT INTO financiaciones (lote_id, cliente_id, metodo, monto_total, cantidad_cuotas_total, fecha_inicio)
SELECT id, 2, 'credito_bancario', 2050000, 36, CURRENT_DATE FROM lotes WHERE codigo='PIN-113';
INSERT INTO financiaciones (lote_id, cliente_id, metodo, monto_total, cantidad_cuotas_total, fecha_inicio)
SELECT id, 3, 'UVA', 2120000, 30, CURRENT_DATE FROM lotes WHERE codigo='PIN-114';

DO $$
DECLARE
  fin_id INT;
BEGIN
  SELECT id INTO fin_id FROM financiaciones WHERE lote_id = (SELECT id FROM lotes WHERE codigo='PIN-112');
  FOR i IN 1..24 LOOP
    INSERT INTO cuotas (financiacion_id, numero_cuota, monto, fecha_vencimiento, estado)
    VALUES (fin_id, i, 97916.67, CURRENT_DATE + (i * INTERVAL '30 days'), CASE WHEN i <= 8 THEN 'pagada' ELSE 'pendiente' END);
  END LOOP;

  SELECT id INTO fin_id FROM financiaciones WHERE lote_id = (SELECT id FROM lotes WHERE codigo='PIN-113');
  FOR i IN 1..36 LOOP
    INSERT INTO cuotas (financiacion_id, numero_cuota, monto, fecha_vencimiento, estado)
    VALUES (fin_id, i, 56944.44, CURRENT_DATE + (i * INTERVAL '30 days'), CASE WHEN i <= 5 THEN 'pagada' ELSE 'pendiente' END);
  END LOOP;

  SELECT id INTO fin_id FROM financiaciones WHERE lote_id = (SELECT id FROM lotes WHERE codigo='PIN-114');
  FOR i IN 1..30 LOOP
    INSERT INTO cuotas (financiacion_id, numero_cuota, monto, fecha_vencimiento, estado)
    VALUES (fin_id, i, 70666.67, CURRENT_DATE + (i * INTERVAL '30 days'), CASE WHEN i <= 10 THEN 'pagada' ELSE 'pendiente' END);
  END LOOP;
END $$;

INSERT INTO maquinas (nombre, modelo, estado_operativo, unidad_negocio) VALUES
  ('Perforadora 03', 'P-300', 'operativa', 'Emana'),
  ('Excavadora 02', 'E-200', 'mantenimiento', 'Emana'),
  ('Motoniveladora 01', 'M-100', 'operativa', 'Emana');

INSERT INTO ubicaciones_maquina (maquina_id, latitud, longitud, direccion_referencia, motivo)
SELECT id, -32.8900, -68.8500, 'Ruta 40 km 12', 'inicio de obra' FROM maquinas WHERE nombre='Perforadora 03';
INSERT INTO ubicaciones_maquina (maquina_id, latitud, longitud, direccion_referencia, motivo)
SELECT id, -32.8950, -68.8600, 'Acceso lote U360', 'reasignación técnica' FROM maquinas WHERE nombre='Perforadora 03';
INSERT INTO ubicaciones_maquina (maquina_id, latitud, longitud, direccion_referencia, motivo)
SELECT id, -32.8915, -68.8580, 'Base operativa', 'fin de obra' FROM maquinas WHERE nombre='Excavadora 02';
INSERT INTO ubicaciones_maquina (maquina_id, latitud, longitud, direccion_referencia, motivo)
SELECT id, -32.8920, -68.8570, 'Zona de carga', 'mantenimiento' FROM maquinas WHERE nombre='Excavadora 02';
INSERT INTO ubicaciones_maquina (maquina_id, latitud, longitud, direccion_referencia, motivo)
SELECT id, -32.8895, -68.8515, 'Sector norte', 'desplazamiento' FROM maquinas WHERE nombre='Motoniveladora 01';
