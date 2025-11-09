import React, { useState } from 'react';

const StatusUpdateModal = ({ action, ticket, onSubmit, onClose, loading }) => {
  const [formData, setFormData] = useState({
    note: '',
    paymentAmount: ticket?.amount || 0,
    paymentMethod: 'cash',
    newDueDate: '',
    paymentNote: ''
  });

  const getModalTitle = () => {
    switch (action) {
      case 'pay':
        return 'Registrar Pago';
      case 'extend':
        return 'Cambiar Fecha de Vencimiento';
      case 'cancel':
        return 'Cancelar Ticket';
      case 'decline':
        return 'Declinar Ticket';
      default:
        return 'Actualizar Ticket';
    }
  };

  const getNewStatus = () => {
    switch (action) {
      case 'pay':
        return 'paid';
      case 'cancel':
        return 'cancelled';
      case 'decline':
        return 'declined';
      case 'extend':
        return ticket?.status || 'pending';
      default:
        return 'pending';
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const updateData = {
      status: getNewStatus(),
      note: formData.note.trim() || undefined
    };

    // Agregar datos específicos según la acción
    if (action === 'pay') {
      updateData.payment = {
        amount: parseFloat(formData.paymentAmount),
        method: formData.paymentMethod,
        note: formData.paymentNote.trim() || undefined
      };
    }

    if (action === 'extend' && formData.newDueDate) {
      updateData.newDueDate = formData.newDueDate;
    }

    onSubmit(updateData);
  };

  const renderPaymentFields = () => {
    if (action !== 'pay') return null;

    return (
      <>
        <div className="form-group">
          <label htmlFor="paymentAmount" className="form-label">
            Monto del Pago
          </label>
          <input
            type="number"
            id="paymentAmount"
            name="paymentAmount"
            value={formData.paymentAmount}
            onChange={handleInputChange}
            className="form-control"
            min="0"
            step="0.01"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="paymentMethod" className="form-label">
            Método de Pago
          </label>
          <select
            id="paymentMethod"
            name="paymentMethod"
            value={formData.paymentMethod}
            onChange={handleInputChange}
            className="form-select"
            required
          >
            <option value="cash">Efectivo</option>
            <option value="credit_card">Tarjeta de Crédito</option>
            <option value="debit_card">Tarjeta de Débito</option>
            <option value="bank_transfer">Transferencia Bancaria</option>
            <option value="digital_wallet">Billetera Digital</option>
            <option value="other">Otro</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="paymentNote" className="form-label">
            Nota del Pago (Opcional)
          </label>
          <textarea
            id="paymentNote"
            name="paymentNote"
            value={formData.paymentNote}
            onChange={handleInputChange}
            className="form-control"
            rows="2"
            placeholder="Detalles adicionales sobre el pago..."
          />
        </div>
      </>
    );
  };

  const renderDateField = () => {
    if (action !== 'extend') return null;

    return (
      <div className="form-group">
        <label htmlFor="newDueDate" className="form-label">
          Nueva Fecha de Vencimiento
        </label>
        <input
          type="date"
          id="newDueDate"
          name="newDueDate"
          value={formData.newDueDate}
          onChange={handleInputChange}
          className="form-control"
          min={new Date().toISOString().split('T')[0]}
          required
        />
      </div>
    );
  };

  const getSubmitButtonText = () => {
    if (loading) return 'Procesando...';
    
    switch (action) {
      case 'pay':
        return 'Registrar Pago';
      case 'extend':
        return 'Cambiar Fecha';
      case 'cancel':
        return 'Cancelar Ticket';
      case 'decline':
        return 'Declinar Ticket';
      default:
        return 'Confirmar';
    }
  };

  const getSubmitButtonClass = () => {
    switch (action) {
      case 'pay':
        return 'btn-success';
      case 'extend':
        return 'btn-warning';
      case 'cancel':
      case 'decline':
        return 'btn-danger';
      default:
        return 'btn-primary';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{getModalTitle()}</h3>
          <button 
            className="modal-close" 
            onClick={onClose}
            disabled={loading}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {action === 'pay' && (
              <div className="alert alert-info" style={{ marginBottom: '20px' }}>
                <strong>Ticket:</strong> {ticket?.title || ticket?.id}<br />
                <strong>Monto Original:</strong> {ticket ? new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(ticket.amount) : ''}
              </div>
            )}

            {action === 'extend' && (
              <div className="alert alert-warning" style={{ marginBottom: '20px' }}>
                <strong>Fecha Actual de Vencimiento:</strong> {ticket ? new Date(ticket.dueDate).toLocaleDateString('es-AR') : ''}
              </div>
            )}

            {(action === 'cancel' || action === 'decline') && (
              <div className="alert alert-warning" style={{ marginBottom: '20px' }}>
                ⚠️ Esta acción cambiará el estado del ticket y no se podrá revertir fácilmente.
              </div>
            )}

            {renderPaymentFields()}
            {renderDateField()}

            <div className="form-group">
              <label htmlFor="note" className="form-label">
                {action === 'pay' ? 'Nota General (Opcional)' : 
                 action === 'extend' ? 'Motivo del Cambio (Opcional)' : 
                 'Motivo (Opcional)'}
              </label>
              <textarea
                id="note"
                name="note"
                value={formData.note}
                onChange={handleInputChange}
                className="form-control"
                rows="3"
                placeholder={
                  action === 'pay' ? 'Observaciones generales...' :
                  action === 'extend' ? 'Explica el motivo del cambio de fecha...' :
                  'Explica el motivo de esta acción...'
                }
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || (action === 'extend' && !formData.newDueDate)}
              className={`btn ${getSubmitButtonClass()}`}
            >
              {getSubmitButtonText()}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StatusUpdateModal;