
import { Platform } from 'react-native';

// mm constantes del sistema

//const _url_set_OTP = "http://2390jkjkjk3kdlkslkk!443ddkASD:fdvkjjklrljkdlfsklkk93498502)()99Z88@localhost:3000"
//const _url_check_OTP = "http://2390jkjkjk3kdlkslkk!443ddkASD:fdvkjjklrljkdlfsklkk93498502)()99Z88@localhost:3000"

// Para desarrollo, usa tu IP local. Ejemplo: "192.168.1.100"
// Para producción, usa tu dominio real
const DEV_IP = Platform.OS === 'web' ? 'localhost' : '10.102.2.77'; // Cambia esto por tu IP local

export const URL_AVATAR_IMG = `http://34.39.168.70:3000/uploads/`
export const URL_FILE_UPLOAD = `http://34.39.168.70:3000/upload/`
export const URL_AVATAR_IMG_UPLOAD = `http://34.39.168.70:3000/upload/`
export const URL_FILE_DOWNLOAD = `http://34.39.168.70:3000/uploads/`
export const URL_FILE_AVATAR_PREFIX = `avatar__`
export const URL_FILE_SMALL_PREFIX = `small__`
export const URL_FILE_NORMAL_PREFIX = `normal__`

export const MAIN_GROUP_BY_COLLECT = "Cobrados"
export const MAIN_GROUP_BY_PAY = "Pagados"
export const MAIN_GROUP_BY_INVESTMENT = "Inversiones"


// mm - frecuencia de renovacion
export const TICKET_FRECUENCY = [
  {code: "daily", name: "Diariamente"},
  {code: "onceAWeek", name: "Una vez por semana"},
  {code: "monthly", name: "Mensualmente"},
  {code: "annual", name: "Anualmente"}
]

export const TICKET_INFO_TYPE_PAY_PLANNED= "planned"
export const TICKET_INFO_TYPE_PAY_IMPULSIVED ="impulsived"
export const TICKET_INFO_TYPE_PAY_UNEXPECTED ="unexpected"

// mm - el tipo de ticket
export const TICKET_TYPE_SINGLE = "single"
export const TICKET_TYPE_RECURRENT = "recurrent"

/// mm - si existen distintos tipos de tickets
export const TICKET_TYPE_TICKET = "ticket"

export const TICKET_TYPE_PAY = "pay"
export const TICKET_TYPE_COLLECT = "collect" // mm - cobrar

export const TICKET_INFO_TYPE_PAY = "payInfo"
export const TICKET_INFO_TYPE_COLLECT = "collectInfo"
export const TICKET_INFO_TYPE_USE_TYPE = "useType"

export const TICKET_STATUS_OPEN = "OPEN"
export const TICKET_STATUS_CLOSED = "CLOSED"

export const TICKET_DETAIL_DEFAULT_STATUS = "PENDING"
export const TICKET_DETAIL_ACCEPTED_STATUS = "ACCEPTED"
export const TICKET_DETAIL_CANCELED_STATUS = "CANCELED"
export const TICKET_DETAIL_REJECTED_STATUS = "REJECTED"
export const TICKET_DETAIL_DISPUTE_STATUS = "DISPUTE"
export const TICKET_DETAIL_CHANGE_DUE_DATE_STATUS = "CHANGE_DUE_DATE"
export const TICKET_DETAIL_DUE_DATE_STATUS = "CHANGE_DUE_DATE"
export const TICKET_DETAIL_PAY_STATUS = "PAY"
export const TICKET_DETAIL_PAYED_STATUS = "PAYED"
export const TICKET_DETAIL_CLOSED_STATUS = "CLOSED"

export const TICKET_LOG_DETAIL_TYPE_STATUS = "status"
export const TICKET_LOG_DETAIL_TYPE_CHANGE_DATA = "change_data"

export const TICKET_LOG_DETAIL_TYPE_CHANGE_DATA_NAME = "name"
export const TICKET_LOG_DETAIL_TYPE_CHANGE_DATA_DESC = "description"
export const TICKET_LOG_DETAIL_TYPE_CHANGE_DATA_DESC_PRIVATE = "description_private"
export const TICKET_LOG_DETAIL_TYPE_CHANGE_DATA_AMOUNT = "amount"
export const TICKET_LOG_DETAIL_TYPE_CHANGE_DATA_REF = "ref"
export const TICKET_LOG_DETAIL_TYPE_CHANGE_DATA_PAY_INFO = "payInfo"

export const TICKET_DETAIL_STATUS = [
  { code: TICKET_DETAIL_DEFAULT_STATUS, name:"Pendiente", system: true, user: false, admin: false, editable:false},
  { code: TICKET_DETAIL_ACCEPTED_STATUS, name:"Aceptado", system: false, user: true, admin: false, editable: false},
  { code: TICKET_DETAIL_REJECTED_STATUS, name:"Rechazado", system: false, user: true, admin: false, editable: true},
  { code: TICKET_DETAIL_PAY_STATUS, name:"Pago", system: false, user: true, admin: true, editable: true},
  { code: TICKET_DETAIL_PAYED_STATUS, name:"Pagado / Cumplido", system: false, user: true, admin: true, editable: true},
  { code: TICKET_DETAIL_DUE_DATE_STATUS, name:"Vencido", system: true, user: false, admin: true, editable: false},
  { code: TICKET_DETAIL_CANCELED_STATUS, name:"Cancelado", system: false, user: false, admin: true, editable: false},
  { code: TICKET_DETAIL_CHANGE_DUE_DATE_STATUS, name:"Cambia Vencimiento", system: false, user: true, admin: true, editable: true},
  { code: TICKET_DETAIL_DISPUTE_STATUS, name:"En disputa", system: false, user: true, admin: true, editable: true},
  { code: TICKET_DETAIL_CLOSED_STATUS, name:"Cerrado", system: false, user: true, admin: true, editable: false},

].sort ((a,b) => a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1);

