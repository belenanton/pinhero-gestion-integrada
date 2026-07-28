import { useEffect, useMemo, useState } from 'react';
import Login from './Login';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const statusColors = {
  disponible: 'neutral',
  reservado: 'warning',
  vendido: 'success',
  operativa: 'success',
  mantenimiento: 'warning',
  fuera_de_servicio: 'danger'
};

const formatStatus = (value) => value?.replace(/_/g, ' ');

function App() {
  const [view, setView] = useState('lotes');
  const [token, setToken] = useState(null);
  const [lotes, setLotes] = useState([]);
  const [maquinas, setMaquinas] = useState([]);
  const [selectedLote, setSelectedLote] = useState(null);
  const [selectedMaquina, setSelectedMaquina] = useState(null);
  const [filtroUnidad, setFiltroUnidad] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [form, setForm] = useState({ latitud: '', longitud: '', direccion_referencia: '', motivo: '' });
  const [feedback, setFeedback] = useState({ message: '', type: 'success' });
  const [selectedLoteId, setSelectedLoteId] = useState(null);
  const [selectedMaquinaId, setSelectedMaquinaId] = useState(null);

  const fetchJson = async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || 'Error de la API');
    }
    return response.json();
  };

  const loadData = async () => {
    const [lotesData, maquinasData] = await Promise.all([
      fetchJson(`${apiUrl}/api/lotes`),
      fetchJson(`${apiUrl}/api/maquinas`)
    ]);
    setLotes(lotesData);
    setMaquinas(maquinasData);
  };

  const handleLoginSuccess = ({ token: newToken }) => {
    setToken(newToken);
  };

  const handleLogout = () => {
    setToken(null);
    setLotes([]);
    setMaquinas([]);
    setSelectedLote(null);
    setSelectedMaquina(null);
  };

  useEffect(() => {
    if (!token) return;
    loadData().catch(console.error);
  }, [token]);

  useEffect(() => {
    if (!feedback.message) return;

    const timer = window.setTimeout(() => {
      setFeedback({ message: '', type: 'success' });
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [feedback.message]);

  const filteredLotes = useMemo(() => {
    return lotes.filter((lote) => {
      const matchesUnidad = !filtroUnidad || lote.unidad_negocio === filtroUnidad;
      const matchesEstado = !filtroEstado || lote.estado === filtroEstado;
      return matchesUnidad && matchesEstado;
    });
  }, [lotes, filtroUnidad, filtroEstado]);

  if (!token) {
    return (
      <div className="app-shell">
        <main className="main-content">
          <Login onLoginSuccess={handleLoginSuccess} />
        </main>
      </div>
    );
  }

  const openLoteDetails = async (lote) => {
    if (lote.estado !== 'vendido') return;
    const data = await fetchJson(`${apiUrl}/api/lotes/${lote.id}`);
    setSelectedLote(data);
    setSelectedLoteId(lote.id);
  };

  const pagarCuota = async (cuotaId) => {
    if (!window.confirm('¿Deseas marcar esta cuota como pagada?')) return;

    try {
      await fetchJson(`${apiUrl}/api/cuotas/${cuotaId}/pagar`, { method: 'PUT' });
      const data = await fetchJson(`${apiUrl}/api/lotes/${selectedLote.lote.id}`);
      setSelectedLote(data);
      await loadData();
      setFeedback({ message: 'Cuota marcada como pagada correctamente.', type: 'success' });
    } catch (error) {
      setFeedback({ message: error.message || 'No se pudo actualizar la cuota.', type: 'error' });
    }
  };

  const openMaquinaDetails = async (maquina) => {
    const data = await fetchJson(`${apiUrl}/api/maquinas/${maquina.id}`);
    setSelectedMaquina(data);
    setSelectedMaquinaId(maquina.id);
  };

  const registrarMovimiento = async (maquinaId) => {
    if (!window.confirm('¿Deseas guardar esta ubicación para la máquina?')) return;

    try {
      const nuevaUbicacion = await fetchJson(`${apiUrl}/api/maquinas/${maquinaId}/ubicacion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, latitud: Number(form.latitud), longitud: Number(form.longitud) })
      });
      setForm({ latitud: '', longitud: '', direccion_referencia: '', motivo: '' });
      const maquinaData = await fetchJson(`${apiUrl}/api/maquinas/${maquinaId}`);
      setSelectedMaquina({ ...maquinaData, historial: [nuevaUbicacion, ...(maquinaData.historial || [])] });
      await loadData();
      setFeedback({ message: 'Ubicación guardada correctamente.', type: 'success' });
    } catch (error) {
      setFeedback({ message: error.message || 'No se pudo guardar la ubicación.', type: 'error' });
    }
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>Gestión Integrada</h1>
        <p>Grupo Piñhero</p>
        <button className={view === 'lotes' ? 'active' : ''} onClick={() => setView('lotes')}>Loteos y Financiación</button>
        <button className={view === 'maquinas' ? 'active' : ''} onClick={() => setView('maquinas')}>Operaciones Móviles</button>
        <button className="logout-button" onClick={handleLogout}>Cerrar sesión</button>
      </aside>

      <main className="main-content">
        {feedback.message && (
          <div className={`toast-banner ${feedback.type}`}>{feedback.message}</div>
        )}
        {view === 'lotes' ? (
          <section>
            <div className="section-header">
              <h2>Loteos y Financiación</h2>
            </div>

            <div className="filters">
              <select value={filtroUnidad} onChange={(e) => setFiltroUnidad(e.target.value)}>
                <option value="">Todas las unidades</option>
                <option value="U360">U360</option>
                <option value="GrupoPinhero">Grupo Piñhero</option>
              </select>
              <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
                <option value="">Todos los estados</option>
                <option value="disponible">Disponible</option>
                <option value="reservado">Reservado</option>
                <option value="vendido">Vendido</option>
              </select>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Unidad</th>
                  <th>Barrio</th>
                  <th>Estado</th>
                  <th>Precio</th>
                </tr>
              </thead>
              <tbody>
                {filteredLotes.map((lote) => (
                  <tr key={lote.id} onClick={() => openLoteDetails(lote)} className={`clickable-row ${selectedLoteId === lote.id ? 'is-selected' : ''}`}>
                    <td>{lote.codigo}</td>
                    <td>{lote.unidad_negocio}</td>
                    <td>{lote.barrio}</td>
                    <td>
                      <button
                        type="button"
                        className={`status-action ${lote.estado === 'vendido' ? '' : 'status-action--disabled'}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          if (lote.estado === 'vendido') openLoteDetails(lote);
                        }}
                        title={lote.estado === 'vendido' ? 'Ver detalle del lote vendido' : 'Sin detalle disponible'}
                      >
                        <span className={`badge ${statusColors[lote.estado]}`}>{formatStatus(lote.estado)}</span>
                        <span>{lote.estado === 'vendido' ? 'Ver detalle' : 'Sin detalle'}</span>
                      </button>
                    </td>
                    <td>${Number(lote.precio).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {selectedLote && (
              <div className="panel">
                <h3>Detalle del lote vendido</h3>
                <p><strong>Cliente:</strong> {selectedLote.cliente?.nombre}</p>
                <p><strong>Método:</strong> {selectedLote.financiacion?.metodo}</p>
                <p><strong>Progreso:</strong> {selectedLote.progreso}</p>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${Math.round((selectedLote.cuotas?.filter((cuota) => cuota.estado === 'pagada').length || 0) / Math.max(selectedLote.cuotas?.length || 1, 1) * 100)}%` }} />
                </div>
                <div className="cuotas-list">
                  {selectedLote.cuotas?.map((cuota) => (
                    <div key={cuota.id} className="cuota-item">
                      <span>Cuota {cuota.numero_cuota} · {cuota.estado}</span>
                      {cuota.estado === 'pagada' ? <span>Pagada</span> : <button onClick={() => pagarCuota(cuota.id)}>Marcar pagada</button>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        ) : (
          <section>
            <div className="section-header">
              <h2>Operaciones Móviles (Emana)</h2>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Máquina</th>
                  <th>Modelo</th>
                  <th>Estado</th>
                  <th>Última ubicación</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {maquinas.map((maquina) => (
                  <tr key={maquina.id} className={selectedMaquinaId === maquina.id ? 'clickable-row is-selected' : 'clickable-row'} onClick={() => openMaquinaDetails(maquina)}>
                    <td>{maquina.nombre}</td>
                    <td>{maquina.modelo}</td>
                    <td><span className={`badge ${statusColors[maquina.estado_operativo]}`}>{formatStatus(maquina.estado_operativo)}</span></td>
                    <td>{maquina.direccion_referencia || 'Sin registro'}</td>
                    <td><button onClick={() => openMaquinaDetails(maquina)}>Registrar movimiento</button></td>
                  </tr>
                ))}
              </tbody>
            </table>

            {selectedMaquina && (
              <div className="panel">
                <h3>{selectedMaquina.maquina?.nombre}</h3>
                <div className="form-grid">
                  <input placeholder="Latitud" value={form.latitud} onChange={(e) => setForm({ ...form, latitud: e.target.value })} />
                  <input placeholder="Longitud" value={form.longitud} onChange={(e) => setForm({ ...form, longitud: e.target.value })} />
                  <input placeholder="Dirección de referencia" value={form.direccion_referencia} onChange={(e) => setForm({ ...form, direccion_referencia: e.target.value })} />
                  <input placeholder="Motivo" value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })} />
                  <button onClick={() => registrarMovimiento(selectedMaquina.maquina?.id)}>Guardar ubicación</button>
                </div>
                <div className="timeline">
                  {selectedMaquina.historial?.map((item) => (
                    <div key={item.id} className="timeline-item">
                      <strong>{item.motivo}</strong>
                      <p>{item.direccion_referencia} · {new Date(item.fecha_movimiento).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
