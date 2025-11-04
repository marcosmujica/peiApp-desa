// localData.js - Singleton para centralizar datos locales de la aplicación
import EventEmitter from "eventemitter3";
import { onEvent, offEvent, EVENT_DB_CHANGE } from "./DBEvents";
import {
  db_getAllTicketItem,
  db_getAllTickets,
  db_updateTicketListItem,
  db_getTicketViewByTicketId,
  db_addTicketListItem,
  db_getTicket, 
  db_getAllGroups, 
  db_getAllGroupsBy, 
  db_getGroupsByByIdGroup,
  db_openDB,
  db_TICKET_VIEW
} from "../commonApp/database";
import  {TICKET_LIST_ITEM } from "./dataTypes"
import  {TICKET_DETAIL_CLOSED_STATUS, TICKET_DETAIL_CHANGE_DUE_DATE_STATUS,TICKET_DETAIL_STATUS, TICKET_TYPE_COLLECT, TICKET_TYPE_PAY } from "./constants"
import { getProfile, isMe } from "./profile";
import {getUniqueValues } from "./functions";
import {getContactName} from "./contacts";
import { TouchableNativeFeedbackComponent } from "react-native";

// Eventos propios de localData
export const EVENT_LOCAL_DATA_CHANGE = "EVENT_LOCAL_DATA_CHANGE";
export const EVENT_LOCAL_DATA_UPDATE = "EVENT_LOCAL_DATA_UPDATE";
export const EVENT_LOCAL_DATA_UPDATED = "EVENT_LOCAL_DATA_UPDATED";
export const EVENT_LOCAL_DATA_READY = "EVENT_LOCAL_DATA_READY";
export const EVENT_LOCAL_LISTVIEW_UPDATED = "EVENT_LOCAL_LISTVIEW_UPDATED";

class LocalData {
    constructor() {
        if (!LocalData.instance) {
            // EventEmitter propio para emitir eventos
            this._emitter = new EventEmitter();
            
            // Atributos públicos de la clase
            this.tickets = [];
            this.contactList = []
            this.groups = [];
            this.groupsBy = [];
            this.ticketChats = {};
            this.ticketLogs = {};
            this.ticketViews = [];
            this.isReady = false;
            this.lastUpdate = null;

            // mm - si estan en false los genero para evitar haacerlo si no los uso
            this.readyGroups = false
            this.readyContacts = false
    
            
            
            LocalData.instance = this;
        }

        return LocalData.instance;
    }


    async getTicketList()
    { return this.ticketViews }

    async getGroupList ()
    {
        //if (!this.readyGroups)
        {
            let groupsList = await db_getAllGroups ()
            this.groups = groupsList.sort((a, b) => {
                // Manejar casos donde name podría ser undefined o null
                const nameA = a.name || '';
                const nameB = b.name || '';
                // Si ambos empiezan o no empiezan con ~, ordenar alfabéticamente
                return nameA.toLowerCase().localeCompare(nameB.toLowerCase());
            })
            this.readyGroups = true
        }
        return this.groups
    }
    async getGroupByListByIdGroup (idGroup)
    {
        //if (!this.readyGroups)
        {
            let groupsByList = await db_getGroupsByByIdGroup (idGroup)
            this.groupsBy = groupsByList.sort((a, b) => {
                // Manejar casos donde name podría ser undefined o null
                const nameA = a.name || '';
                const nameB = b.name || '';
                // Si ambos empiezan o no empiezan con ~, ordenar alfabéticamente
                return nameA.toLowerCase().localeCompare(nameB.toLowerCase());
            })
            this.readyGroups = true
        }
        return this.groupsBy
    }

