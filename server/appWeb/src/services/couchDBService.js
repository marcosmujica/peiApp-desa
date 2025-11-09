import axios from 'axios';

class CouchDBService {
  constructor() {
    this.config = null;
    this.baseURL = null;
    this.auth = null;
  }

  setConfig(config) {
    this.config = config;
    if (config) {
      this.baseURL = `${config.url}/${config.database}`;
      this.auth = {
        username: config.username,
        password: config.password
      };
    } else {
      this.baseURL = null;
      this.auth = null;
    }
  }

  async testConnection() {
    if (!this.config) {
      throw new Error('Configuración no establecida');
    }

    try {
      const response = await axios.get(this.config.url, {
        auth: this.auth,
        timeout: 10000
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error de conexión:', error);
      return { 
        success: false, 
        error: error.response?.data?.reason || error.message 
      };
    }
  }

  async createDatabase() {
    if (!this.config) {
      throw new Error('Configuración no establecida');
    }

    try {
      await axios.put(`${this.config.url}/${this.config.database}`, {}, {
        auth: this.auth
      });
      return { success: true };
    } catch (error) {
      if (error.response?.status === 412) {
        // La base de datos ya existe
        return { success: true };
      }
      console.error('Error al crear base de datos:', error);
      return { 
        success: false, 
        error: error.response?.data?.reason || error.message 
      };
    }
  }

  async getTicketsBySearchId(searchId) {
    if (!this.baseURL) {
      throw new Error('Configuración no establecida');
    }

    try {
      const response = await axios.get(`${this.baseURL}/_all_docs`, {
        auth: this.auth,
        params: {
          include_docs: true,
          startkey: `"ticket_${searchId}_"`,
          endkey: `"ticket_${searchId}_\\ufff0"`
        }
      });

      const tickets = response.data.rows
        .filter(row => row.doc && row.doc.type === 'ticket')
        .map(row => row.doc);

      return { success: true, data: tickets };
    } catch (error) {
      console.error('Error al obtener tickets:', error);
      return { 
        success: false, 
        error: error.response?.data?.reason || error.message 
      };
    }
  }

  async getTicketById(ticketId) {
    if (!this.baseURL) {
      throw new Error('Configuración no establecida');
    }

    try {
      const response = await axios.get(`${this.baseURL}/${ticketId}`, {
        auth: this.auth
      });

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error al obtener ticket:', error);
      return { 
        success: false, 
        error: error.response?.data?.reason || error.message 
      };
    }
  }

  async updateTicket(ticket) {
    if (!this.baseURL) {
      throw new Error('Configuración no establecida');
    }

    try {
      // Actualizar fecha de modificación
      ticket.updatedDate = new Date().toISOString();

      const response = await axios.put(`${this.baseURL}/${ticket._id}`, ticket, {
        auth: this.auth,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error al actualizar ticket:', error);
      return { 
        success: false, 
        error: error.response?.data?.reason || error.message 
      };
    }
  }

  async createTicket(ticketData) {
    if (!this.baseURL) {
      throw new Error('Configuración no establecida');
    }

    try {
      const ticket = {
        _id: `ticket_${ticketData.searchId}_${Date.now()}`,
        type: 'ticket',
        ...ticketData,
        createdDate: new Date().toISOString(),
        updatedDate: new Date().toISOString(),
        notes: [],
        payments: [],
        attachments: []
      };

      const response = await axios.put(`${this.baseURL}/${ticket._id}`, ticket, {
        auth: this.auth,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error al crear ticket:', error);
      return { 
        success: false, 
        error: error.response?.data?.reason || error.message 
      };
    }
  }

  async uploadAttachment(ticketId, file) {
    if (!this.baseURL) {
      throw new Error('Configuración no establecida');
    }

    try {
      // Primero obtenemos el ticket para tener el _rev actual
      const ticketResponse = await this.getTicketById(ticketId);
      if (!ticketResponse.success) {
        return ticketResponse;
      }

      const ticket = ticketResponse.data;
      
      // Convertir archivo a base64
      const base64Data = await this.fileToBase64(file);
      
      const attachment = {
        id: `attachment_${Date.now()}`,
        name: file.name,
        type: file.type,
        size: file.size,
        data: base64Data,
        uploadDate: new Date().toISOString()
      };

      // Agregar el attachment al ticket
      if (!ticket.attachments) {
        ticket.attachments = [];
      }
      ticket.attachments.push(attachment);

      // Actualizar el ticket
      return await this.updateTicket(ticket);
    } catch (error) {
      console.error('Error al subir archivo:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = error => reject(error);
    });
  }

  // Métodos utilitarios para formateo de datos
  formatCurrency(amount) {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  }

  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  formatDateTime(dateString) {
    return new Date(dateString).toLocaleString('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusLabel(status) {
    const statusLabels = {
      'pending': 'Pendiente',
      'paid': 'Pagado',
      'cancelled': 'Cancelado',
      'declined': 'Rechazado'
    };
    return statusLabels[status] || status;
  }

  getPaymentMethodLabel(method) {
    const methodLabels = {
      'cash': 'Efectivo',
      'credit_card': 'Tarjeta de Crédito',
      'debit_card': 'Tarjeta de Débito',
      'bank_transfer': 'Transferencia Bancaria',
      'digital_wallet': 'Billetera Digital',
      'other': 'Otro'
    };
    return methodLabels[method] || method;
  }
}

export const couchDBService = new CouchDBService();