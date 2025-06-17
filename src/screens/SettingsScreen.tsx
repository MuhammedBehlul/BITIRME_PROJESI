import React from 'react';
import { View, Text, Switch, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeContext } from '../contexts/ThemeContext';
import { useTheme, useNavigation, CommonActions } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext'; 


const SettingsScreen = () => {
  const { theme, toggleTheme } = useThemeContext();
  const navTheme = useTheme();
  const navigation = useNavigation();
  const { logout } = useAuth(); // ✅ DOĞRU logout FONKSİYONU BURADAN ALINDI

  const handleLogout = () => {
  Alert.alert("Log Out", "Are you sure you want to log out?", [
    { text: "Cancel", style: "cancel" },
    {
      text: "Log Out",
      onPress: async () => {
        try {
          await logout();

          // En üstteki navigator'a reset atmaya çalış
          navigation.getParent()?.getParent()?.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            })
          ) || navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            })
          );
          
        } catch (error) {
          console.error("Logout error:", error);
          Alert.alert("Çıkış Hatası", "Çıkış yapılırken bir hata oluştu.");
        }
      },
    },
  ]);
};

  return (
    <View style={[styles.container, { backgroundColor: navTheme.colors.background }]}>
      <Text style={[styles.header, { color: navTheme.colors.text }]}>Settings</Text>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: navTheme.colors.text }]}>Account</Text>

        <TouchableOpacity style={styles.row}>
          <Ionicons name="person-outline" size={22} color={navTheme.colors.text} />
          <Text style={[styles.rowText, { color: navTheme.colors.text }]}>Edit Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.row}>
          <Ionicons name="lock-closed-outline" size={22} color={navTheme.colors.text} />
          <Text style={[styles.rowText, { color: navTheme.colors.text }]}>Change Password</Text>
        </TouchableOpacity>
      </View>

      {/* Preferences */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: navTheme.colors.text }]}>Preferences</Text>

        <View style={styles.row}>
          <Ionicons name="moon-outline" size={22} color={navTheme.colors.text} />
          <Text style={[styles.rowText, { color: navTheme.colors.text }]}>Dark Mode</Text>
          <Switch
            value={theme === 'dark'}
            onValueChange={toggleTheme}
            style={{ marginLeft: 'auto' }}
          />
        </View>
      </View>

      {/* Log Out */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.row} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#D32F2F" />
          <Text style={[styles.rowText, { color: '#D32F2F' }]}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  rowText: {
    fontSize: 16,
    marginLeft: 12,
  },
});