export const USER_PREFIX_USER = "u-"
export const USER_PREFIX_PHONE = "p-"
export const USER_PREFIX_GROUP = "g-"
export const USER_PREFIX_GROUP_BY = "gb-"

export const USER_TYPE_USER = "USER"
export const USER_TYPE_PHONE = "PHONE"

export const TICKET_USE_TYPE_PERSONAL = "personal"
export const TICKET_USE_TYPE_BUSINESS = "business"
export const TICKET_USE_TYPE_SHARED = "shared"

export const EXPENSES_CATEGORY = [
  {"code": "VI", "name": "Vivienda", "purchaseType": "needed"},
  {"code": "AL", "name": "Alimentación", "purchaseType": "needed"},
  {"code": "TR", "name": "Transporte", "purchaseType": "needed"},
  {"code": "SA", "name": "Salud", "purchaseType": "needed"},
  {"code": "ED", "name": "Educación", "purchaseType": "needed"},
  {"code": "EN", "name": "Entretenimiento", "purchaseType": "optional"},
  {"code": "CU", "name": "Cuidado Personal", "purchaseType": "optional"},
  {"code": "SU", "name": "Suscripciones", "purchaseType": "optional"},
  {"code": "AH", "name": "Ahorros e inversiones", "purchaseType": "needed"},
  {"code": "MA", "name": "Mascotas", "purchaseType": "optional"},
  {"code": "VI", "name": "Viajes y Vacaciones", "purchaseType": "optional"},
  {"code": "DE", "name": "Intereses / Recargos ", "purchaseType": "needed"},
  {"code": "DE", "name": "Gastos del Banco / Tarjetas / Billetera", "purchaseType": "needed"},
  {"code": "OT", "name": "Otros / Imprevistos", "purchaseType": "optional"}
].sort ((a,b) => a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1);

export const PAY_METHOD = [
  {id:0, "code": "CREDIT_CARD", "name": "Tarjeta de Crédito"},
  {id:1, "code": "DEBIT_CARD", "name": "Tarjeta de Débito"},
  {id:2, "code": "BANK_TRANSFER", "name": "Transferencia Banco"},
  {id:3, "code": "PHYSICAL_LOCATION", "name": "Pago en local de cobranza"},
  {id:4, "code": "CASH", "name": "Pago en efectivo"},
  {id:5, "code": "DIGITAL_WALLET", "name": "Billetera digital"}
].sort ((a,b) => a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1)

export const AREA_OF_WORK_LIST = [
        {"code": "DS", "name": "Diseño Gráfico"},
        {"code": "WD", "name": "Desarrollo Web"},
        {"code": "MD", "name": "Marketing Digital"},
        {"code": "HE", "name": "Herrería"},
        {"code": "SA", "name": "Sanitario"},
        {"code": "EL", "name": "Electricista"},
        {"code": "TR", "name": "Traducción"},
        {"code": "FC", "name": "Fotografía Comercial"},
        {"code": "VE", "name": "Videoedición"},
        {"code": "CW", "name": "Copywriting"},
        {"code": "CG", "name": "Consultoría Gerencial"},
        {"code": "FP", "name": "Finanzas Personales"},
        {"code": "CE", "name": "Coaching Ejecutivo"},
        {"code": "AR", "name": "Arquitectura"},
        {"code": "ID", "name": "Ilustración Digital"},
        {"code": "PT", "name": "Entrenador Personal"},
        {"code": "NC", "name": "Nutrición y Coaching"},
        {"code": "PS", "name": "Psicoterapia"},
        {"code": "CO", "name": "Contabilidad"},
        {"code": "DJ", "name": "Diseño de Joyas"},
        {"code": "CM", "name": "Community Management"},
        {"code": "SD", "name": "Desarrollo de Software"},
        {"code": "DI", "name": "Diseño de Interiores"},
        {"code": "AP", "name": "Asesoría Legal (Abogacía)"},
        {"code": "ED", "name": "Edición de Video"},
        {"code": "PD", "name": "Productor Audiovisual"},
        {"code": "GD", "name": "Diseño de Videojuegos"},
        {"code": "DA", "name": "Diseño 3D y Animación"},
        {"code": "RB", "name": "Redacción de Blogs"},
        {"code": "CD", "name": "Diseño de Moda"},
        {"code": "TC", "name": "Terapia Corporal"},
        {"code": "PL", "name": "Pilates"},
        {"code": "YC", "name": "Yoga Coaching"},
        {"code": "MM", "name": "Música y Producción"},
        {"code": "TD", "name": "Dependiente"},
        {"code": "TI", "name": "Independiente"},
        {"code": "AD", "name": "Diseño Arquitectónico"},
        {"code": "CN", "name": "Consultoría"},
        {"code": "EC", "name": "Educación en Línea"},
        {"code": "GC", "name": "Gestión de Contenidos"},
        {"code": "BD", "name": "Bases de Datos"},
        {"code": "AI", "name": "Inteligencia Artificial"},
        {"code": "SE", "name": "Seguridad Informática"},
        {"code": "MA", "name": "Mecánica Automotriz"},
        {"code": "CL", "name": "Consultoría en Logística"},
        {"code": "OT", "name": "Otro"}
      ].sort ((a,b) => a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1);

    export const SEX_LIST = 
      [{codigo: "F", name: "Femenino" },{ codigo: "M", name: "Masculino" },{ codigo: "O", name: "Otro" }]

    export const SEX_DEFAULT = "O"