    getContactList ()
    {
        if (!this.readyContacts)
        {
            const uniqueIds = getUniqueValues (this.ticketViews, "idUserTo" )
            // Filtrar valores nulos/undefined y asegurar unicidad
            const validUniqueIds = [...new Set(uniqueIds.filter(id => id != null))]
            this.contactList = validUniqueIds.map(element => ({contactId: element, name: getContactName(element)}))
            this.contactList = this.contactList.sort((a, b) => {
                const aStartsWithTilde = a.name.startsWith('~');
                const bStartsWithTilde = b.name.startsWith('~');
                
                // Si uno empieza con ~ y el otro no, el que no empieza con ~ va primero
                if (aStartsWithTilde && !bStartsWithTilde) return 1;
                if (!aStartsWithTilde && bStartsWithTilde) return -1;
                
                // Si ambos empiezan o no empiezan con ~, ordenar alfabéticamente
                return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
            })
            this.readyContacts = true
        }
        return this.contactList
    }

    async setTicketSeen (idTicket)
    {
        const ticket = this.ticketViews.find(t => t.idTicket === idTicket);
        if (ticket) {

            ticket.seen = true;
            ticket.ts = new Date()

            await db_updateTicketListItem (idTicket, ticket)
        }
    }

    async initData ()
    {
        if (!this.isReady )
        {
            try {
                // mm - asegurar que la base de datos esté inicializada antes de consultar
                await db_openDB(db_TICKET_VIEW);
                
                this.ticketViews = await db_getAllTicketItem();
                
                if (!this.ticketViews || !Array.isArray(this.ticketViews)) {
                    console.log("[localData] ticketViews no es un array válido, inicializando como array vacío");
                    this.ticketViews = [];
                }

                // mm - eliminar duplicados basados en idTicket (mantener el más reciente)
                const uniqueTickets = new Map();
                this.ticketViews.forEach(ticket => {
                    const existing = uniqueTickets.get(ticket.idTicket);
                    if (!existing || new Date(ticket.ts) > new Date(existing.ts)) {
                        uniqueTickets.set(ticket.idTicket, ticket);
                    }
                });
                this.ticketViews = Array.from(uniqueTickets.values());
                
                console.log(`[localData] Tickets cargados: ${this.ticketViews.length} (después de eliminar duplicados)`);

                // mm - ordeno descendentemente por ts (más reciente primero)
                this.ticketViews = this.ticketViews.sort((a, b) => {
                    const dateA = new Date(a.ts).getTime();
                    const dateB = new Date(b.ts).getTime();
                    return dateB - dateA;
                });
                
                this.isReady = true;
            } catch (e) {
                console.log("❌ Error en initData:", e);
                this.ticketViews = [];
                this.isReady = false;
            }

            // mm - hay que iniciarlo para que no de errores de recibir eventos sin antes haber iniciado
             // Escuchar cambios en la base de datos
            this._dbChangeListener = onEvent(EVENT_DB_CHANGE, (payload) => {
                this._handleDBChange(payload);
            });
        }
    }

    // Manejar cambios de la base de datos
    async _handleDBChange(payload) {
        console.log("LocalData: DB Change detected", payload);
        
        if (!payload || !payload.table) return;

        const { table, _id, data } = payload;

        // Actualizar datos locales según el tipo de cambio
        switch(table) {
            case 'ticket':
                await this._updateTickets(payload);
                break;
            case 'group_ticket':
                this._updateGroups(payload, data);
                break;
            case 'group_by_ticket':
                this._updateGroupsBy(payload, data);
                break;
            case 'ticket_chat':
                this._updateTicketChats(payload, data);
                break;
            case 'ticket_log_status':
                await this._updateTicketLogs(data);
                break;
            case 'ticket_info':
                await this._updateTicketInfo(data);
                break;
        }

    }

