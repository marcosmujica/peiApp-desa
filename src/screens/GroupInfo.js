import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, RefreshControl, useColorScheme, Image, useWindowDimensions, Platform, FlatList } from 'react-native';
import { AntDesign, Entypo, Feather, Fontisto, Ionicons,MaterialCommunityIcons,  MaterialIcons } from '@expo/vector-icons';
import Animated, { RotateInUpLeft, useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { colors, tStyles } from '../common/theme';
import { getStyles } from "../styles/home";
import { getStyles as getHomeStyles } from '../styles/home';
import { SafeAreaView } from 'react-native-safe-area-context';
import AnimatedTopBar from '../components/AnimatedTopBar';
import ImgAvatar from '../components/ImgAvatar';
import { getContactName } from '../commonApp/contacts';
import {URL_FILE_DOWNLOAD, URL_FILE_AVATAR_PREFIX, URL_FILE_SMALL_PREFIX, TICKET_TYPE_PAY, TICKET_TYPE_COLLECT, TICKET_INFO_TYPE_PAY_IMPULSIVED} from "../commonApp/constants"
import { db_getGroupsByByIdGroup, db_getGroupInfo } from '../commonApp/database';
import { formatDateToText, formatNumber } from '../commonApp/functions';
import { getProfile } from '../commonApp/profile';
import { ellipString } from '../common/helpers';
import MediaViewer from "../components/MediaViewer";
import { GROUP_TICKETS } from '../commonApp/dataTypes';
import SearchBar from "../components/SearchBar";
import { getFileAndUpload } from '../commonApp/attachFile';
import { showAttachmentPicker } from '../components/AttachmentPicker';
import AttachmentPickerHost from '../components/AttachmentPicker';
import Loading from '../components/Loading';
import AppContext from '../context/appContext';

const GroupInfo = ({ navigation, route }) => {

    const [idGroup] = useState (route.params ["idGroup"])
    const [avatarURL, setAvatarURL] = useState ("") 
    const [groupInfo, setGroupInfo] = useState (new GROUP_TICKETS()) // mm - lo iinicializo para que me de error cuando muestro la primera vez
    const [groupUsersList, setGroupUsersList] = useState ([])
    const [dataList, setDataList] = useState ([]) 
    const [dataListSearch, setDataListSearch] = useState ([]) 
    const [refreshing, setRefreshing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [avatarKey, setAvatarKey] = useState(Date.now());
    const mode = useColorScheme();
    const scrollOffset = 150;
    const profile = getProfile();
    const { showAlertModal } = React.useContext(AppContext);
   
    const [isSearch, setIsSearch] = useState (false)

    const scroll = useSharedValue(0);
    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (e) => {
            scroll.value = e.contentOffset.y
        }
    })
    const openViewer = (filename, mediaType) => {
        navigation.navigate("Viewer", { filename: filename, mediaType: mediaType });
    };

    const handleImagePress = () => {
        openViewer(avatarURL, "image/jpeg");
    };

    async function changeAvatar(media="") {
        try {
            if (media == "") {
                const res = await showAttachmentPicker();
                if (!res) {
                    return;
                }
                media = res.type;
            }
            
            setIsLoading(true);
            let uploadedFile = await getFileAndUpload(idGroup, true, media);

            if (!uploadedFile) {
                showAlertModal("Error", "Ocurrió un error al procesar la imagen. Por favor intente nuevamente.");
                setIsLoading(false);
                return;
            }
            
            // Actualizar el avatar con un nuevo key para forzar la recarga
            setAvatarKey(Date.now());
            setAvatarURL(`${URL_FILE_DOWNLOAD + URL_FILE_SMALL_PREFIX + idGroup + ".jpg"}?t=${Date.now()}`);
            setIsLoading(false);
        } catch (error) {
            showAlertModal("Error", "Ocurrió un error al procesar la imagen. Por favor intente nuevamente.");
            setIsLoading(false);
        }
    }

    useEffect(() => {
    
        setAvatarURL (`${URL_FILE_DOWNLOAD + URL_FILE_SMALL_PREFIX + idGroup + ".jpg"}`)
    
        let lastSearchText = ""; // mm - ultimo texto que se esta buscando

        const onFocus = () => {
            loadData()
        }

        const unsubscribe = navigation.addListener("focus", onFocus);

        return () => {
          console.log("🧹 Componente desmontado");
            typeof off === "function" && off();
            unsubscribe();
          // Esto se ejecuta cuando el componente se va de pantalla
        };
      }, []); 

    async function loadData()
    {
        setRefreshing (true)

        let aux = await db_getGroupInfo(idGroup)
        setGroupInfo (aux)

        let aux2 = await db_getGroupsByByIdGroup (aux.id)
        setDataList (aux2)
        setDataListSearch (aux2)

        let userList = aux.groupUsers.map ((item)=> ({id: item, name: getContactName(item)}))
        setGroupUsersList (userList)
/*        ticketView.sort((b, a) => {
            const dateA = new Date(a.ts).getTime();
            const dateB = new Date(b.ts).getTime();
            return dateA - dateB;
      });
      */
        setRefreshing (false)
    }

    function searchText(textToSearch) {
      setDataListSearch(!textToSearch ? dataList : dataList.filter((obj) => obj.name && obj.name.toLowerCase().includes(textToSearch.toLowerCase())));
  }
   

    function goToGroupBy(idGroupBy) {
        try {
            navigation.navigate('GroupByInfo', { idGroup: idGroup, idGroupBy: idGroupBy });
        } catch (error) {
            console.error("❌ Error al navegar:", error);
        }
    }

    return(
      <SafeAreaView edges={[ 'right', 'left', 'bottom' ]} style={ [getStyles(mode).container, { overflow: 'visible' }] }>
        <Loading loading={isLoading}/>
        <AttachmentPickerHost camera={true} gallery={true} file={false} />
        
        {/* Top Bar */}
        <AnimatedTopBar 
          scroll={ scroll } 
          scrollOffset={ scrollOffset } 
          uri={avatarURL}
          name={groupInfo.name}
          onImagePress={handleImagePress}
          onCameraPress={changeAvatar}
          avatarKey={avatarKey}
        />
        <Animated.ScrollView
          scrollEventThrottle={1}
          bounces={ false }
          showsVerticalScrollIndicator={ false }
          style={{ height: '100%' }}
          contentContainerStyle={{ paddingTop: 0 }}
          onScroll={ scrollHandler }
          
        >
              <View style={[ tStyles.centery, getStyles(mode).info, { marginTop: -40 }]}>
                <Text style={ getHomeStyles(mode).sectionTitle }>{groupInfo.name}</Text>
              </View>
              <View style={ [getHomeStyles(mode).bgStrip, { paddingHorizontal: 20 }] }>
                <Text style={[getHomeStyles(mode).sectionTitle, {paddingBottom:20}]}>{groupInfo.groupUsers.length} Contactos</Text>
                  <FlatList
                  horizontal={true}
                  showsHorizontalScrollIndicator={false}
                  data={groupUsersList}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => <UserItem item={item} profile={profile} />}
                  contentContainerStyle={{ paddingHorizontal: 0 }}
                  />
                  </View>
                 <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal:20 }}>
                {!isSearch && (<Text style={[getStyles(mode).sectionTitle]}>Sub Grupos</Text>)}
                {isSearch ? (
                  <SearchBar textToSearch={searchText} />
                ) : (
                  <TouchableOpacity onPress={() => setIsSearch(!isSearch)} style={{ padding: 10 }}>
                  <Feather name="search" size={24} color={colors.gray50} />
                  </TouchableOpacity>
                )}
                </View>
              <View style={  { paddingHorizontal: 20 ,paddingVertical: 10 } }>
                <FlatList
                  scrollEnabled={false}
                  horizontal={false}
                  showsHorizontalScrollIndicator={false}
                  data={dataListSearch}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => <GroupItem item={item} onClick={goToGroupBy} />}
                  contentContainerStyle={{ paddingHorizontal: 0 }}
                  />
            
          </View>
       </Animated.ScrollView>
            <TouchableOpacity onPress={() => navigation.navigate("NewTicket", { usersList: [idUser] })} style={[getStyles(mode).floatingBtn, { bottom: 80 }]}>
            <MaterialCommunityIcons name="account-group" size={20} />
            </TouchableOpacity>
      </SafeAreaView>
    )
}

