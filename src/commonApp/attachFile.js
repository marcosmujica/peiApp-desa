import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from 'uuid';
import { URL_FILE_UPLOAD} from "./constants"
import { Platform } from "react-native";
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system'
import * as DocumentPicker from 'expo-document-picker'
import * as ImageManipulator from 'expo-image-manipulator'
import AppContext from "../context/appContext";



export async function uploadFileToServer(idUser, isAvatar, file) {
    
      try {
        const url = URL_FILE_UPLOAD;
        const form = new FormData();

        if (!file || !file.uri) {
          console.log('uploadFileToServer: no file provided');
          return null;
        }

        const name = file.filename || file.name || (file.uri && file.uri.split('/').pop()) || `file_${Date.now()}`;
        let mime = file.type || 'application/octet-stream';
        if (mime && !mime.includes('/') && file.uri) {
          const l = (file.uri || '').toLowerCase();
          if (l.endsWith('.jpg') || l.endsWith('.jpeg')) mime = 'image/jpeg';
          else if (l.endsWith('.png')) mime = 'image/png';
          else if (l.endsWith('.webp')) mime = 'image/webp';
          else if (l.endsWith('.pdf')) mime = 'application/pdf';
          else mime = 'application/octet-stream';
        }

        if (Platform.OS === 'web') {
          // web: fetch blob
          try {
            const r = await fetch(file.uri);
            const blob = await r.blob();
            form.append('file', blob, name);
          } catch (e) {
            console.log('web blob fetch error', e);
            return null;
          }
        } else {
          // React Native
          if (mime.includes('/pdf')) {
            // PDFs: append as file object (avoid huge base64)
            form.append('file', { uri: file.uri, name, type: mime });
          } else {
            // Images: prefer base64 produced by ImageManipulator (works well for gallery content URIs)
            let sentBase64 = false;
            try {
              const manip = await ImageManipulator.manipulateAsync(file.uri, [], { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true });
              if (manip && manip.base64) {
                form.append('fileBase64', manip.base64);
                form.append('fileName', name);
                form.append('fileType', 'image/jpeg');
                sentBase64 = true;
              }
            } catch (e) {
              console.log('ImageManipulator base64 attempt failed', e);
            }

            if (!sentBase64) {
              try {
                const encoding = (FileSystem && FileSystem.EncodingType && FileSystem.EncodingType.Base64) ? FileSystem.EncodingType.Base64 : 'base64';
                const b64 = await FileSystem.readAsStringAsync(file.uri, { encoding });
                if (b64) {
                  form.append('fileBase64', b64);
                  form.append('fileName', name);
                  form.append('fileType', mime);
                  sentBase64 = true;
                }
              } catch (e) {
                console.log('FileSystem readAsStringAsync failed', e);
              }
            }

            if (!sentBase64) {
              // fallback to RN file object
              form.append('file', { uri: file.uri, name, type: mime });
            }
          }
        }

        form.append('idUser', idUser);
        form.append('isAvatar', isAvatar ? '1' : '0');

        // Debug: log form parts when possible
        try {
          if (form && form._parts) console.log('DEBUG FormData _parts:', form._parts);
          else if (form && typeof form.entries === 'function') {
            const parts = [];
            for (const p of form.entries()) parts.push(p);
            console.log('DEBUG FormData entries:', parts);
          }
        } catch (e) { console.log('FormData debug error', e); }

        const resp = await fetch(url, { method: 'POST', body: form });
        const text = await resp.text();
        try {
          const json = JSON.parse(text);
          if (!resp.ok || !json || !json.status) {
            console.log('uploadFileToServer error response:', resp.status, text);
            return null;
          }
          return json;
        } catch (e) {
          console.log('uploadFileToServer non-json response', resp.status, text);
          return null;
        }
        
      } catch (err) {
        console.log('uploadFileToServer exception', err);
        return null;
      }

}