    // Métodos privados para actualizar datos específicos
    async _updateTickets(doc) {

        let data = doc.data
        let item = new TICKET_LIST_ITEM();
        item.idTicket = data.idTicket;
        item.idGroup = data.idTicketGroup
        item.idGroupBy = data.idTicketGroupBy
        item.idUserTo = isMe(data.idUserCreatedBy) ? data.idUserTo : data.idUserFrom;
        item.idUserCreatedBy = data.idUserCreatedBy
        item.currency = data.currency;
        item.title = data.title;
        item.isOpen = data.isOpen;
        item.amount = data.amount;
        item.way = data.way; // mm - por default el way es el del ticket

        // mm - determino que tipo de ticket es
        if (!isMe(data.idUserCreatedBy) && data.way == TICKET_TYPE_PAY) {
            item.way = TICKET_TYPE_COLLECT;
        }
        if (!isMe(data.idUserCreatedBy) && data.way == TICKET_TYPE_COLLECT) {
            item.way = TICKET_TYPE_PAY;
        }

        item.ts = new Date();
        item.dueDate = data.TSDueDate;

        // mm- actualizo en memoria
        const index = this.ticketViews.findIndex(t => t.idTicket === data.idTicket);
        if (index !== -1) {
            // Ya existe en memoria, solo actualizar
            this.ticketViews[index] = item;
            // Actualizar en BD también
            await db_updateTicketListItem(item.idTicket, item);
        } else {
            // No existe en memoria, verificar si existe en BD primero
            const existsInDB = await db_getTicketViewByTicketId(data.idTicket);
            
            if (existsInDB) {
                // Ya existe en BD, solo actualizar
                await db_updateTicketListItem(item.idTicket, item);
            } else {
                // No existe ni en memoria ni en BD, crear nuevo
                await db_addTicketListItem(item.idTicket, item);
            }
            
            // Agregar a memoria solo si no está duplicado
            const alreadyExists = this.ticketViews.some(t => t.idTicket === data.idTicket);
            if (!alreadyExists) {
                this.ticketViews.push(item);
            }
        }
    
        this.lastUpdate = new Date().toISOString();
        this.emitEvent(EVENT_LOCAL_LISTVIEW_UPDATED, doc);
    }

    _updateGroups(change, doc) {
        if (change === 'deleted') {
            this.groups = this.groups.filter(g => g._id !== doc._id);
        } else {
            const index = this.groups.findIndex(g => g._id === doc._id);
            if (index !== -1) {
                this.groups[index] = doc;
            } else {
                this.groups.push(doc);
            }
        }
        this.lastUpdate = new Date().toISOString();
    }

    _updateGroupsBy(change, doc) {
        if (change === 'deleted') {
            this.groupsBy = this.groupsBy.filter(g => g._id !== doc._id);
        } else {
            const index = this.groupsBy.findIndex(g => g._id === doc._id);
            if (index !== -1) {
                this.groupsBy[index] = doc;
            } else {
                this.groupsBy.push(doc);
            }
        }
        this.lastUpdate = new Date().toISOString();
    }

    async _updateTicketChats(change, doc) {
        if (!doc.idTicket) return;
    
        try{
            // mm - determino si existe antes por si hubo un error previamente
            let aux = await db_getTicketViewByTicketId(doc.idTicket);
            if (!aux) {
                // mm- si no esta todavia en la bd no lo actualizo, se actualizara en el proximo mensaje
                return
            }
        }
        catch (e) {console.log (e)}

        // mm- actualizo en memoria
        try{
            const index = this.ticketViews.findIndex(t => t.idTicket === doc.idTicket);
            this.ticketViews[index].lastMsg = doc.message;
        }
        catch (e){console.log ("error updateiticketchat", e)}
        this.lastUpdate = new Date().toISOString();
        this.emitEvent(EVENT_LOCAL_LISTVIEW_UPDATED, change);
    }