const GroupItem = ({ item, onClick}) => {
   const mode = useColorScheme();
  
  return (
     <TouchableOpacity onPress={() => onClick(item.id)} style={{flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12}}>
          <ImgAvatar id={item.id} detail={false} size={35}/>
          <View style={{ flex: 1, marginLeft: 13, flexDirection: "column", justifyContent: "center" }}>
            {/* Primera línea: title (izquierda) - ts (derecha) */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <Text style={[getStyles(mode).listMainText, { fontWeight: "500", flexShrink: 1, marginRight: 10 }]} numberOfLines={1}>
                {ellipString(item.name, 25)}
              </Text>
              <Text style={[getStyles(mode).listSecondText, { flexShrink: 0 }]}>
                {formatDateToText(item.TSCreated)}
              </Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "flex-start", alignItems: "center", width: "100%" }}>
              {item.groupUsers != undefined && 
                <Text style={[getStyles(mode).listSecondText, { textAlign: "left" }]} numberOfLines={1}>
                {item.groupUsers.length} Contactos
              </Text>}
            </View>
          </View>
        </TouchableOpacity>
    
  );
};


const UserItem = ({ item, profile }) => {
  const mode = useColorScheme();
  return (
    <View>
      {item.contact != profile.idUser && (
        <TouchableOpacity >
          <View style={[getHomeStyles(mode).linkIconHolder, { marginRight: 15 }]}>
            <ImgAvatar id={item.id} detail={true} size={40}/>
          </View>

          <Text style={getHomeStyles(mode).subNormalText}>{ellipString(item.name, 8)}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
export default GroupInfo;