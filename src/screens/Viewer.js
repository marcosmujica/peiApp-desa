import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Modal,
  Keyboard,
  LayoutAnimation,
  TouchableOpacity,
  Image,
  SectionList,
  TextInput,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  Text,
  InteractionManager
} from "react-native";
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system'
import * as ImageManipulator from 'expo-image-manipulator'
import { SafeAreaView } from "react-native-safe-area-context";

import TitleBar from "../components/TitleBar";
import {URL_FILE_DOWNLOAD, URL_FILE_NORMAL_PREFIX, URL_FILE_SMALL_PREFIX, URL_FILE_UPLOAD} from "../commonApp/constants"
import Loading from "../components/Loading"
import MediaViewer from "../components/MediaViewer";
import { getStyles } from "../styles/home";
import { useFocusEffect } from '@react-navigation/native';

const Viewer = ({ navigation, route }) => {
    const [isLoading, setIsLoading] = React.useState (false)
    const baseUrl = route.params.filename
    const [url, setUrl] = useState (baseUrl + '?t=' + Date.now())

    // Reload the image every time the screen is focused (cache-busting token)
    useFocusEffect(
      useCallback(() => {
        setUrl(baseUrl)
        console.log (baseUrl)
      }, [baseUrl])
    );

    
    const mode = useColorScheme()


    return (
       <SafeAreaView
      edges={["top", "right", "left", "bottom"]}
      style={getStyles(mode).container}
    >
        <TitleBar
          goBack={true}
          title=""
          subtitle=""
        />
        <View>
        <MediaViewer url={url} />
        </View>
        </SafeAreaView>
    )
}
export default Viewer;
