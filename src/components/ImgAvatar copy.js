import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, Animated, Pressable, useColorScheme, TouchableOpacity } from 'react-native';
import {URL_AVATAR_IMG} from "../commonApp/constants"
import {USER_PREFIX_USER} from "../commonApp/constants"

const ImgAvatar = ({ id, nombre, profile=true }) => {
        const [imagenCargada, setImagenCargada] = useState(false);
        const [uri, setUri] = useState("")
        
        const obtenerIniciales = (nombre) => {
          return nombre
            .split(" ")
            .map((palabra) => palabra[0])
            .join("").slice (0,2)
            .toUpperCase();
        };

      
        return (
          <View style={styles.contenedor}>
            
            {!imagenCargada && (
              <View style={styles.circulo}>
                <Image
              source={ require ("../assets/user.png")}
            />
              </View>
            )}
            
            {id!=undefined && id!="" && id.startsWith(USER_PREFIX_USER) && !profile && <Image
              source={ URL_AVATAR_IMG + id + ".png"}
              onLoad={() => setImagenCargada(true)} // Cuando carga, oculta el círculo
              onError={() => setImagenCargada(false)} // Si falla, muestra el círculo
              style={[styles.imagen, {display: imagenCargada ? 'block' : 'none'}]}
            />}
            {id!=undefined && id!="" && id.startsWith(USER_PREFIX_USER) && profile && 
            <TouchableOpacity onPress={() => navigation.navigate("MyProfile", {id})}>
                  <Image
                    source={ URL_AVATAR_IMG + id + ".png"}
                    onLoad={() => setImagenCargada(true)} // Cuando carga, oculta el círculo
                    onError={() => setImagenCargada(false)} // Si falla, muestra el círculo
                    style={[styles.imagen, {display: imagenCargada ? 'block' : 'none'}]}/>
            </TouchableOpacity>}
          </View>
        );
      };
    



const styles = StyleSheet.create({
    contenedor: {
      width: 40,
      height: 40,
      borderRadius: 25,
      overflow: "hidden",
      justifyContent: "center",
      alignItems: "center",
    },
    circulo: {
      position: "absolute",
      width: 45,
      height: 45,
      borderRadius: 25,
      backgroundColor: "#bbb",
      justifyContent: "center",
      alignItems: "center",
      
    },
    iniciales: {
      fontSize: 16,
      fontWeight: "bold",
      color: "#000",
    },
    imagen: {
      width: "100%",
      height: "100%",
    },
  });

export default ImgAvatar