    async _updateTicketLogs(data) {

        let aux = await db_getTicket (data.idTicket)
        if (!aux ) return
        const index = this.ticketViews.findIndex(l => l.idTicket === data.idTicket);
        this.lastUpdate = new Date().toISOString();

        // mm - si no lo encuentro salgo
        if (index == -1) return
        
        this.ticketViews[index].status = data.idStatus;
        let aux2 = TICKET_DETAIL_STATUS.find((aux) => aux.code == data.idStatus);
        this.ticketViews[index].statusText = aux2.name;

        // mm - le cambio la fecha de vencimiento
        if (data.idStatus == TICKET_DETAIL_CHANGE_DUE_DATE_STATUS) {
            this.ticketViews[index].dueDate = data.data.dueDate;
        }

        if (data.idStatus == TICKET_DETAIL_CLOSED_STATUS) {
            this.ticketViews[index].isOpen = false
        }

        this.ticketViews[index].ts = new Date();
        
        // mm - si lo envie yo no lo marco
        this.ticketViews[index].seen = isMe (data.idUserFrom)
        
        // mm - actualizar solo el item específico en el estado
        await db_updateTicketListItem(data.idTicket, this.ticketViews[index]);

        this.emitEvent(EVENT_LOCAL_LISTVIEW_UPDATED, data);
    }
    async _updateTicketInfo(data) {

        let aux = await db_getTicket (data.idTicket)
        if (!aux ) return
        const index = this.ticketViews.findIndex(l => l.idTicket === data.idTicket);
        this.lastUpdate = new Date().toISOString();

        // mm - si no lo encuentro salgo
        if (index == -1) return
        
        this.ticketViews[index].status = data.idStatus;
        let aux2 = TICKET_DETAIL_STATUS.find((aux) => aux.code == data.idStatus);
        this.ticketViews[index].statusText = aux2.name;

        // mm - le cambio la fecha de vencimiento
        if (data.idStatus == TICKET_DETAIL_CHANGE_DUE_DATE_STATUS) {
            this.ticketViews[index].dueDate = data.data.dueDate;
        }

        if (data.idStatus == TICKET_DETAIL_CLOSED_STATUS) {
            this.ticketViews[index].isOpen = false
        }

        this.ticketViews[index].ts = new Date();
        
        // mm - si lo envie yo no lo marco
        this.ticketViews[index].seen = isMe (data.idUserFrom)
        
        // mm - actualizar solo el item específico en el estado
        await db_updateTicketListItem(data.idTicket, this.ticketViews[index]);

        this.emitEvent(EVENT_LOCAL_LISTVIEW_UPDATED, data);
    }


    // Métodos públicos para emitir eventos propios
    emitEvent(eventName, payload) {
        console.log("LocalData: Emitting event", eventName, payload);
        this._emitter.emit(eventName, payload);
    }

    // Métodos públicos para escuchar eventos propios
    onEvent(eventName, callback) {
        this._emitter.on(eventName, callback);
        return () => this._emitter.off(eventName, callback);
    }

    offEvent(eventName, callback) {
        this._emitter.off(eventName, callback);
    }

    onceEvent(eventName, callback) {
        this._emitter.once(eventName, callback);
    }

    // Método para obtener el emitter (opcional)
    getEmitter() {
        return this._emitter;
    }

    // Métodos de utilidad públicos
    getTicketById(ticketId) {
        return this.tickets.find(t => t._id === ticketId || t.idTicket === ticketId);
    }

    getGroupById(groupId) {
        return this.groups.find(g => g._id === groupId || g.idGroup === groupId);
    }

    getGroupByById(groupById) {
        return this.groupsBy.find(g => g._id === groupById || g.idGroupBy === groupById);
    }

    getChatsByTicketId(ticketId) {
        return this.ticketChats[ticketId] || [];
    }

    getLogsByTicketId(ticketId) {
        return this.ticketLogs[ticketId] || [];
    }

    getTicketViewById(ticketViewId) {
        return this.ticketViews.find(v => v._id === ticketViewId || v.idTicketView === ticketViewId);
    }

    // Método para marcar como ready
    setReady(ready = true) {
        this.isReady = ready;
        if (ready) {
            this.emitEvent(EVENT_LOCAL_DATA_READY, {
                timestamp: new Date().toISOString()
            });
        }
    }

    // Método para limpiar todos los datos
    clearAll() {
        this.tickets = [];
        this.groups = [];
        this.groupsBy = [];
        this.ticketChats = {};
        this.ticketLogs = {};
        this.ticketViews = [];
        this.isReady = false;
        this.lastUpdate = null;
        
        this.emitEvent(EVENT_LOCAL_DATA_UPDATE, {
            action: 'clearAll',
            timestamp: new Date().toISOString()
        });
    }

