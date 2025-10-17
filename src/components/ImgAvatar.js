import { View, Text, StyleSheet, Platform } from "react-native";
import { Image } from "expo-image";
import { URL_AVATAR_IMG, URL_FILE_AVATAR_PREFIX } from "../commonApp/constants"

export default function ImgAvatar({ id = "", name = "", cache = true, size = 50 }) {
  if (id =="") return
  
  const numericSize = Number(size) || 50;

  const hasRemoteImage = true;
  
  // Generar sufijo aleatorio de 5 dígitos si cache es true
  const randomSuffix = cache ? Math.floor(Math.random() * 90000 + 10000).toString() : '';
  const imageUrl = `${URL_AVATAR_IMG}${URL_FILE_AVATAR_PREFIX}${id}.jpg${!cache ? '?' + randomSuffix : ''}`;

  if (id == "") {imageUrl == null}
  const initials = name
    ? name
        .trim()
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "";

  return (
    <View
      style={[
        styles.avatar,
        { width: numericSize, height: numericSize, borderRadius: numericSize / 2 },
      ]}
    >
      {hasRemoteImage ? (
        <Image
          source={{ uri: imageUrl }}
          style={{ width: numericSize, height: numericSize, borderRadius: numericSize / 2 }}
          contentFit="cover"
          placeholder={require("../assets/avatar/user.png")}
          transition={0}
        />
      ) : initials ? (
        <Text style={[styles.initials, { fontSize: numericSize / 2 }]}>{initials}</Text>
      ) : (
        <Image
          source={require("../assets/avatar/user.png")}
          style={{ width: numericSize, height: numericSize, borderRadius: numericSize / 2 }}
          contentFit="cover"
          transition={300}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ddd", // fondo gris para iniciales
    overflow: "hidden", // necesario en iOS para redondear imagen
  },
  initials: {
    color: "#555",
    fontWeight: "bold",
  },
});
