import { DB } from "./DB";
import {RATING, OTP, _ACCESS} from "./dataTypes"
import dbInstance from './dbInstance';
import {deepObjectMerge} from './functions';
import dbChanges from './DBChanges';
import {getProfile} from "../commonApp/profile"
import { EVENT_DB_CHANGE } from "./DBEvents";


export const db_OTP = "otp"
export const db_TICKET = "ticket"
export const db_LOCAL = "local"
export const db_TICKET_CHAT = "ticket_chat"
export const db_TICKET_LOG_STATUS = "ticket_log_status"
export const db_USER = "user"
export const db_GROUP = "group"
export const db_USER_ACCESS = "user_access"
export const db_PROFILE = "profile"
export const db_GROUP_TICKET = "group_ticket"
export const db_GROUP_BY_TICKET = "group_by_ticket"
export const db_HELPDESK = "helpdesk"
export const db_RATING = "ticket_rating"
export const db_TICKET_INFO = "ticket_info"
export const db_TICKET_VIEW = "ticket_view"
export const db_TICKET_REPEAT = "ticket_repeat"

const DB_URL = "http://34.39.168.70:5985"
const DB_USERNAME = "app_user";
const DB_PASSWORD = "app_password_2024";
//const DB_USERNAME = "admin_X9!fQz7#Lp4Rt8$Mh2";
//const DB_PASSWORD = "G@7hX!2$kP9^mQ4&rZ6*Ty1wVb";

// Obtener la instancia global de la base de datos
const _db = dbInstance.getDB();

export async function db_initListener()
{
    dbChanges.init ()
}

export async function db_getProfile ()
{
    try{
        let aux = await db_getAll(db_PROFILE)
        return (aux.length == 0 ? false : aux[0])
    }
    catch (e) {console.log ("Error db_getProfile")
        console.log (e)
    }
}

export async function db_addTicketRating (idTicket, rating)
{
 return await db_add(db_RATING, idTicket, new RATING(idTicket, rating))   
}

export async function db_addTicketInfo (data)
{    
 return await db_add(db_TICKET_INFO,null, data)
}

export async function db_getAllTicketRating ()
{
    return await db_getAll(db_RATING)
}

export async function db_updateTicketRating (idTicket, rating)
{
 return await db_updateDoc (db_RATING, idTicket, new RATING(idTicket, rating))   
}
export async function db_getTicketRating (idTicket)
{
    let aux = await db_find (db_RATING, {idTicket:idTicket})
    return (aux.length ==0 ? 0 : aux[0].rating)
}

export async function db_updateGroupUsers (id, data)
{return await db_updateDoc (db_GROUP_TICKET, id, data)}

export async function db_addTicket (idTicket, data)
{ return (await db_add (db_TICKET, idTicket, data))}

// mm - agrega un registro de asociacion entre tickets y grupos
export async function db_addGroupByTicket(id, data)
{return (await db_add (db_GROUP_BY_TICKET, id, data))}


export async function db_addGroupUsers (idGroup, data)
{return await (db_add (db_GROUP_TICKET, idGroup, data))}

export async function db_addUserConfig(id, doc)
{
    try{
        return (await db_add (db_USER, id, doc))
    }
    catch (e) { console.log ("Error en addUserConfig: "+ JSON.stringify(e))}
}

export async function db_getTicketChat(idTicket)
{ return (await db_find (db_TICKET_CHAT, {idTicket: idTicket}))}

export async function db_getTicketMsgChat(idTicket, idChat)
{ return (await db_find (db_TICKET_CHAT, {idTicket: idTicket, id:idChat}))}

export async function db_getTicketLog(idTicket)
{ return (await db_find (db_TICKET_LOG_STATUS, {idTicket:idTicket}))}

