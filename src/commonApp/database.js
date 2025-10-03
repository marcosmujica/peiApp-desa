import { DB } from "./DB";
import {DB_REMOTE, RATING, OTP, LOCAL_PROFILE, USER, _ACCESS} from "./dataTypes"
import { getProfile } from './profile';
import { Platform } from 'react-native';
import dbInstance from './dbInstance';


export const db_OTP = "otp"
export const db_TICKET = "ticket"
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

//_urlRemoteDB = "http://localhost:5984"
const _urlRemoteDB = "http://192.168.68.53:5984"

// Obtener la instancia global de la base de datos
const _db = dbInstance.getDB();

export async function db_getLocalProfile ()
{
    try{
        let aux = await db_get(db_PROFILE, "profile")
        if (aux == false)
        {
            let auxProfile = new LOCAL_PROFILE()
            await db_add(db_PROFILE, "profile", auxProfile)
            return (auxProfile)
        }    
        return (aux)
    }
    catch (e) {console.log ("Error db_getLocalProfile: " + JSON.stringify(e))
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

export async function db_updateTicketRating (idTicket, rating)
{
 return await db_updateDoc (db_RATING, idTicket, new RATING(idTicket, rating))   
}
export async function db_getTicketRating (idTicket)
{
 let aux = await db_getAll (db_RATING)
 if (!aux) return 0

 let aux2 = aux.find ((item) => item.idTicket == idTicket)
 return (aux2 == undefined ? 0 : aux2.rating)
}

export async function db_getTicketInfo (idTicket)
{  let data = await db_find (db_TICKET_INFO, {idTicket: idTicket})
  return data.map (item=>item.data)
}

export async function db_updateGroupUsers (id, data)
{return await db_updateDoc (db_GROUP_TICKET, id, data)}

export async function db_addTicket (data)
{ return (await db_add (db_TICKET, null, data))}

// mm - agrega un registro de asociacion entre tickets y grupos
export async function db_addGroupByTicket(data)
{return (await db_add (db_GROUP_BY_TICKET, null, data))}


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
{ let data = await db_find (db_TICKET_CHAT, {idTicket: idTicket})
  return data.map (item=>item.data)}

export async function db_getTicketLog(idTicket)
//{ return (await db_find (db_TICKET_LOG_STATUS, {idTicket: {$eq: idTicket}}, ['_id', 'idUser', 'idStatus', 'TS', 'note', 'currency', 'amount', 'message'], null, "", null))}
{ let aux = await db_getAll (db_TICKET_LOG_STATUS)
  if (aux != [])
    { aux = aux.filter((item)=> item.idTicket == idTicket)}
  return aux
}

export async function db_getTicketLogByStatus(idTicket, idStatus, sortBy="TS", order="asc") // por defecto ordeno por TS
{    
    let results = await db_find(db_TICKET_LOG_STATUS, { idTicket: idTicket, idStatus: idStatus });
    results = results.map (item=>item.data)
    if (Array.isArray(results) && results.length > 0) {
        if (order === "asc") {
            results.sort((a, b) => (a[sortBy] ?? 0) - (b[sortBy] ?? 0));
        } else if (order === "desc") {
            results.sort((a, b) => (b[sortBy] ?? 0) - (a[sortBy] ?? 0));
        };
    }
    return results
}
//{ return (await db_find (db_TICKET_LOG_STATUS, {idTicket: {$eq: idTicket}, idStatus: {$eq: idStatus}}, ['_id', 'idUser', 'idStatus', 'TS', 'note', 'amount', 'message'], null, "", null))}

export async function db_addTicketChat(data)
{return (await db_add (db_TICKET_CHAT, null, data))}   

export async function db_getTicket(idTicket)
{return (await db_get (db_TICKET, idTicket))}   

export async function db_updateTicket (idTicket, data)
{ return (await db_updateDoc (db_TICKET, idTicket, data))}

export async function db_getAllTickets ()
{ return (await db_getAll (db_TICKET))}

export async function db_getGroupInfo (id)
{ return (await db_get (db_GROUP_TICKET, id))}

export async function db_saveProfile(profile)
{
    return await db_updateDoc (db_PROFILE, "profile", profile)
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
            auxCheck = await db_get(db_OTP, "otp" )

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
    await db_add (db_OTP, "otp", aux)    
}

export async function db_addHelpDesk (data)
{
    return (await db_add (db_HELPDESK, null, data))
}

export async function db_addTicketLogStatus(data)
{ return (await db_add (db_TICKET_LOG_STATUS, null, data))}


///// --------------------------

  // mm - obtiene la referencia a una base de datos segun el dbName y si no la encuentra la crea

async function db_add (base, id, data)
{
    let dbAux = await getDbByName (base)
    return (await dbAux.add (data, id))
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
            // mm - si es local o sync siempre tengo que crear una base de datos local
            let aux = new DB({name:dbName, type: db.syncSide, index: db.index})
            await aux.initDB()
            db.created = true
            db.dbLocal = aux
            return db.dbLocal
        }
        catch(e) {
              console.log('❌ Error getDBByName:', e);
            db.created = false
            return
        };

    }

    return db.dbLocal
}

async function db_updateDoc (dbName, id, docNew)
{
    try{

        let db= await getDbByName (dbName)
        let doc = await db.getWithHeader(id)
        
        if (doc==false) { return false}
        // mm - actualizo el campo enviado
        //Object.keys(docNew).forEach(key => {
        //    doc.data[key] = docNew[key];
        //});
        doc = {...doc, ...docNew}
        doc._rev = docNew._rev
        return await db.update(id, doc);
    }
    catch (e) {console.log ("Error update: " + JSON.stringify(e))}
}

async function db_getAll (base){
    try
    {
        let aux =   await getDbByName (base)
        // mm - devuelvo el campo data de los registros
        let records = await aux.getAll ()
        return records.map(item => ({ ...item.data, id: item.id }))
        
    }
    catch (e) {console.log ("Error db_getAll: " + JSON.stringify(e))}
 }
// mm - busco los campos del objeto en la base de datos 
async function db_find (base, dataSearch)
{
    let aux = await getDbByName (base)
    return aux.find (dataSearch)
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
