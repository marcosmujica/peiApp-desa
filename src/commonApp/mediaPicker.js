import { URL_AVATAR_IMG_UPLOAD } from "../commonApp/constants";
import * as ImagePicker from "expo-image-picker";

export class MediaPicker {
    constructor({
        id,
        idUser,
        filename = "",
        image = false,
        file = false,
        avatar = false,
        maxSize = 400, // KB
        setLoading = null,
        setAvatarKey = null,
        uploadUrl = URL_AVATAR_IMG_UPLOAD,
    } = {}) {
        this.id = id
        this.idUser = idUser || id
        this.filename = filename
        this.image = image
        this.file = file
        this.avatar = avatar
        this.maxSize = maxSize
        this.setLoading = setLoading
        this.setAvatarKey = setAvatarKey
        this.uploadUrl = uploadUrl
    }

    async upload() {
        try {
            // permissions on mobile
            if (Platform.OS !== 'web') {
                const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (!permissionResult.granted) {
                    return ({status:false, msg: 'Se necesitan permisos para acceder a la galería'});
                }
            }

            // Launch image library
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: "images",
                allowsEditing: true,
                quality: 1,
            });

            let finalResult = result;

            // If cancelled on mobile, fallback to camera
            if (Platform.OS !== 'web' && (result === undefined || result.cancelled)) {
                const cameraResult = await ImagePicker.launchCameraAsync({
                    mediaTypes: "images",
                    allowsEditing: true,
                    quality: 0.5,
                });
                if (cameraResult && !cameraResult.cancelled) finalResult = cameraResult;
            }

            if (!finalResult || finalResult.cancelled) return null;

            // support both shapes: assets[] or single uri
            const fileAsset = (finalResult.assets && finalResult.assets[0]) || { uri: finalResult.uri };
            console.log (fileAsset)
            // --- size check (KB) ---
            let sizeBytes = null;
            if (fileAsset.fileSize != null) sizeBytes = fileAsset.fileSize;
            else if (fileAsset.size != null) sizeBytes = fileAsset.size;
            else {
                // try fetching the resource to determine size (works on web and some RN runtimes)
                try {
                    const headResp = await fetch(fileAsset.uri);
                    const blob = await headResp.blob();
                    sizeBytes = blob.size;
                } catch (e) {
                    // ignore - we'll allow upload if size cannot be determined
                    sizeBytes = null;
                }
            }

            if (sizeBytes != null) {
                const sizeKb = Math.round(sizeBytes / 1024);
                if (this.maxSize && sizeKb > this.maxSize) {
                        return ({status:false, msg: `El archivo debe tener un máximo de ${this.maxSize} Kb`});
                }
            }

            const formData = new FormData();

            if (Platform.OS === 'web') {
                const response = await fetch(fileAsset.uri);
                const blob = await response.blob();
                formData.append('image', blob, `${this.idUser || 'user'}_${Date.now()}.jpg`);
            } else {
                const localUri = fileAsset.uri;
                // Ensure the file object has the correct structure for React Native
                formData.append('image', {
                    uri: localUri,
                    type: fileAsset.type || 'image/jpeg',
                    name: fileAsset.fileName || localUri.split('/').pop() || `${this.idUser || 'user'}_${Date.now()}.jpg`,
                });
            }

            // send to server
              // Agregar el ID de usuario
                  formData.append("idUser", this.idUser);

                  // Enviar al servidor
                                        console.log('Enviando imagen a:', this.uploadUrl);
                                        const response = await fetch(this.uploadUrl, {
                                            method: "POST",
                                            headers: {
                                                Accept: "application/json",
                                            },
                                            body: formData,
                                        });


                        const responseData = await response.json().catch(() => null);

                        if (!response.ok) {
                            return ({status:false, msg: 'La imagen no se pudo procesar'})
                        }

            // success
            if (this.setAvatarKey) this.setAvatarKey(Date.now());
            return responseData;
        } catch (err) {
            return ({status:false, msg: 'Error al subir la imagen. Comprueba tu conexión'})
        } finally {
            if (this.setLoading) this.setLoading(false);
            return {status:true, msg:""}
        }
    }
}

export default MediaPicker;