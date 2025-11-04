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
import { db_getGroupByInfo, db_getTicketsIdGroupBy, db_getGroupInfo } from '../commonApp/database';
import { formatDateToText, formatNumber } from '../commonApp/functions';
import { getProfile } from '../commonApp/profile';
import { ellipString } from '../common/helpers';
import MediaViewer from "../components/MediaViewer";
import { GROUP_BY_TICKETS, TICKET } from '../commonApp/dataTypes';
import SearchBar from "../components/SearchBar";
import { getFileAndUpload } from '../commonApp/attachFile';
import { showAttachmentPicker } from '../components/AttachmentPicker';
import AttachmentPickerHost from '../components/AttachmentPicker';
import Loading from '../components/Loading';
import AppContext from '../context/appContext';

const GroupByTicketInfo = ({ navigation, route }) => {

    const [idGroup, setIdGroup] = useState (route.params ["idGroup"])
    const [idGroupBy] = useState (route.params ["idGroupBy"])
    const [groupByInfo, setGroupByInfo] = useState (new GROUP_BY_TICKETS()) // mm - lo iinicializo para que me de error cuando muestro la primera vez
    const [avatarURL, setAvatarURL] = useState ("")
    const [dataList, setDataList] = useState ([]) 
    const [dataListSearch, setDataListSearch] = useState ([]) 
    const [refreshing, setRefreshing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [avatarKey, setAvatarKey] = useState(Date.now());
    const [usersList, setUsersList] = useState([]);
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
    
        setAvatarURL (`${URL_FILE_DOWNLOAD + URL_FILE_SMALL_PREFIX + idGroupBy + ".jpg"}`)
    
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
        
        let aux = await db_getGroupByInfo(idGroupBy)
        debugger
        setGroupByInfo (aux)
        setIdGroup (aux.idTicketGroup)
        setUsersList (aux.groupUsers)
        
        debugger
        let aux2 = await db_getTicketsViewIdGroupBy (aux.id)
        console.log(aux2)

        aux2.sort((a, b) => {
            const nameA = (a.title || '').toLowerCase();
            const nameB = (b.title || '').toLowerCase();
            return nameA.localeCompare(nameB);
        });
        setDataList (aux2)
        setDataListSearch (aux2)
        
        setRefreshing (false)
    }

    function searchText(textToSearch) {
      setDataListSearch(!textToSearch ? dataList : dataList.filter((obj) => obj.name && obj.name.toLowerCase().includes(textToSearch.toLowerCase())));
  }
   

    function goToTicket(idTicket) {
        try {
            navigation.navigate('TicketDetail', { IdTicket: idTicket });
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
          name={groupByInfo.name}
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
                <Text style={ getHomeStyles(mode).sectionTitle }>{groupByInfo.name}</Text>
              </View>
              
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal:10 }}>
                {isSearch ? (
                  <SearchBar textToSearch={searchText} />
                ) : (
                  <TouchableOpacity onPress={() => setIsSearch(!isSearch)} style={{ padding: 10 }}>
                  <Feather name="search" size={24} color={colors.gray50} />
                  </TouchableOpacity>
                )}
                </View>
              <View style={ [getHomeStyles(mode).bgStrip, { paddingVertical: 10 }] }>
                <FlatList
                  horizontal={false}
                  showsHorizontalScrollIndicator={false}
                  data={dataListSearch}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => <TicketItem item={item} onClick={goToTicket} />}
                  contentContainerStyle={{ paddingHorizontal: 0 }}
                  />
            
          </View>
       </Animated.ScrollView>
            <TouchableOpacity onPress={() => navigation.navigate("NewTicket", { usersList: [usersList], idTicketGroup: idGroup, idTicketGroupBy: idGroupBy })} style={[getStyles(mode).floatingBtn, { bottom: 80 }]}>
            <MaterialCommunityIcons name="message-plus" size={20} />
            </TouchableOpacity>
      </SafeAreaView>
    )
}
const TicketItem = ({ item, onClick, mode, ellipString }) => {
  
  const styles = getStyles(mode);
  const homeStyles = getHomeStyles(mode);
  console.log (item)
  return (
    <TouchableOpacity 
      activeOpacity={0.7}
      onPress={()=>onClick(item.id)}
      style={homeStyles.chatContainer}
    >
      <View style={{ flex: 1, marginLeft: 13, flexDirection: "column", justifyContent: "center" }}>
        {/* Primera línea: title (izquierda) - ts (derecha) */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <Text style={homeStyles.listMainText} numberOfLines={1}>
            {ellipString(item.title, 20)}
          </Text>
          <Text style={[homeStyles.chatTime]}>
            {item.statusText ? `[${ellipString(item.dataListSearch, 10)}] ` : ""} {formatDateToText(item.dueDate)}
          </Text>
        </View>

        {/* Segunda línea: statusText (izquierda) - seen badge (derecha) */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%", marginTop: 4 }}>
          <Text style={homeStyles.listSecondText} numberOfLines={1}>
            {[1, 2, 3, 4, 5].map((star) => (<Ionicons name={item.rating >= star ? "star" : ""} size={10} color={item.rating >= star ? colors.darkPrimary2 : colors.darkPrimary} style={{ marginHorizontal: 2 }} />))}
          </Text>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            {item.way == TICKET_TYPE_PAY && (
              <Text style={[homeStyles.chatTime, { color: "#c53131ff" }]}>
                - {item.currency} {formatNumber(item.amount)} {!item.isOpen && <Fontisto name="locked" size={15} />}
              </Text>
            )}
            {item.way == TICKET_TYPE_COLLECT && (
              <Text style={[homeStyles.chatTime]}>
                {item.currency} {formatNumber(item.amount)} {!item.isOpen && <Fontisto name="locked" size={15} />}
              </Text>
            )}
            
          </View>
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
            <ImgAvatar id={item.name} detail={false} size={40}/>
          </View>

          <Text style={getHomeStyles(mode).subNormalText}>{ellipString(item.name, 8)}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
export default GroupByTicketInfo;