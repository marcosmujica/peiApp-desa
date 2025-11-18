import {db_addGroupByTicket, db_getLocalProfile, db_saveProfile, db_createIndexes, db_addUserConfig, db_addGroupUsers} from "./database"
import {GROUP_BY_TICKETS} from "./dataTypes"
import { getUId } from "./functions"
import {USER_PREFIX_GROUP, MAIN_GROUP_BY_COLLECT, MAIN_GROUP_BY_PAY, MAIN_GROUP_BY_INVESTMENT} from "./constants"

let _profile = {}

export function isMe(idUser)
{ return idUser == _profile.idUser ? true : false }

export async function initProfile ()
{
    try{
        _profile = await db_getLocalProfile() 
    }
    catch (e) { console.log (e)}
    return (_profile)
}
export function getProfile () { 
    return (_profile)
}

export async function setProfile (doc)
{

    _profile = doc
    return (await saveProfile())
}
export function isLogged ()
{return _profile && _profile.isLogged ? _profile.isLogged : false}

export async function saveProfile()
{
    return await db_saveProfile(_profile)
}

//mm - procedimiento principal que se invoca la primera vez que se crea un nuevo usuario para determinar las funciones iniciales
export async function firstLogging()
{

    // mm- DEBERIA ENVIAR UN MAIL DE BIENVENIDA
    // mm - DEBERIA NOTIFICAR A OTROS USUARIOS QUE SE AGREGO A LA COMUNIDAD

    //db_createIndexes()

    
}

export async function setInitGroupBy()
{

    let profile = await db_getLocalProfile ()

    ///// mm - agrego los grupos creados automaticamente
    let idGroup = USER_PREFIX_GROUP + getUId() // mm - defino el grupo principal pero no lo creo, solo lo uso para agregarle el subgrupo

    let groupBy = new GROUP_BY_TICKETS();
    groupBy.name = MAIN_GROUP_BY_COLLECT;
    groupBy.idTicketGroup = idGroup;
    groupBy.idUserCreatedBy = profile.idUser;
    groupBy.idUserOwner = profile.idUser;
    groupBy.isPrivate = true

    let status = await db_addGroupByTicket(groupBy);

    let idCollect = status.id;
    
    groupBy = new GROUP_BY_TICKETS();
    groupBy.name = MAIN_GROUP_BY_PAY;
    groupBy.idTicketGroup = idGroup;
    groupBy.idUserCreatedBy = profile.idUser;
    groupBy.idUserOwner = profile.idUser;
    groupBy.isPrivate = true

    status = await db_addGroupByTicket(groupBy);

    idPay = status.id;

    groupBy = new GROUP_BY_TICKETS();
    groupBy.name = MAIN_GROUP_BY_INVESTMENT;
    groupBy.idTicketGroup = idGroup;
    groupBy.idUserCreatedBy = profile.idUser;
    groupBy.idUserOwner = profile.idUser;
    groupBy.isPrivate = true

    status = await db_addGroupByTicket(groupBy);

    idInvestment = status.id;

    // mm -- obtengo el profile para actualizar los datos nuevos
    let aux = getProfile()
    aux.privateGroup = idGroup
    aux.privateGroupByCollect = idCollect
    aux.privateGroupByPay = idPay
    aux.privateGroupByInvestment = idInvestment

    await setProfile (aux)

}
