import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { couchDBService } from '../services/couchDBService';

const TicketList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [searchId, setSearchId] = useState(searchParams.get('id') || '');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const id = searchParams.get('id');
    if (id && id.trim()) {
      setSearchId(id);
      handleSearch(id);
    }
  }, [searchParams]);

  const handleSearch = async (id = searchId) => {
    if (!id || !id.trim()) {
      setError('Por favor ingresa un ID de búsqueda');
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);
    
    try {
      const result = await couchDBService.getTicketsBySearchId(id.trim());
      
      if (result.success) {
        setTickets(result.data || []);
        
        // Actualizar URL con el ID de búsqueda
        setSearchParams({ id: id.trim() });
      } else {
        setError(`Error al obtener tickets: ${result.error}`);
        setTickets([]);
      }
    } catch (error) {
      setError(`Error inesperado: ${error.message}`);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setSearchId(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleTicketClick = (ticket) => {
    navigate(`/tickets/${ticket._id}`);
  };

  const getStatusClass = (status) => {
    const statusClasses = {
      'pending': 'pending',
      'paid': 'paid',
      'cancelled': 'cancelled',
      'declined': 'declined'
    };
    return statusClasses[status] || 'pending';
  };

  const renderTicketCard = (ticket) => (
    <div 
      key={ticket._id} 
      className="ticket-item"
      onClick={() => handleTicketClick(ticket)}
    >
      <div className="ticket-header">
        <h3 className="ticket-title">{ticket.title || `Ticket ${ticket.id}`}</h3>
        <span className={`ticket-status ${getStatusClass(ticket.status)}`}>
          {couchDBService.getStatusLabel(ticket.status)}
        </span>
      </div>
      
      <div className="ticket-info">
        <div>
          <strong>ID:</strong> {ticket.id}
        </div>
        <div>
          <strong>Monto:</strong> {couchDBService.formatCurrency(ticket.amount)}
        </div>
        <div>
          <strong>Vencimiento:</strong> {couchDBService.formatDate(ticket.dueDate)}
        </div>
        <div>
          <strong>Creado:</strong> {couchDBService.formatDate(ticket.createdDate)}
        </div>
      </div>
      
      {ticket.description && (
        <div style={{ marginTop: '10px', color: '#666', fontSize: '14px' }}>
          {ticket.description.length > 100 
            ? `${ticket.description.substring(0, 100)}...` 
            : ticket.description
          }
        </div>
      )}
      
      {ticket.notes && ticket.notes.length > 0 && (
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#999' }}>
          {ticket.notes.length} nota{ticket.notes.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h2>Buscar Tickets</h2>
        </div>
        
        <div className="card-body">
          <div className="form-group">
            <label htmlFor="searchId" className="form-label">
              ID único de búsqueda
            </label>
            <div className="d-flex gap-2">
              <input
                type="text"
                id="searchId"
                value={searchId}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                className="form-control"
                placeholder="Ingresa el ID de búsqueda"
                disabled={loading}
              />
              <button
                onClick={() => handleSearch()}
                disabled={loading || !searchId.trim()}
                className="btn btn-primary"
                style={{ minWidth: '100px' }}
              >
                {loading ? 'Buscando...' : 'Buscar'}
              </button>
            </div>
          </div>

          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      )}

      {hasSearched && !loading && (
        <div className="card">
          <div className="card-header">
            <h3>
              Resultados {searchId && `para "${searchId}"`}
              <span style={{ marginLeft: '10px', fontSize: '14px', fontWeight: 'normal', color: '#666' }}>
                ({tickets.length} ticket{tickets.length !== 1 ? 's' : ''} encontrado{tickets.length !== 1 ? 's' : ''})
              </span>
            </h3>
          </div>
          
          <div className="card-body">
            {tickets.length === 0 ? (
              <div className="text-center" style={{ padding: '40px', color: '#666' }}>
                <p>No se encontraron tickets para este ID de búsqueda.</p>
                <p style={{ fontSize: '14px' }}>
                  Verifica que el ID sea correcto o intenta con otro ID.
                </p>
              </div>
            ) : (
              <div className="ticket-list">
                {tickets.map(renderTicketCard)}
              </div>
            )}
          </div>
        </div>
      )}

      {!hasSearched && !loading && (
        <div className="card">
          <div className="card-body">
            <div className="text-center" style={{ padding: '40px', color: '#666' }}>
              <h3>Bienvenido al Gestor de Tickets</h3>
              <p>Ingresa un ID de búsqueda en el campo de arriba para comenzar.</p>
              <p style={{ fontSize: '14px' }}>
                El sistema mostrará todos los tickets asociados a ese ID único.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketList;