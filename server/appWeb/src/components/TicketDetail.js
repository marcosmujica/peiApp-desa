import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { couchDBService } from '../services/couchDBService';
import StatusUpdateModal from './StatusUpdateModal';
import FileUpload from './FileUpload';

const TicketDetail = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadTicket();
  }, [ticketId]);

  const loadTicket = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await couchDBService.getTicketById(ticketId);
      
      if (result.success) {
        setTicket(result.data);
      } else {
        setError(`Error al cargar ticket: ${result.error}`);
      }
    } catch (error) {
      setError(`Error inesperado: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = (action) => {
    setSelectedAction(action);
    setShowStatusModal(true);
  };

  const handleStatusSubmit = async (updateData) => {
    setUpdating(true);
    
    try {
      const updatedTicket = { ...ticket };
      
      // Actualizar estado
      updatedTicket.status = updateData.status;
      
      // Agregar nota si existe
      if (updateData.note) {
        if (!updatedTicket.notes) updatedTicket.notes = [];
        updatedTicket.notes.push({
          id: `note_${Date.now()}`,
          content: updateData.note,
          createdDate: new Date().toISOString(),
          type: 'status_change'
        });
      }
      
      // Agregar pago si existe
      if (updateData.payment) {
        if (!updatedTicket.payments) updatedTicket.payments = [];
        updatedTicket.payments.push({
          id: `payment_${Date.now()}`,
          ...updateData.payment,
          date: new Date().toISOString()
        });
      }
      
      // Actualizar fecha de vencimiento si existe
      if (updateData.newDueDate) {
        updatedTicket.dueDate = updateData.newDueDate;
        if (!updatedTicket.notes) updatedTicket.notes = [];
        updatedTicket.notes.push({
          id: `note_${Date.now()}`,
          content: `Fecha de vencimiento actualizada a ${couchDBService.formatDate(updateData.newDueDate)}${updateData.note ? `. ${updateData.note}` : ''}`,
          createdDate: new Date().toISOString(),
          type: 'due_date_change'
        });
      }
      
      const result = await couchDBService.updateTicket(updatedTicket);
      
      if (result.success) {
        setTicket(updatedTicket);
        setShowStatusModal(false);
        setSelectedAction(null);
      } else {
        setError(`Error al actualizar ticket: ${result.error}`);
      }
    } catch (error) {
      setError(`Error inesperado: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;
    
    setUpdating(true);
    
    try {
      for (const file of files) {
        const result = await couchDBService.uploadAttachment(ticketId, file);
        if (!result.success) {
          setError(`Error al subir archivo ${file.name}: ${result.error}`);
          return;
        }
      }
      
      // Recargar ticket para mostrar archivos actualizados
      await loadTicket();
    } catch (error) {
      setError(`Error inesperado al subir archivos: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const renderTicketInfo = () => (
    <div className="card">
      <div className="card-header">
        <h2>{ticket.title || `Ticket ${ticket.id}`}</h2>
        <span className={`ticket-status ${ticket.status}`}>
          {couchDBService.getStatusLabel(ticket.status)}
        </span>
      </div>
      
      <div className="card-body">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          <div>
            <strong>ID del Ticket:</strong><br />
            <span>{ticket.id}</span>
          </div>
          
          <div>
            <strong>Monto:</strong><br />
            <span style={{ fontSize: '1.25em', color: '#007bff' }}>
              {couchDBService.formatCurrency(ticket.amount)}
            </span>
          </div>
          
          <div>
            <strong>Fecha de Vencimiento:</strong><br />
            <span style={{ color: new Date(ticket.dueDate) < new Date() ? '#dc3545' : '#333' }}>
              {couchDBService.formatDate(ticket.dueDate)}
            </span>
          </div>
          
          <div>
            <strong>ID de Búsqueda:</strong><br />
            <span>{ticket.searchId}</span>
          </div>
          
          <div>
            <strong>Fecha de Creación:</strong><br />
            <span>{couchDBService.formatDateTime(ticket.createdDate)}</span>
          </div>
          
          <div>
            <strong>Última Actualización:</strong><br />
            <span>{couchDBService.formatDateTime(ticket.updatedDate)}</span>
          </div>
        </div>
        
        {ticket.description && (
          <div style={{ marginTop: '20px' }}>
            <strong>Descripción:</strong><br />
            <p style={{ marginTop: '5px', lineHeight: '1.5' }}>{ticket.description}</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderPayments = () => {
    if (!ticket.payments || ticket.payments.length === 0) {
      return null;
    }

    return (
      <div className="card">
        <div className="card-header">
          <h3>Pagos Registrados</h3>
        </div>
        <div className="card-body">
          {ticket.payments.map((payment) => (
            <div key={payment.id} style={{ 
              padding: '15px', 
              border: '1px solid #eee', 
              borderRadius: '5px', 
              marginBottom: '10px',
              backgroundColor: '#f9f9f9'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                <div>
                  <strong>Monto:</strong> {couchDBService.formatCurrency(payment.amount)}
                </div>
                <div>
                  <strong>Método:</strong> {couchDBService.getPaymentMethodLabel(payment.method)}
                </div>
                <div>
                  <strong>Fecha:</strong> {couchDBService.formatDateTime(payment.date)}
                </div>
              </div>
              {payment.note && (
                <div style={{ marginTop: '10px' }}>
                  <strong>Nota:</strong> {payment.note}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderNotes = () => {
    if (!ticket.notes || ticket.notes.length === 0) {
      return null;
    }

    return (
      <div className="card">
        <div className="card-header">
          <h3>Historial de Notas</h3>
        </div>
        <div className="card-body">
          {ticket.notes
            .sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate))
            .map((note) => (
              <div key={note.id} style={{ 
                padding: '15px', 
                border: '1px solid #eee', 
                borderRadius: '5px', 
                marginBottom: '10px',
                backgroundColor: note.type === 'status_change' ? '#fff3cd' : '#f9f9f9'
              }}>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
                  {couchDBService.formatDateTime(note.createdDate)}
                  {note.type === 'status_change' && ' - Cambio de Estado'}
                  {note.type === 'due_date_change' && ' - Cambio de Fecha'}
                </div>
                <div>{note.content}</div>
              </div>
            ))}
        </div>
      </div>
    );
  };

  const renderAttachments = () => {
    return (
      <div className="card">
        <div className="card-header">
          <h3>Archivos Adjuntos</h3>
        </div>
        <div className="card-body">
          <FileUpload onUpload={handleFileUpload} disabled={updating} />
          
          {ticket.attachments && ticket.attachments.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <h4>Archivos Subidos:</h4>
              {ticket.attachments.map((attachment) => (
                <div key={attachment.id} className="file-item">
                  <div className="file-info">
                    <div className="file-name">{attachment.name}</div>
                    <div className="file-size">
                      {(attachment.size / 1024).toFixed(1)} KB - {couchDBService.formatDateTime(attachment.uploadDate)}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = `data:${attachment.type};base64,${attachment.data}`;
                      link.download = attachment.name;
                      link.click();
                    }}
                    className="btn btn-primary"
                    style={{ padding: '5px 10px', fontSize: '12px' }}
                  >
                    Descargar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderActions = () => {
    if (ticket.status === 'paid' || ticket.status === 'cancelled' || ticket.status === 'declined') {
      return (
        <div className="alert alert-info">
          Este ticket ya ha sido procesado y no se pueden realizar más acciones.
        </div>
      );
    }

    return (
      <div className="card">
        <div className="card-header">
          <h3>Acciones Disponibles</h3>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <button
              onClick={() => handleStatusUpdate('pay')}
              disabled={updating}
              className="btn btn-success"
            >
              💰 Registrar Pago
            </button>
            
            <button
              onClick={() => handleStatusUpdate('extend')}
              disabled={updating}
              className="btn btn-warning"
            >
              📅 Cambiar Vencimiento
            </button>
            
            <button
              onClick={() => handleStatusUpdate('cancel')}
              disabled={updating}
              className="btn btn-danger"
            >
              ❌ Cancelar Ticket
            </button>
            
            <button
              onClick={() => handleStatusUpdate('decline')}
              disabled={updating}
              className="btn btn-secondary"
            >
              ⛔ Declinar Ticket
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="alert alert-error">
            {error}
          </div>
          <button 
            onClick={() => navigate('/tickets')} 
            className="btn btn-primary"
          >
            Volver a la Lista
          </button>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="alert alert-warning">
            No se encontró el ticket solicitado.
          </div>
          <button 
            onClick={() => navigate('/tickets')} 
            className="btn btn-primary"
          >
            Volver a la Lista
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => navigate(`/tickets?id=${ticket.searchId}`)} 
          className="btn btn-secondary"
        >
          ← Volver a la Lista
        </button>
      </div>

      {renderTicketInfo()}
      {renderActions()}
      {renderPayments()}
      {renderAttachments()}
      {renderNotes()}

      {showStatusModal && (
        <StatusUpdateModal
          action={selectedAction}
          ticket={ticket}
          onSubmit={handleStatusSubmit}
          onClose={() => {
            setShowStatusModal(false);
            setSelectedAction(null);
          }}
          loading={updating}
        />
      )}
    </div>
  );
};

export default TicketDetail;