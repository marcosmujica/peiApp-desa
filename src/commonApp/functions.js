import 'react-native-get-random-values'
import { v4 as uuidv4 } from 'uuid';
import { 
  REPEAT_WEEKLY, 
  REPEAT_BIWEEKLY, 
  REPEAT_MONTHLY, 
  REPEAT_BIMONTHLY,
  REPEAT_QUATERLY,
  REPEAT_QUADRIMONTHLY,
  REPEAT_ANNUALY 
} from './constants';
import { Platform } from "react-native";

export function getDayName(fecha = new Date())
{
  const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  return (dias[fecha.getDay()]);
}

export function getMonthName (fecha = new Date())
{return (fecha.toLocaleString('es-ES', { month: 'long' }))};

export const getUId = () => { return uuidv4()}

export const getBigUId = () => {
  return getUId() + getUId()
}

  //return }

export const formatDateToText = (dateString) => {
  try{
    let diff = 0
    if (typeof dateString == "object") diff = diasEntreFechas (dateString, new Date())
    if (typeof dateString == "string") diff = diasEntreFechas (new Date(dateString), new Date())
    
    return (diff == 0 ? "Hoy" : diff == 1 ? "Mañana" : diff == -1 ? "Ayer" : new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric'}).format(new Date(dateString)))
  } catch (e){return }
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

export function getUniqueValues(arr, campo) {
  return [...new Set(arr.map(obj => obj[campo]))];
}

export const formatNumber = (num) => {
  if (num == 0 || num == undefined) return ("0")
  try{
    const parts = num.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return parts.join(',');
  }
  catch (e) {console.log ("Error formatNumber: " + num)}
  return ""
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


// Resolve country code for device public IP. If `ip` is provided it will be used,
// otherwise the function will first resolve the device's public IP and then query ipapi.
export async function getCountryCodeByIP(ip = null) {
  try {
    let ipToUse = ip;
    if (!ipToUse) {
      // Get public IP of the device using a lightweight public service
        ipToUse = (await fetch('https://ipinfo.io/ip').then(r => r.text())).trim();
        
    }
    if (!ipToUse) return false;
    const response = await fetch(`https://ipwho.is/${ipToUse}`).then(r => r.text())

    if (!response) return false;
    let responseJson = JSON.parse(response)
    return responseJson && responseJson.country_code ? responseJson.country_code : false;
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

function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

// mm - combino 2 objetos con profundidad
export function deepObjectMerge(target = {}, source = {}) {
  try{
    const result = { ...target };
    Object.keys(source).forEach(key => {
        const srcVal = source[key];
        const tgtVal = target ? target[key] : undefined;
        if (isObject(srcVal) && isObject(tgtVal)) {
            result[key] = deepObjectMerge(tgtVal, srcVal);
        } else {
            // arrays and non-objects are replaced by source
            result[key] = srcVal;
        }
    });
    return result;
  }
    catch (e) { console.log ("error deepObjectMerge: " + JSON.stringify(e))}
}

// mm - hago el calculo de la cantidad de veces que se repite un evento entre fechas
export function calculateInstancesBetweenDates(code, fromDate, toDate) {
  try {
    // Convertir a objetos Date si son strings
    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);
    
    // Validar que las fechas sean válidas
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.error('Fechas inválidas en calculateInstancesBetweenDates');
      return 0;
    }
    
    // Si la fecha final es anterior a la inicial, retornar 0
    if (endDate < startDate) {
      return 0;
    }
    
    // Calcular la diferencia en milisegundos
    const diffTime = endDate.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    switch (code) {
      case REPEAT_WEEKLY:
        // Cada 7 días
        return Math.floor(diffDays / 7) + 1; // +1 para incluir la primera instancia
        
      case REPEAT_BIWEEKLY:
        // Cada 14 días (quincenal)
        return Math.floor(diffDays / 14) + 1;
        
      case REPEAT_MONTHLY:
        // Calcular meses completos entre fechas
        const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                          (endDate.getMonth() - startDate.getMonth());
        return monthsDiff + 1; // +1 para incluir el mes inicial
        
      case REPEAT_BIMONTHLY:
        // Cada 2 meses (bimestral)
        const bimonthsDiff = Math.floor(
          ((endDate.getFullYear() - startDate.getFullYear()) * 12 + 
          (endDate.getMonth() - startDate.getMonth())) / 2
        );
        return bimonthsDiff + 1;
        
      case REPEAT_QUATERLY:
        // Cada 3 meses (trimestral)
        const quartersDiff = Math.floor(
          ((endDate.getFullYear() - startDate.getFullYear()) * 12 + 
          (endDate.getMonth() - startDate.getMonth())) / 3
        );
        return quartersDiff + 1;
        
      case REPEAT_QUADRIMONTHLY:
        // Cada 4 meses (cuatrimestral)
        const quadrimonthsDiff = Math.floor(
          ((endDate.getFullYear() - startDate.getFullYear()) * 12 + 
          (endDate.getMonth() - startDate.getMonth())) / 4
        );
        return quadrimonthsDiff + 1;
        
      case REPEAT_ANNUALY:
        // Cada año (anual)
        const yearsDiff = endDate.getFullYear() - startDate.getFullYear();
        return yearsDiff + 1; // +1 para incluir el año inicial
        
      default:
        console.warn(`Código de repetición no reconocido: ${code}`);
        return 1; // Retornar 1 instancia por defecto
    }
  } catch (error) {
    console.error('Error en calculateInstancesBetweenDates:', error);
    return 0;
  }
}