    // Método para destruir listeners (cleanup)
    destroy() {
        if (this._dbChangeListener) {
            this._dbChangeListener();
        }
        this._emitter.removeAllListeners();
    }

    async processEvent(doc) {
        console.log("🔔 EVENT RECEIVED:", doc.table, doc._id);
        //return
        try {
          if (doc.table == db_TICKET_CHAT) {
            let item = await db_getTicketViewByTicketId(doc.data.idTicket);
    
            if (item.length == 0) return;
    
            item.lastMsg = doc.data.message;
    
            if (doc.data.mediaType == "image") item.lastMsg = ">> Foto";
            if (doc.data.mediaType == "file") item.lastMsg = ">> Archivo";
    
            let aux2 = TICKET_DETAIL_STATUS.find((aux) => aux.code == doc.data.idStatus);
    
            item.ts = new Date();
            // mm - si lo envie yo no lo marco
            if (doc.data.idUserFrom != profile.idUser) {
              item.seen = false;
            }
    
            // mm - NO actualizar la BD aquí, solo actualizar el estado UI
            await db_updateTicketListItem (item.idTicket, item)
    
            // mm - actualizar solo el item específico en el estado
            updateTicketInList(item.idTicket, item);
          }
          if (doc.table == db_TICKET_LOG_STATUS) {
            let item = await db_getTicketViewByTicketId(doc.data.idTicket);
    
            if (!item) return;
    
            item.status = doc.data.idStatus;
            let aux2 = TICKET_DETAIL_STATUS.find((aux) => aux.code == doc.data.idStatus);
            item.statusText = aux2.name;
    
            // mm - le cambio la fecha de vencimiento
            if (doc.data.idStatus == TICKET_DETAIL_CHANGE_DUE_DATE_STATUS) {
              item.dueDate = doc.data.data.dueDate;
            }
    
            if (doc.data.idStatus == TICKET_DETAIL_CLOSED_STATUS) {
              item.isOpen = false
            }
    
            // mm - si lo envie yo no lo marco
            item.ts = new Date();
    
            if (doc.data.idUserFrom != profile.idUser) {
              item.seen = false;
            }
    
            // mm - NO actualizar la BD aquí, solo actualizar el estado UI
            await db_updateTicketListItem (item.idTicket, item)
    
            // mm - actualizar solo el item específico en el estado
            updateTicketInList(item.idTicket, item);
          }
          if (doc.table == db_TICKET) {
            let item = new TICKET_LIST_ITEM();
            let data = doc.data;
            item.idTicket = doc._id;
            item.idGroup = item.idTicketGroup
            item.idGroupBy = item.idTicketGroupBy
            item.idUserTo = data.idUserCreatedBy == profile.idUser ? data.idUserTo : data.idUserFrom;
            item.idUserCreatedBy = data.idUserCreatedBy
            item.currency = doc.data.currency;
            item.title = data.title;
            item.isOpen = data.isOpen;
            item.amount = data.amount;
            item.way = data.way; // mm - por default el way es el del ticket
    
            // mm - determino que tipo de ticket es
            if (!isMe(data.idUserCreatedBy) && data.way == TICKET_TYPE_PAY) {
              item.way = TICKET_TYPE_COLLECT;
            }
            if (!isMe(data.idUserCreatedBy) && data.way == TICKET_TYPE_COLLECT) {
              item.way = TICKET_TYPE_PAY;
            }
    
            item.ts = new Date();
            item.dueDate = data.TSDueDate;
    
            // mm - determino si existe antes por si hubo un error previamente
            let aux = await db_getTicketViewByTicketId(doc._id);
    
            if (!aux) {
              // mm- agrego si no estaba previamente en ticket_view
              await db_addTicketListItem(item.idTicket, item);
            }
    
            // mm - actualizar solo el item específico en el estado
            updateTicketInList(item.idTicket, item);
          }
        } catch (e) {
          console.log(e);
          console.log("❌ error processEvent");
        }
      }
    
}

// Crear y exportar una única instancia
const localData = new LocalData();

export default localData;
