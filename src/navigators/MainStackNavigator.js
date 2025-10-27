import { createStackNavigator } from "@react-navigation/stack";
import MainScreen from "./MainScreen";
import * as Screens from '../screens';

const Stack = createStackNavigator();

export const MainStackNavigator = () => {
    return (
        <Stack.Navigator initialRouteName="Welcome" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MainScreen" component={ MainScreen } />
            <Stack.Screen name="PreLogin" component={ Screens.PreLogin } />
            <Stack.Screen name="Login" component={ Screens.Login } />
            <Stack.Screen name="UserGroupInfo" component={ Screens.UserGroupInfo } />
            <Stack.Screen name="UserInfo" component={ Screens.UserInfo } />
            <Stack.Screen name="HomeGroups" component={ Screens.HomeGroups } />
            <Stack.Screen name="GroupList" component={ Screens.GroupList } />
            <Stack.Screen name="OTPScreen" component={ Screens.OTPScreen } />
            <Stack.Screen name="Profile_Info" component={ Screens.Profile_Info } />
            <Stack.Screen name="TicketResume" component={ Screens.TicketResume } />
            <Stack.Screen name="TicketDetail" component={ Screens.TicketDetail } />
            <Stack.Screen name="UserProfile" component={ Screens.UserProfile } />
            <Stack.Screen name="MemberList" component={ Screens.MemberList } />
            <Stack.Screen name="NewTicket" component={ Screens.NewTicket } />
            <Stack.Screen name="Viewer" component={ Screens.Viewer} />
            <Stack.Screen name="Profile_AreaToWork" component={ Screens.Profile_AreaToWork } />
            <Stack.Screen name="Profile_Helpdesk" component={ Screens.Profile_Helpdesk } />
            <Stack.Screen name="Profile_Notification" component={ Screens.Profile_Notification} />
            <Stack.Screen name="Profile_PayMethod" component={ Screens.Profile_PayMethod} />
            <Stack.Screen name="AddChat" component={ Screens.AddChat } />
            <Stack.Screen name="NewGroup" component={ Screens.NewGroup } />
            <Stack.Screen name="Group" component={ Screens.Group } />
            <Stack.Screen name="Broadcast" component={ Screens.Broadcast } />
            <Stack.Screen name="Profile" component={ Screens.Profile } />
            <Stack.Screen name="ChatDetails" component={ Screens.ChatDetails } />
            <Stack.Screen name="Calling" component={ Screens.Calling } />
            <Stack.Screen name="AccountSettings" component={ Screens.AccountSettings } />
            <Stack.Screen name="PrivacySettings" component={ Screens.PrivacySettings } />
            <Stack.Screen name="HelpCenter" component={ Screens.HelpCenter } />
            <Stack.Screen name="ViewStory" component={ Screens.ViewStory } />
            <Stack.Screen name="AppInfo" component={ Screens.AppInfo } />
            <Stack.Screen name="Information" component={ Screens.Information } />
            <Stack.Screen name="InviteFriend" component={ Screens.InviteFriend } />
            <Stack.Screen name="Welcome" component={ Screens.Welcome } />
        </Stack.Navigator>
    )
}