// Unified handler: gallery / camera / file
async function handleFile(choice) {
  
  try {
    const requested = (typeof choice === 'string') ? choice : (choice && choice.type) || 'gallery';
    let asset = null;

    // Helper to normalize picker result shapes into { uri, fileName, type, size }
    const normalizeImageResult = (res) => {
      if (!res) return null;
      if (res.cancelled) return null;
      // Newer expo returns { assets: [{ uri, fileName, type, size }] }
      if (res.assets && res.assets.length > 0) {
        const a = res.assets[0];
        return { uri: a.uri, fileName: a.fileName || a.uri && a.uri.split('/').pop(), type: a.type || a.mimeType || 'image/jpeg', size: a.size || a.fileSize };
      }
      // Older shape
      return { uri: res.uri, fileName: res.uri && res.uri.split('/').pop(), type: res.type || 'image/jpeg', size: res.size || res.fileSize };
    };

    if (requested === 'gallery') {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      const granted = perm && (perm.status === 'granted' || perm.granted === true);
  if (!granted) { if (typeof showAlertModal !== 'undefined' && showAlertModal) showAlertModal('Permiso requerido', 'Se necesita permiso para acceder a la galería'); else console.log('Permiso requerido', 'Se necesita permiso para acceder a la galería'); return; }
      const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.5, allowsEditing: false });
      asset = normalizeImageResult(res);
    } else if (requested === 'camera') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      const granted = perm && (perm.status === 'granted' || perm.granted === true);
  if (!granted) { if (typeof showAlertModal !== 'undefined' && showAlertModal) showAlertModal('Permiso requerido', 'Se necesita permiso para usar la cámara'); else console.log('Permiso requerido', 'Se necesita permiso para usar la cámara'); return; }
      const res = await ImagePicker.launchCameraAsync({ quality: 0.5, allowsEditing: false });
      asset = normalizeImageResult(res);
    } else if (requested === 'file') {
      debugger
      const res = await DocumentPicker.getDocumentAsync({ type: ['application/pdf','text/plain'] });
  if (!res) return;
  if (res.canceled ) return;
      // expo-document-picker returns { type:'success', uri, name, size, mimeType }
    asset = { uri: res.uri || res.assets?.[0]?.uri, fileName: res.name || res.assets?.[0]?.name, type: res.mimeType || res.mime || 'application/pdf', size: res.size || res.assets?.[0]?.size };
  }

  if (!asset || !asset.uri) return false;

    return asset

    
    } catch (err) {
    console.log('handleFile error', err);
    if (typeof showAlertModal !== 'undefined' && showAlertModal) showAlertModal('Error', 'No se pudo agregar el archivo, por favor comprueba la conexion a Internet e intenta más tarde'); else console.log('Error', 'No se pudo agregar el archivo, por favor comprueba la conexion a Internet e intenta más tarde');
  } finally {
  }
}

export async function getFileAndUpload (idUser, isAvatar, mediaType)
{
    try{
        let asset = await handleFile (mediaType)

        console.log (asset)
        if (!asset) return

    // Build optimistic message and upload
        const msgFileId = `${idUser}_${uuidv4()}`;
        const file = { uri: asset.uri, filename: msgFileId, type: asset.type || (requested === 'file' ? 'application/pdf' : 'image/jpeg') };
        console.log (file)
        const uploadedFile = await uploadFileToServer(idUser, isAvatar, file);

        if (!uploadedFile) {
        if (showAlertModal) showAlertModal('Error', 'No se pudo agregar el archivo, por favor comprueba la conexion a Internet e intenta más tarde');
        return;
        }

        if (!uploadedFile) {
        if (showAlertModal) showAlertModal('Error', 'No se pudo agregar el archivo, por favor comprueba la conexion a Internet e intenta más tarde');
        return;
        }

        return ({...asset, remotefilename: uploadedFile.filename, status: uploadedFile.status})
        
    }
    catch (e) { showAlertModal('Error', 'No se pudo agregar el archivo, por favor comprueba la conexion a Internet e intenta más tarde');}
}