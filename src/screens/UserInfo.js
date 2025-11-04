import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, RefreshControl, useColorScheme, Image, useWindowDimensions, Platform, FlatList } from 'react-native';
import { AntDesign, Entypo, Feather, Fontisto, Ionicons,MaterialCommunityIcons,  MaterialIcons } from '@expo/vector-icons';
import Animated, { RotateInUpLeft, useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { colors, tStyles } from '../common/theme';
import { getStyles } from '../styles/profile';
import { getStyles as getHomeStyles } from '../styles/home';
import { SafeAreaView } from 'react-native-safe-area-context';
import AnimatedTopBar from '../components/AnimatedTopBar';
import ImgAvatar from '../components/ImgAvatar';
import { getContactName } from '../commonApp/contacts';
import {URL_FILE_DOWNLOAD, URL_FILE_AVATAR_PREFIX, URL_FILE_SMALL_PREFIX, TICKET_TYPE_PAY, TICKET_TYPE_COLLECT, TICKET_INFO_TYPE_PAY_IMPULSIVED} from "../commonApp/constants"
import { db_getAllTicketRating, db_getAllTickets, db_getTicketRating, db_getTicketViewByIdUser } from '../commonApp/database';
import { formatDateToText, formatNumber } from '../commonApp/functions';
import { getProfile } from '../commonApp/profile';
import MediaViewer from "../components/MediaViewer";

const UserInfo = ({ navigation, route }) => {

    const [idUser] = useState (route.params ["idUser"])
    const [avatarURL, setAvatarURL] = useState ("") 
    const [dataList, setDataList] = useState ([]) 
    const [refreshing, setRefreshing] = useState(false);
    const mode = useColorScheme();
    const scrollOffset = 150;
    const profile = getProfile();
   

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

    useEffect(() => {
    
        setAvatarURL (`${URL_FILE_DOWNLOAD + URL_FILE_SMALL_PREFIX + idUser + ".jpg"}`)
        
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
        let ticketView = await db_getTicketViewByIdUser(idUser)
        ticketView.sort((b, a) => {
            const dateA = new Date(a.ts).getTime();
            const dateB = new Date(b.ts).getTime();
            return dateA - dateB;
      });
        // mm- iniciliazo en 0 los ratings de todos los tickets
        ticketView = ticketView.map ((item) => { item.rating = 0; return item }) // mm - inicializo el rating en 0

        let rating = await db_getAllTicketRating()

        //mm -solo recorro los ticket que han tenido rating
        for (let i=0;i<ticketView.length;i++)
            {
            try{
                let ratingAux = rating.find ((item)=> item.idTicket == ticketView[i].idTicket)
                ticketView[i].rating = ratingAux == undefined ? 0 : ratingAux.rating
            }
            catch (e) { console.log ("error loadata"); console.log (e)}
        }
        setDataList (ticketView)
        setRefreshing (false)
    }

    function goToTicket(idTicket) {
        try {
            navigation.navigate('TicketDetail', { idTicket });
        } catch (error) {
            console.error("❌ Error al navegar:", error);
        }
    }

    // Función auxiliar para acortar strings
    function ellipString(str, maxLength) {
        if (!str) return '';
        return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
    }

    return(
        <SafeAreaView edges={[ 'right', 'left' ]} style={ [getStyles(mode).container, { overflow: 'visible' }] }>

            {/* Top Bar */}
            <AnimatedTopBar 
                scroll={ scroll } 
                scrollOffset={ scrollOffset } 
                uri={avatarURL}
                name={getContactName(idUser)}
                onImagePress={handleImagePress}
            />
            <Animated.ScrollView
                scrollEventThrottle={1}
                bounces={ false }
                showsVerticalScrollIndicator={ false }
                style={{ height: '100%' }}
                contentContainerStyle={{ paddingTop: 0 }}
                onScroll={ scrollHandler }
                
            >

                {/* Group Info */}
                <View style={[ tStyles.centery, getStyles(mode).info, { marginTop: -40 }]}>
                    
                    <Text style={ getStyles(mode).titleText }>{getContactName(idUser)}</Text>
                    <Text style={ getStyles(mode).subtitleText }>{idUser}</Text>

                </View>
                                
                {/* Lista de Tickets */}
                <View style={ [getStyles(mode).bgStrip, { paddingVertical: 10 }] }>
                    {dataList.length > 0 ? (
                        dataList.map((item, index) => {
                            return (
                                <TicketItem 
                                    key={item.idTicket?.toString() || `ticket-${index}`} 
                                    item={item} 
                                    onClick={goToTicket}
                                    mode={mode}
                                    ellipString={ellipString}
                                />
                            );
                        })
                    ) : (
                        <View style={{ padding: 20, alignItems: 'center' }}>
                            <Text style={{ color: colors.gray50 }}>No hay tickets para mostrar</Text>
                        </View>
                    )}
                    
                </View>



            </Animated.ScrollView>
                  <TouchableOpacity onPress={() => navigation.navigate("NewTicket", { usersList: [idUser] })} style={[getStyles(mode).floatingBtn,]}>
                    <MaterialCommunityIcons name="message-plus" size={20} />
                  </TouchableOpacity>
        </SafeAreaView>
    )
}


const MemberItem = () => {
    // const navigation = useNavigation();
    const mode = useColorScheme();

    return(
        <TouchableOpacity style={getStyles(mode).memberContainer}>
            <ImgAvatar id={idUser} detail={false}></ImgAvatar>
            <Image
                source={{ uri: 'http://i.pravatar.cc/320' }}
                style={ getStyles(mode).memberAvatar }
            />

            <View style={[ tStyles.spacedRow, tStyles.flex1 ]}>
                <View style={[ tStyles.flex1, { marginLeft: 15 } ]}>
                    <Text style={ getStyles(mode).memberUser }>Meee</Text>
                    <Text style={ getStyles(mode).memberStatus }>Profile Status</Text>
                </View>

                <Text style={ getStyles(mode).adminBadge }>Group Admin</Text>
            </View>
        </TouchableOpacity>
    )
}

const TicketItem = ({ item, onClick, mode, ellipString }) => {
  
  const styles = getStyles(mode);
  const homeStyles = getHomeStyles(mode);
  
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
            {item.statusText ? `[${ellipString(item.statusText, 10)}] ` : ""} {formatDateToText(item.dueDate)}
          </Text>
        </View>

        {/* Segunda línea: statusText (izquierda) - seen badge (derecha) */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%", marginTop: 4 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons 
                key={`star-${star}`}
                name={item.rating >= star ? "star" : "star-outline"} 
                size={10} 
                color={item.rating >= star ? colors.darkPrimary2 : colors.darkPrimary} 
                style={{ marginHorizontal: 2 }} 
              />
            ))}
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
            {item.way == TICKET_TYPE_PAY && (
              <React.Fragment key="pay">
                <Text style={[homeStyles.chatTime, { color: "#c53131ff" }]}>
                  - {item.currency} {formatNumber(item.amount)}
                {!item.isOpen && <Fontisto name="locked" size={15} key="lock" />}
                </Text>
              </React.Fragment>
            )}
            {item.way == TICKET_TYPE_COLLECT && (
              <React.Fragment key="collect">
                <Text style={[homeStyles.chatTime]}>
                  {item.currency} {formatNumber(item.amount)}
                  {!item.isOpen && <Fontisto name="locked" size={15} key="lock" />}
                </Text>
              </React.Fragment>
            )}
            
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const MediaItem = ({ item }) => {
    return(
        <TouchableOpacity>
            <Image
                source={{ uri: item.uri }}
                style={{ width: 90, height: 80, marginRight: 8, borderRadius: 10 }}
                resizeMode='cover'
            />
        </TouchableOpacity>
    )
}


export default UserInfo;