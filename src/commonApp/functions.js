import { TICKET } from "./dataTypes";
import { v4 as uuidv4 } from 'uuid';
import { URL_FILE_UPLOAD} from "./constants"
import { Platform } from "react-native";

export const getUId = () => {return uuidv4()}

export const formatDateToText = (dateString) => {
  let diff = diasEntreFechas (new Date(dateString), new Date())
  return (diff == 0 ? "Hoy" : diff == 1 ? "Mañana" : diff == -1 ? "Ayer" : new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric'}).format(new Date(dateString)))
};

export const formatDateToYYYYMMDD = (date) => {
    return (date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, '0') + "-" + String(date.getDate()).padStart(2, '0'));
};

export const formatDateToStringLong = (dateString) => {
  return new Date(dateString).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

export function sleep(ms) { // mm - hace una pausa de ms
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function getMinValue(arr, property) {
  return Math.min(...arr.map(item => item[property]));
}

export function sumDays (dias, fecha = new Date())
{
  return (fecha.setDate(fecha.getDate() + dias));
}
export function getMaxValue(arr, property) {
    if (!arr || arr.length === 0) return null;
    return Math.max(...arr.map(item => item[property]));
}

function sum(arr, campo) {
  if (!Array.isArray(arr) || arr.length === 0) return 0;

  return arr.reduce((acumulador, obj) => {
    const valor = parseFloat(obj[campo]) || 0;
    return acumulador + valor;
  }, 0);
}

export const formatNumber = (num) => {
  const parts = num.toString().split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return parts.join(',');
};
export function diasEntreFechas(fecha1, fecha2 = new Date()) {
  const f1 = new Date(fecha1);
  const f2 = new Date(fecha2);
  const utc1 = Date.UTC(f1.getFullYear(), f1.getMonth(), f1.getDate());
  const utc2 = Date.UTC(f2.getFullYear(), f2.getMonth(), f2.getDate());
  const msPorDia = 1000 * 60 * 60 * 24;
  return Math.floor((utc2 - utc1) / msPorDia) * -1
}

export const validateEmail = (email) => {
  // Expresión regular simple para validar email
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const validateNumeric = (number) =>
{
  const regex = /^\d+$/;
  return regex.test (number) 
}

// mm - creo un nuevo ticket con los datos basicos de un ticket existente pasado como parametro
export const duplicateTicket= ( ticket)=>
{
  let aux = new TICKET()

  aux.idTicketGroupBy = ticket.idTicketGroupBy // mm - para agrupar los ticket por este id para saber el grupo de tickets que se crearon a partir de este
  aux.idUser = ticket.idUser //mm - usuario al cual pertenece el ticket
  aux.idUserCreatedBy = ticket.idUserCreatedBy 
  aux.idTicketGroup = ticket.idTicketGroup
  aux.type = ticket.type
  aux.currency = ticket.currency
  aux.initialAmount = ticket.amount // mm - monto inicial del ticket porque puede cambiar despues
  aux.amount = ticket.amount
  aux.netAmount = ticket.netAmount  // mm -!!! hay que poner otro campo para las perdidas del ticket, cuanto se gasto
  aux.pay = {
    expensesCategory: ticket.pay.expensesCategory
  }
  aux.collect = {
    areaWork: ticket.collect.areaWork, // mm - a que area de trabajo se asigna el ticket
    billsNote: ticket.collect.billsNote, 
    billsAmount: ticket.collect.billsAmount,
    billsCategory: ticket.collect.billsCategory
  }
  aux.way = ticket.way
  aux.ticketType = ticket.ticketType  /// mm - si es de un ticket recurrente o uno solo
  aux.title = ticket.title + " - DUPLICADO" // mm - titulo del ticket
  aux.note = ticket.note // mm - descripcion del ticket
  aux.notePrivate = ticket.notePrivate // mm - descripcion privada del ticket, para guardar informacion que solo ve el creador
  
  aux.metadata = {
    notes: ticket.metadata.notes,
    externalReference: ticket.metadata.externalReference // mm - referencia externa del ticket por ej factura_001
  }
  aux.paymentInfo = {
    paidAt: ticket.paymentInfo.paidAt,
    paymentMethod: ticket.paymentInfo.paymentMethod,
    transactionId: ticket.paymentInfo.transactionId
  }

  return (aux)
}

// Resolve country code for device public IP. If `ip` is provided it will be used,
// otherwise the function will first resolve the device's public IP and then query ipapi.
export async function getCountryCodeByIP(ip = null) {
  try {
    let ipToUse = ip;
    if (!ipToUse) {
      // Get public IP of the device using a lightweight public service
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        if (ipRes.ok) {
          const ipJson = await ipRes.json();
          ipToUse = ipJson && ipJson.ip ? ipJson.ip : null;
        }
      } catch (e) {
        // ignore and continue — ipToUse may be null
        ipToUse = null;
      }
    }

    if (!ipToUse) return false;

    const response = await fetch(`https://ipapi.co/${ipToUse}/json/`);
    if (!response.ok) return false;
    const data = await response.json();
    return data && data.country ? data.country : false;
  } catch (error) {
    return false;
  }
}

export function getPhoneCodeByCountryId(countryId) {
  const countryPhoneCodes = {
    AR: { code: '+54', name: 'Argentina' },
    US: { code: '+1', name: 'United States' },
    ES: { code: '+34', name: 'Spain' },
    BR: { code: '+55', name: 'Brazil' },
    MX: { code: '+52', name: 'Mexico' },
    CO: { code: '+57', name: 'Colombia' },
    CL: { code: '+56', name: 'Chile' },
    PE: { code: '+51', name: 'Peru' },
    UY: { code: '+598', name: 'Uruguay' },
    PY: { code: '+595', name: 'Paraguay' },
    BO: { code: '+591', name: 'Bolivia' },
    VE: { code: '+58', name: 'Venezuela' },
    EC: { code: '+593', name: 'Ecuador' },
    // Agrega más países según sea necesario
  };
  return countryPhoneCodes[countryId] ||  { code: '+91', name: '' };
}
