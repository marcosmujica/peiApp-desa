import {TICKET_FRECUENCY_MONTHLY, TICKET_REPEAT_STATUS_PAUSED, TICKET_INFO_TYPE_COLLECT, TICKET_USE_TYPE_PERSONAL, TICKET_LOG_DETAIL_TYPE_STATUS, TICKET_DETAIL_DEFAULT_STATUS, TICKET_TYPE_COLLECT, TICKET_TYPE_SINGLE, TICKET_INFO_TYPE_PAY, TICKET_INFO_TYPE_USE_TYPE, TICKET_INFO_TYPE_PAY_PLANNED} from "./constants";
import { getBigUId, getUId } from './functions';


export class GROUP_TICKETS {
  constructor()
  {
    this.id = ""
    this.name = ""
    this.avatar = ""
    this.groupUsers = []
    this.idUserOwner = ""
    this.idUserCreatedBy = ""
    this.TSCreated = new Date()
    this.TSLastUpdate = new Date()
    this.isSendMsgToGroup = false // mm  - si puede enviar mensajes al grupo
    this.isViewTicketList = false // mm - si puede ver la lista de deudas del resto de los usuarios
    this.isUserAddTicket = false // mm - si los usuarios pueden tickets o no
    this.isViewMember = false // mm - si pueden ver la lista de miembros
    this.lastMsg = "" // mm - ultimo mensaje enviado al grupo
    Object.seal(this);
  }
}

export class RATING {
  constructor (idTicket, rating)
  {
    this.idTicket =idTicket
    this.rating = rating
    Object.seal(this);
  }
}

// mm - agrupacion de tickets por un concepto, el groupby esta asociado a un grupo
export class GROUP_BY_TICKETS {
  constructor()
  {
    //this.idTicketGroupBy = ""
    this.id = ""
    this.name = ""
    this.idTicketGroup = ""
    this.groupUsers = []
    this.idUserOwner = ""
    this.idUserCreatedBy = ""
    this.TSCreated = new Date()
    this.TSLastUpdate = new Date()
    this.lastMsg = "" // mm - uñtimo mensaje enviado al grupo
    this.status = "OPEN"
    this.isPrivate = false // mm - si el grupo es para uso interno 
    Object.seal(this);
  }
}

export class TICKET_REPEAT{
  constructor()
  {
    this.idTicketRepeat = getUId()
    this.status = TICKET_REPEAT_STATUS_PAUSED
    this.frecuency = TICKET_FRECUENCY_MONTHLY
    this.TSStart = new Date(),
    this.TSEnd = new Date(),
    this.confirmed = false // mm - si el usuario confirmo la nueva repeticion
    this.TSNextDueDate = new Date()
    this.TSLastExecution = new Date()
    this.groupUsers = []
    this.idUserFrom = "", //mm - quien origina el ticket
    this.idUserCreatedBy = "", // mm - id del usuario que creo el ticket
    this.name = ""
    this.ticket = {
      type : "ticket", // mm - tipo de ticket
      idTicketGroup: "", // mm - id del grupo a quien pertenece el usuario que creo el ticket
      idTicketGroupBy: "", // mm - para agrupar los ticket por este id para saber el grupo de tickets que se crearon a partir de este
      currency : "", // mm - moneda del ticket
      amount : 0, // mm - monto actual del ticket por si cambio 
      netAmount : 0,  // mm - ganancia neta del ticket, sacando los gastos
      useType : TICKET_USE_TYPE_PERSONAL, // mm - si el ticket es personal, para el negocio o se comparte
      purchaseType : "undefined", // mm - si la compra es necesaria o impulsiva
      collectionProcedure : true, // mm - si se tiene que ejecutar un metodo de cobro para el ticket
      way : TICKET_TYPE_COLLECT, // mm - si el ticket es de cobro o de pago
      ticketType : TICKET_TYPE_SINGLE,  /// mm - si es de un ticket recurrente o uno solo
      title : "", // mm - titulo del ticket
      note : "", // mm - descripcion del ticket
      notePrivate : "", // mm - descripcion privada del ticket, para guardar informacion que solo ve el creador
      metadata : {
        notes: "", // mm - info general del ticket
        externalReference: "" // mm - referencia externa del ticket por ej factura_001
      },
      paymentInfo : {
        paidAt: "", 
        paymentMethod: "", // mm - metodo del pago credito, debito, cash, etc
        transactionId: "" // mm - id de la transaccion 
      }
  }
    Object.seal(this);
  }
}

export class TICKET_INFO_PAY {
  constructor ()
  {
    this.idTicket = "",
    this.type = TICKET_INFO_TYPE_PAY
    this.idUser= "",
    this.info= { expensesCategory: "",
      type: TICKET_INFO_TYPE_PAY_PLANNED
     }
     Object.seal(this);
  }
}   
export class TICKET_INFO_COLLECT {
  constructor ()
  {
    this.idTicket="",
    this.type = TICKET_INFO_TYPE_COLLECT
    this.idUser="",
    this.info= { billsAmount: 0, billsNote: "", areaWork: "" }
    Object.seal(this);
  }
}
   