export async function db_getTicketLogByStatus(idTicket, idStatus, sortBy="TS", order="asc") // por defecto ordeno por TS
{    
    let results = await db_find(db_TICKET_LOG_STATUS, { idTicket: idTicket, idStatus: idStatus });
    if (Array.isArray(results) && results.length > 0) {
        results.sort((a, b) => {
            let aVal = a[sortBy];
            let bVal = b[sortBy];
            
            // Convertir a Date si es string de fecha
            if (typeof aVal === 'string') aVal = new Date(aVal);
            if (typeof bVal === 'string') bVal = new Date(bVal);
            
            // Convertir Date a timestamp
            if (aVal instanceof Date) aVal = aVal.getTime();
            if (bVal instanceof Date) bVal = bVal.getTime();
            
            // Usar 0 si es undefined/null
            aVal = aVal ?? 0;
            bVal = bVal ?? 0;
            
            return order === "asc" ? aVal - bVal : bVal - aVal;
        });
    }
    return results
}
//{ return (await db_find (db_TICKET_LOG_STATUS, {idTicket: {$eq: idTicket}, idStatus: {$eq: idStatus}}, ['_id', 'idUser', 'idStatus', 'TS', 'note', 'amount', 'message'], null, "", null))}

export async function db_addRepeatTicket (idRepeat, data)
{return (await db_add (db_TICKET_REPEAT, idRepeat, data))}   

export async function db_addTicketChat(data)
{return (await db_add (db_TICKET_CHAT, null, data))}   

export async function db_addTicketListItem(idTicket, data)
{return (await db_add (db_TICKET_VIEW, idTicket, data))}   

export async function db_getTicket(idTicket)
{return (await db_get (db_TICKET, idTicket))}   

export async function db_getTicketInfo(idTicket)
{return (await db_find (db_TICKET_INFO, {"idTicket" : idTicket}))}

export async function db_updateTicket (idTicket, data)
{ return (await db_updateDoc (db_TICKET, idTicket, data))}

export async function db_updateTicketListItem (idTicket, data)
{ return (await db_updateDoc (db_TICKET_VIEW, idTicket, data))}

export async function db_getTicketViewByTicketId (idTicket)
{
    let aux = await db_find (db_TICKET_VIEW, {idTicket:idTicket})
    if (aux!=false) return (aux[0])
    return false
}

export async function db_getTicketViewByIdUser (idUser)
{
    return await db_find (db_TICKET_VIEW, {idUserTo:idUser})
}

export async function db_getAllGroups ()
{ return await db_getAll (db_GROUP_TICKET)}

export async function db_getAllGroupsBy ()
{return await db_getAll (db_GROUP_BY_TICKET)}
export async function db_getGroupsByByIdGroup (idGroup)
{{return (await db_find (db_GROUP_BY_TICKET, {"idTicketGroup" : idGroup}))}}

export async function db_updateTicketInfo (idTicket, idUser, type, data)
{ 
    try {
        let aux = await db_find (db_TICKET_INFO, {idTicket: idTicket, idUser: idUser, type: type})
        if (!aux || aux.length == 0) return false
        const existing = aux[0]
        existing.info = deepObjectMerge (existing.info, data)
        await db_updateDoc (db_TICKET_INFO, existing.id,existing)
    }
    catch (e) { console.log (e);console.log ("Error db_updateTicketInfo: " + JSON.stringify(e)); return false }
}

export async function db_getAllTickets ()
{ return (await db_getAll (db_TICKET))}

export async function db_getAllTicketRepeat ()
{ return (await db_getAll (db_TICKET_REPEAT))}

export async function db_getAllTicketItem (data={})
{ return (await db_find (db_TICKET_VIEW, data))}

export async function db_getGroupInfo (id)
{ return (await db_get (db_GROUP_TICKET, id))}

export async function db_getGroupByInfo (id)
{ return (await db_get (db_GROUP_BY_TICKET, id))}

export async function db_getTicketsIdGroupBy (idGroupBy)
{ return (await db_find (db_TICKET, {idTicketGroupBy: idGroupBy}))}

export async function db_getTicketsViewIdGroupBy (idGroupBy)
{ return (await db_find (db_TICKET_VIEW, {idGroupBy: idGroupBy}))}

export async function db_saveProfile(profile)
{
    // mm - le cambio al id el + porque da problemas
   return await db_add (db_PROFILE, profile.phone.replace(/\+/g, ''), profile)
}

