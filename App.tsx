import React from "react";
import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { initializeApp } from "firebase/app";
import { firebaseConfig } from './firebaseConfig';
import Toast from 'react-native-toast-message';
import { View, Text, ActivityIndicator } from 'react-native';

import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import BottomTabs from "./src/navigations/BottomTabs";
import EditProfileScreen from "./src/screens/EditProfileScreen"; 
import ChatsScreen from "./src/screens/ChatsScreen";   // Sohbet detay ekranı
import RequestsScreen from "./src/screens/RequestsScreen"; // <- Burayı ekledik

import { ThemeProvider, useThemeContext } from "./src/contexts/ThemeContext";
import { AuthProvider, useAuth } from "./src/contexts/AuthContext";
import { NotificationProvider } from './src/contexts/NotificationContext';

initializeApp(firebaseConfig);

const Stack = createStackNavigator();

const MainApp = () => {
  const { theme } = useThemeContext();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <Text>Yükleniyor...</Text>
        <ActivityIndicator size="large" color="#FF6F00" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={theme === 'dark' ? DarkTheme : DefaultTheme}>
      <Toast />
      <Stack.Navigator initialRouteName={user ? "HomeScreen" : "Login"}>
        {!user ? (
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ title: 'Register' }}
            />
          </>
        ) : (
          <>
            <Stack.Screen
              name="HomeScreen"
              component={BottomTabs}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="EditProfile"
              component={EditProfileScreen}
              options={{ title: 'Update Profile' }}
            />
            <Stack.Screen
              name="ChatsScreen"
              component={ChatsScreen}
              options={{ title: 'Chats' }}
            />
            <Stack.Screen
              name="RequestsScreen"      
              component={RequestsScreen} 
              options={{ title: 'Requets' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const App = () => (
  <ThemeProvider>
    <AuthProvider>
      <NotificationProvider>
        <MainApp />
      </NotificationProvider>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