// mm- si se usa para personal negocio o compartido
export class TICKET_INFO_USE_TYPE {
  constructor ()
  {
    this.idTicket="",
    this.type = TICKET_INFO_TYPE_USE_TYPE
    this.idUser="",
    this.info = {useType: TICKET_USE_TYPE_PERSONAL}
    Object.seal(this);
  }
}
   
export class TICKET_LOG_DETAIL_STATUS {
  constructor() 
  {
    this.idTicket = ""
    this.type = TICKET_LOG_DETAIL_TYPE_STATUS // mm - tipo de log de datos
    this.idStatus = "" 
    this.TS = new Date()
    this.TSDueDate = new Date() // mm - fecha de vencimiento al que se pasa
    this.note = "" // mm - por si quiere agregar algo al cambiar de estado
    this.message = ""
    this.idUserFrom = "" // mm - quien genera el estado
    this.idUserTo = "" // mm - que otro usuario va a ver el estado, es mas que nada para poder filtrar los eventos
    this.isPrivate = false // mm - si el estado solo puede verlo el creador
    this.data = {
        currency : "",
        amount : 0,
        payMethod : "",
        uri: "", // mm - si se adjunta un document
        mediaType : "", // mm - tipo del archivo
        dueDate : new Date(),
        TSPay: new Date() 
    } // mm- se guarda informacion estructurura del estado
    Object.seal(this);
  }
}

export class HELP_DESK {
  constructor (){
    this.idUser = ""
    this.comment = ""
    this.ts = new Date()
  }
}

export class TICKET {
  constructor()
  {
    this.idTicket = "" 
    this.externalIdTicket = getBigUId () // mm - id del ticket dificil de leer
    this.type = "ticket" // mm - tipo de ticket
    this.idTicketGroup = "" // mm - id del grupo a quien pertenece el usuario que creo el ticket
    this.idTicketGroupBy = "" // mm - para agrupar los ticket por este id para saber el grupo de tickets que se crearon a partir de este
    this.idUserFrom = "" //mm - quien origina el ticket
    this.idUserTo = "" // mm - a quien se le origina el ticket
    this.idUserCreatedBy = "" // mm - id del usuario que creo el ticket
    this.isOpen = false // mm - si esta en uso o cerrado
    this.TSClosed = new Date() // mm - fecha/hoera de cuando se cerro el ticket
    this.idUserClosed = "" // mm - id del usuario que cierra le ticket
    this.TSCreated = new Date() // mm - fecha/hora de creacion del ticket
    this.currency = "" // mm - moneda del ticket
    this.initialAmount = 0 // mm - monto inicial del ticket porque puede cambiar despues
    this.amount = 0 // mm - monto actual del ticket por si cambio 
    this.netAmount = 0  // mm - ganancia neta del ticket, sacando los gastos
    this.idTicketRepeat = "" // mm - si se creo desde repeat
    this.seq = 0 // mm - id de la secuenncia del ticket cuando es recurrente
    this.lastMsg = "" // mm - ultimo mensaje enviado 
    this.useType = TICKET_USE_TYPE_PERSONAL // mm - si el ticket es personal, para el negocio o se comparte
    this.purchaseType = "undefined" // mm - si la compra es necesaria o impulsiva
    this.collectionProcedure = true // mm - si se tiene que ejecutar un metodo de cobro para el ticket
    this.way = TICKET_TYPE_COLLECT // mm - si el ticket es de cobro o de pago
    this.ticketType = TICKET_TYPE_SINGLE  /// mm - si es de un ticket recurrente o uno solo
    this.title = "" // mm - titulo del ticket
    this.note = "" // mm - descripcion del ticket
    this.notePrivate = "" // mm - descripcion privada del ticket, para guardar informacion que solo ve el creador
    this.initialTSDueDate = new Date() // mm - cuando vence el ticket
    this.source = "app" // mm - por que medio se creo el ticket, por ej desde api externa
    this.sourceInfo = "" // mm - info puntual que el source quiera agregar
    this.document = { 
      mediaType: "",
      uri: ""} // mm - documento attach, por ejemplo registro del ticket
    this.metadata = {
      notes: "", // mm - info general del ticket
      externalReference: "" // mm - referencia externa del ticket por ej factura_001
    }
    this.paymentInfo = {
      paidAt: "", 
      paymentMethod: "", // mm - metodo del pago credito, debito, cash, etc
      transactionId: "" // mm - id de la transaccion 
    }
    Object.seal(this);
  }
}

