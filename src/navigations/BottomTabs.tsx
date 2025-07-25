import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

import HomeScreen from '../screens/HomeScreen';
import SearchResults from '../screens/SearchResults';
import ChatListScreen from '../screens/ChatListScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import RequestsScreen from '../screens/RequestsScreen';

import { useNotification } from '../contexts/NotificationContext';

import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();
const HomeStack = createStackNavigator();

const HomeStackScreen = () => {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="SearchResults" component={SearchResults} />
    </HomeStack.Navigator>
  );
};

const BottomTabs = () => {
  const { pendingRequestCount, unreadMessagesCount } = useNotification();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#FF6F00',
        tabBarInactiveTintColor: 'gray',
        tabBarIcon: ({ color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Home':
              iconName = 'search';
              break;
            case 'Requests':
              iconName = 'notifications-outline';  
              break;
            case 'Chats':
              iconName = 'chatbubble-ellipses';
              break;
            case 'Profile':
              iconName = 'person';
              break;
            case 'Settings':
              iconName = 'settings';
              break;
            default:
              iconName = 'ellipse';
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
      })}
    >
      {}
      <Tab.Screen name="Home" component={HomeStackScreen} />
      <Tab.Screen
        name="Requests"
        component={RequestsScreen}
        options={{
          tabBarBadge: pendingRequestCount > 0 ? pendingRequestCount : undefined,
        }}
      />
      <Tab.Screen
        name="Chats"
        component={ChatListScreen}
        options={{
          tabBarBadge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined,
        }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

export default BottomTabs;
