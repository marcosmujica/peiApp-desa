// dbInstance.js - Singleton para mantener una única instancia de la base de datos
class DatabaseInstance {
    constructor() {
        if (!DatabaseInstance.instance) {
            this._db = [
                {name: 'otp', dbLocal: undefined, dbRemote: undefined, options: {}, syncSide: "REMOTE", created: false, index: []},
                {name: 'ticket', dbLocal: undefined, dbRemote: undefined, options: {}, syncSide: "REMOTE", created: false, index: [{name:"index_1", fields:["idTicket", "idUserTo", "idUserFrom"]}, {name:"index_2",fields:["idTicket"]}]},
                {name: 'ticket_chat', dbLocal: undefined, dbRemote: undefined, options: {}, syncSide: "REMOTE", created: false, index: []},
                {name: 'ticket_log_status', dbLocal: undefined, dbRemote: undefined, options: {}, syncSide: "REMOTE", created: false, index: []},
                {name: 'user', dbLocal: undefined, dbRemote: undefined, options: {}, syncSide: "REMOTE", created: false, index: []},
                {name: 'group', dbLocal: undefined, dbRemote: undefined, options: {}, syncSide: "REMOTE", created: false, index: []},
                {name: 'user_access', dbLocal: undefined, dbRemote: undefined, options: {}, syncSide: "REMOTE", created: false, index: []},
                {name: 'profile', dbLocal: undefined, dbRemote: undefined, options: {}, syncSide: "LOCAL", created: false, index: []},
                {name: 'group_ticket', dbLocal: undefined, dbRemote: undefined, options: {}, syncSide: "REMOTE", created: false, index: []},
                {name: 'group_by_ticket', dbLocal: undefined, dbRemote: undefined, options: {}, syncSide: "REMOTE", created: false, index: []},
                {name: 'helpdesk', dbLocal: undefined, dbRemote: undefined, options: {}, syncSide: "REMOTE", created: false, index: []},
                {name: 'ticket_rating', dbLocal: undefined, dbRemote: undefined, options: {}, syncSide: "LOCAL", created: false, index: []},
                {name: 'ticket_info', dbLocal: undefined, dbRemote: undefined, options: {}, syncSide: "REMOTE", created: false, index: []}

            ];
            DatabaseInstance.instance = this;
        }

        return DatabaseInstance.instance;
    }

    getDB() {
        return this._db;
    }

    setDB(db) {
        this._db = db;
    }

    getDBByName(name) {
        return this._db.find(db => db.name === name);
    }

    updateDBInstance(name, updates) {
        const index = this._db.findIndex(db => db.name === name);
        if (index !== -1) {this._db[index] = { ...this._db[index], ...updates };}
    }
}

// Crear y exportar una única instancia
const dbInstance = new DatabaseInstance();
Object.freeze(dbInstance);

export default dbInstance;
