import { useEffect, useMemo, useState } from 'react';
import Login from './Login';
import Swal from 'sweetalert2';

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
  const [view, setView] = useState('dashboard');
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
  const [editingMovimiento, setEditingMovimiento] = useState(null);

  const fetchJson = async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (token) {
      // Las peticiones autenticadas envían el JWT con el esquema Bearer porque el middleware del backend valida ese formato en el header Authorization.
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

  const dashboardMetrics = useMemo(() => {
    const totalLotes = lotes.length;
    const disponibles = lotes.filter((lote) => lote.estado === 'disponible').length;
    const reservados = lotes.filter((lote) => lote.estado === 'reservado').length;
    const vendidos = lotes.filter((lote) => lote.estado === 'vendido').length;
    // El monto facturado se deriva del precio de los lotes vendidos como aproximación del negocio realizado.
    const montoFacturado = lotes
      .filter((lote) => lote.estado === 'vendido')
      .reduce((sum, lote) => sum + Number(lote.precio || 0), 0);

    const totalMaquinas = maquinas.length;
    const operativas = maquinas.filter((maquina) => maquina.estado_operativo === 'operativa').length;
    const mantenimiento = maquinas.filter((maquina) => maquina.estado_operativo === 'mantenimiento').length;

    const porUnidad = ['U360', 'GrupoPinhero'].map((unidad) => {
      const unidadLotes = lotes.filter((lote) => lote.unidad_negocio === unidad);
      return {
        unidad,
        vendidos: unidadLotes.filter((lote) => lote.estado === 'vendido').length,
        disponibles: unidadLotes.filter((lote) => lote.estado === 'disponible').length
      };
    });

    return { totalLotes, disponibles, reservados, vendidos, montoFacturado, totalMaquinas, operativas, mantenimiento, porUnidad };
  }, [lotes, maquinas]);

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
    const resultado = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Se marcará la cuota como pagada.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, confirmar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#1a3d7c',
      cancelButtonColor: '#6c757d'
    });
    if (!resultado.isConfirmed) return;

    try {
      await fetchJson(`${apiUrl}/api/cuotas/${cuotaId}/pagar`, { method: 'PUT' });
      const data = await fetchJson(`${apiUrl}/api/lotes/${selectedLote.lote.id}`);
      setSelectedLote(data);
      await loadData();
      await Swal.fire({ icon: 'success', title: 'Cuota pagada', text: 'La cuota fue marcada como pagada.' });
    } catch (error) {
      await Swal.fire({ icon: 'error', title: 'Error', text: error.message || 'No se pudo actualizar la cuota.' });
    }
  };

  const openMaquinaDetails = async (maquina) => {
    const data = await fetchJson(`${apiUrl}/api/maquinas/${maquina.id}`);
    setSelectedMaquina(data);
    setSelectedMaquinaId(maquina.id);
    setEditingMovimiento(null);
    setForm({ latitud: '', longitud: '', direccion_referencia: '', motivo: '' });
  };

  const closeMaquinaModal = () => {
    setSelectedMaquina(null);
    setSelectedMaquinaId(null);
    setEditingMovimiento(null);
    setForm({ latitud: '', longitud: '', direccion_referencia: '', motivo: '' });
  };

  const saveUbicacion = async (maquinaId) => {
    try {
      const payload = {
        latitud: Number(form.latitud),
        longitud: Number(form.longitud),
        direccion_referencia: form.direccion_referencia,
        motivo: form.motivo
      };

      if (editingMovimiento) {
        await fetchJson(`${apiUrl}/api/maquinas/${maquinaId}/ubicacion/${editingMovimiento.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        await Swal.fire({ icon: 'success', title: 'Actualizado', text: 'Movimiento actualizado correctamente.' });
      } else {
        await fetchJson(`${apiUrl}/api/maquinas/${maquinaId}/ubicacion`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        await Swal.fire({ icon: 'success', title: 'Guardado', text: 'Ubicación guardada correctamente.' });
      }

      setEditingMovimiento(null);
      setForm({ latitud: '', longitud: '', direccion_referencia: '', motivo: '' });
      const maquinaData = await fetchJson(`${apiUrl}/api/maquinas/${maquinaId}`);
      setSelectedMaquina(maquinaData);
      await loadData();
    } catch (error) {
      await Swal.fire({ icon: 'error', title: 'Error', text: error.message || 'No se pudo guardar la ubicación.' });
    }
  };

  const editMovimiento = (movimiento) => {
    setEditingMovimiento(movimiento);
    setForm({
      latitud: movimiento.latitud,
      longitud: movimiento.longitud,
      direccion_referencia: movimiento.direccion_referencia,
      motivo: movimiento.motivo
    });
  };

  const deleteMovimiento = async (maquinaId, ubicacionId) => {
    const resultado = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Se eliminará este movimiento permanentemente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, confirmar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#1a3d7c',
      cancelButtonColor: '#6c757d'
    });
    if (!resultado.isConfirmed) return;

    try {
      await fetchJson(`${apiUrl}/api/maquinas/${maquinaId}/ubicacion/${ubicacionId}`, {
        method: 'DELETE'
      });
      if (editingMovimiento?.id === ubicacionId) {
        setEditingMovimiento(null);
        setForm({ latitud: '', longitud: '', direccion_referencia: '', motivo: '' });
      }
      const maquinaData = await fetchJson(`${apiUrl}/api/maquinas/${maquinaId}`);
      setSelectedMaquina(maquinaData);
      await loadData();
      await Swal.fire({ icon: 'success', title: 'Eliminado', text: 'El movimiento fue eliminado correctamente.' });
    } catch (error) {
      await Swal.fire({ icon: 'error', title: 'Error', text: error.message || 'No se pudo eliminar el movimiento.' });
    }
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>Gestión Integrada</h1>
        <p>Grupo Piñhero</p>
        <button className={view === 'dashboard' ? 'active' : ''} onClick={() => setView('dashboard')}>Dashboard</button>
        <button className={view === 'lotes' ? 'active' : ''} onClick={() => setView('lotes')}>Loteos y Financiación</button>
        <button className={view === 'maquinas' ? 'active' : ''} onClick={() => setView('maquinas')}>Operaciones Móviles</button>
        <button className="logout-button" onClick={handleLogout}>Cerrar sesión</button>
      </aside>

      <main className="main-content">
        {feedback.message && (
          <div className={`toast-banner ${feedback.type}`}>{feedback.message}</div>
        )}
        {view === 'dashboard' ? (
          <section>
            <div className="section-header">
              <h2>Dashboard consolidado</h2>
            </div>
            <div className="dashboard-grid">
              <div className="panel">
                <h3>Total de lotes</h3>
                <p>{dashboardMetrics.totalLotes}</p>
              </div>
              <div className="panel">
                <h3>Vendidos</h3>
                <p>{dashboardMetrics.vendidos}</p>
              </div>
              <div className="panel">
                <h3>Disponibles</h3>
                <p>{dashboardMetrics.disponibles}</p>
              </div>
              <div className="panel">
                <h3>Monto facturado</h3>
                <p>${dashboardMetrics.montoFacturado.toLocaleString()}</p>
              </div>
              <div className="panel">
                <h3>Total de máquinas</h3>
                <p>{dashboardMetrics.totalMaquinas}</p>
              </div>
              <div className="panel">
                <h3>Máquinas en mantenimiento</h3>
                <p>{dashboardMetrics.mantenimiento}</p>
              </div>
            </div>
            <div className="panel">
              <h3>Desglose por unidad de negocio</h3>
              <table>
                <thead>
                  <tr>
                    <th>Unidad</th>
                    <th>Vendidos</th>
                    <th>Disponibles</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardMetrics.porUnidad.map((unidad) => (
                    <tr key={unidad.unidad}>
                      <td>{unidad.unidad}</td>
                      <td>{unidad.vendidos}</td>
                      <td>{unidad.disponibles}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : view === 'lotes' ? (
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

            <div className="table-wrap">
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
            </div>

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

            <div className="table-wrap">
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
            </div>
          </section>
        )}
        
        {selectedMaquina && view === 'maquinas' && (
          <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeMaquinaModal()}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={closeMaquinaModal}>×</button>
              <h3>{selectedMaquina.maquina?.nombre}</h3>
              <div className="form-grid">
                <input placeholder="Latitud" value={form.latitud} onChange={(e) => setForm({ ...form, latitud: e.target.value })} />
                <input placeholder="Longitud" value={form.longitud} onChange={(e) => setForm({ ...form, longitud: e.target.value })} />
                <input placeholder="Dirección de referencia" value={form.direccion_referencia} onChange={(e) => setForm({ ...form, direccion_referencia: e.target.value })} />
                <input placeholder="Motivo" value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })} />
                <div className="modal-actions">
                  <button onClick={() => saveUbicacion(selectedMaquina.maquina?.id)}>{editingMovimiento ? 'Guardar cambios' : 'Guardar ubicación'}</button>
                  {editingMovimiento && <button type="button" className="secondary-button" onClick={() => {
                    setEditingMovimiento(null);
                    setForm({ latitud: '', longitud: '', direccion_referencia: '', motivo: '' });
                  }}>Cancelar</button>}
                </div>
              </div>
              <div className="timeline">
                {selectedMaquina.historial?.map((item) => (
                  <div key={item.id} className="timeline-item">
                    <div>
                      <strong>{item.motivo}</strong>
                      <p>{item.direccion_referencia} · {new Date(item.fecha_movimiento).toLocaleString()}</p>
                      <p>Lat: {item.latitud}, Lon: {item.longitud}</p>
                    </div>
                    <div className="timeline-item-actions">
                      <button className="secondary-button" onClick={() => editMovimiento(item)}>Editar</button>
                      <button className="secondary-button danger-button" onClick={() => deleteMovimiento(selectedMaquina.maquina?.id, item.id)}>Eliminar</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