export async function db_saveLocal(doc)
{
    // mm - le cambio al id el + porque da problemas
   return await db_add (db_LOCAL, "local", doc)
}
export async function db_getLocal()
{
   let aux = await db_getAll (db_LOCAL)
   return aux.length ==0 ? false : aux
}
export async function db_setNewUser(id, data) {
    try {
        const result = await db_add(db_USER, id, data);
        // Actualizar la instancia global si es necesario
        const dbInfo = dbInstance.getDBByName(db_USER);
        if (dbInfo) {
            dbInstance.updateDBInstance(db_USER, { created: true });
        }
        return result;
    } catch(e) {
        console.error('Error en db_setNewUser:', e);
        return null;
    }
}

export async function db_checkOTP(phone, otp)
{
    try{
        let auxCheck  // mm - la definio por si da error en el try
        try 
        {
            let db = await getDbByName(db_OTP)
            auxCheck = await db_get(db_OTP, "otp" + phone )

            return (auxCheck["otp"] == otp && auxCheck["phone"] == phone ? true : false)
        }
        catch (e) {console.log (e)}
        return (false)
    }
    catch (e) {
        console.log (e)
        return (false)}
}

export async function db_setOTP(phone)
{
    let otp = String(Math.floor(1000 + Math.random() * 9000))

    console.log (otp)
    const aux = new OTP (phone, otp, new Date())
    await db_add (db_OTP, "otp" + phone, aux)    
}

export async function db_addHelpDesk (data)
{
    return (await db_add (db_HELPDESK, null, data))
}

export async function db_addTicketLogStatus(data)
{ return (await db_add (db_TICKET_LOG_STATUS, null, data))}

// mm - abro la bd, solo para que funcionen los listen por ej pero no se deberia usar para otra cosa
export async function db_openDB (dbName)
{ return getDbByName (dbName)}

export async function db_addDirect (base, id, data)
{ return db_add (base, id, data, false)
}
///// --------------------------

  // mm - obtiene la referencia a una base de datos segun el dbName y si no la encuentra la crea

async function db_add (base, id, data, sync = true)
{
    let dbAux = await getDbByName (base)
    return (await dbAux.add (data, id, sync))
}

async function getDbByName (dbName)
{
    let db = _db.find ( item => item.name == dbName)

    if (db == undefined) 
        { alert ("BASE " + dbName + " no encontrada en el array")
          return
        }

    if (db.created === false)
    {
        try{
            console.log(`[database] Creando nueva instancia de DB para: ${db.name}`);
            let aux = new DB(db.name, { couchUrl: DB_URL, username: DB_USERNAME, password: DB_PASSWORD, isRemote: db.syncSide=="REMOTE" ? true : false, indices: db.index, emitEvent: db.emitEvent, filterArray: db.filterArray, syncInterval: db.syncInterval })
            await aux.initDB()
            db.created = true
            db.dbLocal = aux
            console.log(`[database] ✓ DB ${db.name} creada exitosamente`);
            return db.dbLocal
        }
        catch(e) {
            console.error(`[database] ❌ Error creando ${dbName}:`, e);
            db.created = false
            db.dbLocal = undefined
            throw e; // Re-lanzar el error para que el caller lo maneje
        };

    }

    // Verificar que la instancia sigue siendo válida
    if (!db.dbLocal || !db.dbLocal.db) {
        console.warn(`[database] Instancia de ${dbName} inválida, reinicializando...`);
        db.created = false;
        return await getDbByName(dbName); // Reintentar creación
    }

    return db.dbLocal
}

async function db_updateDoc (dbName, id, docNew)
{
    try{

        let db= await getDbByName (dbName)
        let doc = await db.getWithHeader(id)
        if (doc==false) { return false}
        return await db.update(id, docNew, doc._rev);
    }
    catch (e) {
        console.log (e);console.log ("Error update: " + JSON.stringify(e))}
}

async function db_getAll (base){
    try
    {
        let aux =   await getDbByName (base)
        // mm - devuelvo el campo data de los registros
        return await aux.getAll ()
        
        
    }
    catch (e) {console.log ("Error db_getAll: " + JSON.stringify(e))}
 }
// mm - busco los campos del objeto en la base de datos 
async function db_find (base, dataSearch)
{
    let aux = await getDbByName (base)
    return (await aux.find (dataSearch))
}

 async function db_get (base, id)
 {
    try
    {
        let aux = await getDbByName (base)
        return await aux.get (id)
    }
    catch (e) {console.log ("Error db_get: " + JSON.stringify(e))}
 }
