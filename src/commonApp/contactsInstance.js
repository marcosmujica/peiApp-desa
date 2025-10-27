import {getProfile, isMe} from "./profile"

// contactsInstance.js
class ContactsManager {
    constructor() {
        if (!ContactsManager.instance) {
            this._contacts = [];
            this._isInitialized = false;
            ContactsManager.instance = this;
        }
        return ContactsManager.instance;
    }

    // Obtener todos los contactos
    getContacts() {
        return this._contacts;
    }

    // Verificar si los contactos ya fueron inicializados
    isInitialized() {
        return this._isInitialized;
    }

    // Establecer los contactos
    setContacts(contacts) {
        this._contacts = contacts;
        this._isInitialized = true;
    }

    // Agregar un contacto
    addContact(contact) {
        if (!this._contacts.find(c => c.id === contact.id)) {
            this._contacts.push(contact);
        }
    }

    // Obtener un contacto por ID
    getContactById(id) {
        return this._contacts.find(contact => contact.phone === id);
    }

    //mm - Obtener nombre de contacto por ID, si es mi id pongo mi nombre
    getContactName(id) {
        try{
            if (id=="" || id==null || id==undefined) return ("")
            const contact = this.getContactById(id);
            let profile = getProfile()
            return contact ? contact.name : isMe (id) ? profile.name : "~" + id;
        }
        catch (e) { console.log ("error getcontactname ");console.log (e)}
    }

    // Limpiar los contactos
    clearContacts() {
        this._contacts = [];
        this._isInitialized = false;
    }
}

// Crear y exportar una única instancia
const contactsInstance = new ContactsManager();

export default contactsInstance;

// Object.freeze(contactsInstance); // Remove or comment out this line to allow internal property updates