export class TICKET_CHAT {
  constructor(){
    this.type = "message";
    this.id = getUId();
    this.idTicket = "";
    this.idUserFrom = ""; // mm - id de usuario que envia el mensaje
    this.idUserTo = ""; // mm - id de usuario que reciibe  el mensaje
    this.message = "";
    this.localUri = ""; // mm - nombre del archivo local
    this.filename = ""; // mm - nombre del archivo remoto
    this.mediaType = ""; // mm - tipo de archivo
    this.size = "";
    this.TSSent = new Date();
  }
}

// mm - como guardo a los usurios para mostrarlos mas rapidos sena usuario o contactos
export class USER_VIEW_LIST{
  constructor()
  {
    this.genericId = "" // mm - el id generico, puede ser usuario o contacto
    this.id = "" // mm - si e sun usuario ya registrado , el id del usuario
    this.name = ""
    this.avatar = ""
    this.userType = "" // mm - si es usuario, contacto, etc
  }
} 
export class USER {
  constructor() {
    this.id = ""; // mm - id generado por la base de datos
    this.internalId = "" // mm - numero unico generado localmente
    this.name = "";
    this.subject = ""; // mm - texto corto del estado del usuario
    this.email = "";
    this.about = ""
    this.web = "" //mm - direccion del sitio web del usuario
    this.instagram = "" //mm - cuenta de instragram del usuario
    this.tiktok = "" //mm - cuenta de tiktok del usuario
    this.tsCreate = new Date();
    this.payMethodInfo = ""
    this.pin = ""
    this.avatar = ""
    this.isActive = false
    this.isValidated = false
    this.phone = ""
    this.gender = ""
    this.userAgent = ""
    this.phonePrefix = ""
    this.countryCode = ""
    this.areaWorksList = []
    this.sex = ""
    this.config = new USER_CONFIG()
  }
}

export class USER_ACCESS {
  constructor()
  {
    this.idUser = ""
    this.TS = new Date()
    this.userAgent = ""
  }
}

export class LOCAL{
  constructor (){
    this.idUser = ""
    Object.seal(this)
  }
}

export class PROFILE {
  constructor() {
    this.idUser = ""
    this.externalId = getBigUId(); // mm - id unico que se utiliza para referenciar al usuario desde afuera
    this.name = "";
    this.about = ""
    this.email = ""
    this.isActive = false 
    this.isValidated = false
    this.phone = ""
    this.countryCode = ""
    this.phonePrefix = ""
    this.countryName = ""
    this.isLogged = false // mm - si el usuario llego a crearse
    this.defaultCurrency = "USD"
    this.areaWorksList = []
    this.payMethodInfo = ""
    this.sex = ""
    this.profile = ""
    this.privateGroup = ""
    this.privateGroupByCollect = ""
    this.privateGroupByPay = ""
    this.privateGroupByInvestment = ""
    this.notificationToken = ""
    this.config = new USER_CONFIG()

    Object.seal(this);
  }
}

export class OTP {
  constructor(phone, otp, ts) {
    this.phone = phone;
    this.otp = otp;
    this.ts = new Date();
  }
}

export class TICKET_LIST_ITEM { // mm - type para los mensajes que se muestran en home
  constructor ()
  {
    this.idTicket = ""
    this.title = ""
    this.amount = 0
    this.currency = ""
    this.way = ""
    this.idGroup = ""
    this.idGroupBy = ""
    this.idUserTo = "" // mm - a quien le corresponde el ticket sin sea al usuario logueado
    this.idUserCreatedBy = ""
    this.lastMsg = ""
    this.status = ""
    this.statusText = ""
    this.isOpen = false
    this.seen = false
    this.ts = new Date()
    this.unread = 0
    this.changeSource = "" // mm - id desde donde se hizo el ultimo cambio
    this.deleted = false
    this.dueDate = new Date()
    this.rating = 0
    this.expensesCategory = ""
    this.useType = "" // mm - si el ticket es personal, para el negocio o se comparte
    this.purchaseType = ""

    Object.seal(this);
  }
}

export class CONTACT {
  constructor()
  {
    this.id = "",
    this.img = "", 
    this.name = "",
    this.phone = "",
    this.status = ""
  }
}

export class USER_CONFIG {
  constructor()
  {
    this.notifications =
    {
      ticket_status_changes : true,
      ticket_duedate: true, // mm - avisar cuando hay tickets vencidos
      ticket_new: true // mm - cuando se asocia un nuevo ticket
    }
  }
}

export class DB_EVENT {
  constructor()
  {
    this.table = ""
    this._id = ""
    this.seq = ""
    this._rev = ""
    this.data = {}
    this.source = "" // mm - si es local o remoto desde donde se genera la info
  }
}

// mm - obtengo en un array de valores los valores que tiene una clase
export function getObjVarList(obj) {
  let aux = {}
  Object.entries(obj).forEach(([clave, valor]) => { aux[clave] = valor});
  return aux;
}
