import * as Contacts from "expo-contacts";
import { Platform } from "react-native";
import contactsInstance from './contactsInstance';
import { getUId } from "./functions";

// Exportar la instancia para compatibilidad con código existente
export const _contacts = contactsInstance.getContacts();

export function getAllContacts() {
  return contactsInstance.getContacts();
}

// 👉 Normaliza el teléfono (agrega código de país si falta y quita ceros iniciales)
function normalizePhoneNumber(phone, defaultCountryCode = "+598") {
  if (!phone) return null;
  let clean = phone.replace(/[\s-()]/g, "");
  clean = clean.replace(/^0+/, ""); // quitar ceros iniciales

  if (clean.startsWith("+")) return clean;
  if (clean.startsWith("00")) return `+${clean.slice(2)}`;
  return `${defaultCountryCode}${clean}`;
}

// 👉 Arrays de nombres y apellidos para generar contactos
const firstNames = [
  "Juan", "Ana", "Luis", "María", "Carlos", "Laura", "Pedro", "Sofía",
  "Diego", "Camila", "Miguel", "Valentina", "Javier", "Lucía", "Andrés", "Paula"
];
const lastNames = [
  "Pérez", "González", "Rodríguez", "López", "Martínez", "García",
  "Fernández", "Sánchez", "Ramírez", "Torres", "Flores", "Vega"
];

// 👉 Generar 100 contactos fake para Web con id único
function generateFakeContacts(count = 100, countryCode = "+598") {
  const fakeContacts = [];
  const usedNames = new Set();

  while (fakeContacts.length < count) {
    const first = firstNames[Math.floor(Math.random() * firstNames.length)];
    const last = lastNames[Math.floor(Math.random() * lastNames.length)];
    const fullName = `${first} ${last}`;

    if (usedNames.has(fullName)) continue; // evitar repetidos
    usedNames.add(fullName);

    let number = `0${Math.floor(1000000 + Math.random() * 8999999)}`;
    number = number.replace(/^0+/, ""); // quitar ceros iniciales

    fakeContacts.push({
      id: `${countryCode}${number}`, // id único
      name: fullName,
      phone: `${countryCode}${number}`,
    });
  }
  
  fakeContacts.push({ id: `+59896725662`, // id único
      name: "_Marcos",
      phone: `+59896725662`})
  fakeContacts.push({ id: `+59896725663`, // id único
      name: "_Marcos2",
      phone: `+59896725663`})
  return fakeContacts;
}

export function getContactName(id) {
  return contactsInstance.getContactName(id);
}
export async function checkContactsPermission() {
  // Verifica el estado actual del permiso
  const { status, canAskAgain } = await Contacts.getPermissionsAsync();

  if (status === "granted") {
    return true; // ✅ Ya tiene permiso
  } else if (status === "denied" && canAskAgain) {
    
    return false;
  } else {
    // ❌ Denegado permanentemente o no disponible
    return false;
  }
}

export async function recoveryAllContacts(defaultCountryCode = "+598") {
  try{
    // Si los contactos ya están inicializados, retornarlos directamente
    if (contactsInstance.isInitialized()) {
      return contactsInstance.getContacts();
    }

    if (Platform.OS === "web") {
      // ⚡ En web generamos datos fake
      const fakeContacts = generateFakeContacts(100, defaultCountryCode);
      contactsInstance.setContacts(fakeContacts);
      return contactsInstance.getContacts();
    }

    // ⚡ En mobile usamos expo-contacts
    const { status } = await Contacts.requestPermissionsAsync();
    if (status !== "granted") {
      return [];
    }

    const { data } = await Contacts.getContactsAsync({
      fields: [Contacts.Fields.PhoneNumbers],
    });

    if (!data.length) {
      contactsInstance.setContacts([]);
      return [];
    }

    const uniqueContacts = new Map();
    let idCounter = 1;

    data.forEach((contact, index) => {
      if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
        contact.phoneNumbers.forEach((p) => {
          const normalized = normalizePhoneNumber(p.number, defaultCountryCode);
          if (normalized && !uniqueContacts.has(normalized)) {
            uniqueContacts.set(normalized, {
              id: getUId(), // id único
              name: contact.name,
              phone: normalized,
            });
          }
        });
      }
    });


    const sortedContacts = Array.from(uniqueContacts.values())
      .sort((a, b) => a.name.localeCompare(b.name));

    // Actualizar la instancia global
    contactsInstance.setContacts(sortedContacts);
    
    return contactsInstance.getContacts();
  }
  catch (e) {console.log ("error en recoveryAllContacts: " + JSON.stringify(e))}
}
