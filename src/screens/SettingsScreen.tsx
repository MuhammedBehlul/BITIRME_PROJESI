import React, { useState, useEffect } from 'react';
import {
  View, Text, Switch, StyleSheet, TouchableOpacity, Alert,
  Modal, TextInput, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeContext } from '../contexts/ThemeContext';
import { useTheme } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { updatePassword } from 'firebase/auth';

const hobbiesList = [
  'Music', 'Art', 'Technology', 'Science', 'Gaming', 'Sports',
  'Travel', 'Yoga', 'Reading', 'Movies', 'Food', 'Dancing',
  'Photography', 'Nature'
];

const SettingsScreen = () => {
  const { theme, toggleTheme } = useThemeContext();
  const navTheme = useTheme();
  const { logout, user } = useAuth();
  const db = getFirestore();

  const [editHobbiesVisible, setEditHobbiesVisible] = useState(false);
  const [changePassVisible, setChangePassVisible] = useState(false);
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>([]);
  const [newPassword, setNewPassword] = useState('');

  // Kullanıcı hobilerini getir
  useEffect(() => {
    const fetchUser = async () => {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setSelectedHobbies(docSnap.data().hobbies || []);
      }
    };
    fetchUser();
  }, []);

  const toggleHobby = (hobby: string) => {
    if (selectedHobbies.includes(hobby)) {
      setSelectedHobbies(selectedHobbies.filter((h) => h !== hobby));
    } else {
      setSelectedHobbies([...selectedHobbies, hobby]);
    }
  };

  const saveHobbies = async () => {
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { hobbies: selectedHobbies });
      Alert.alert('Success', 'Hobbies updated.');
      setEditHobbiesVisible(false);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not update hobbies.');
    }
  };

  const handleChangePassword = async () => {
    try {
      await updatePassword(user, newPassword);
      Alert.alert('Success', 'Password updated.');
      setChangePassVisible(false);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not update password.');
    }
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        onPress: async () => {
          try {
            await logout();
          } catch (error) {
            console.error('Logout error:', error);
            Alert.alert('Error', 'Logout failed.');
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

        <TouchableOpacity style={styles.row} onPress={() => setEditHobbiesVisible(true)}>
          <Ionicons name="list-outline" size={22} color={navTheme.colors.text} />
          <Text style={[styles.rowText, { color: navTheme.colors.text }]}>Edit Hobbies</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.row} onPress={() => setChangePassVisible(true)}>
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

      {/* Edit Hobbies Modal */}
      <Modal visible={editHobbiesVisible} animationType="slide" transparent={false}>
        <ScrollView style={styles.modalContent}>
          <Text style={styles.modalTitle}>Edit Hobbies</Text>
          <View style={styles.hobbyContainer}>
            {hobbiesList.map((hobby) => (
              <TouchableOpacity
                key={hobby}
                style={[
                  styles.hobbyButton,
                  selectedHobbies.includes(hobby) && styles.selectedHobby,
                ]}
                onPress={() => toggleHobby(hobby)}
              >
                <Text style={[
                  styles.hobbyButtonText,
                  selectedHobbies.includes(hobby) && styles.selectedHobbyText
                ]}>
                  {hobby}
                </Text>
              </TouchableOpacity>

            ))}
          </View>
          <TouchableOpacity style={styles.saveButton} onPress={saveHobbies}>
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setEditHobbiesVisible(false)}>
            <Text style={{ textAlign: 'center', marginTop: 10, color: 'gray' }}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>

      {/* Change Password Modal */}
      <Modal visible={changePassVisible} animationType="slide" transparent={false}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Change Password</Text>
          <TextInput
            placeholder="New Password"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
            style={styles.input}
          />
          <TouchableOpacity style={styles.saveButton} onPress={handleChangePassword}>
            <Text style={styles.saveText}>Update</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setChangePassVisible(false)}>
            <Text style={{ textAlign: 'center', marginTop: 10, color: 'gray' }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
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
  modalContent: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  hobbyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  hobbyButton: {
    borderWidth: 1,
    borderColor: '#FF6F00',
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 18,
    margin: 6,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  selectedHobby: {
    backgroundColor: '#FF6F00',
    borderColor: '#FF6F00',
  },
  hobbyButtonText: {
    color: '#FF6F00',
    fontWeight: '500',
  },
  selectedHobbyText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#f9f9f9',
    padding: 14,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: '#FF6F00',
    padding: 15,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 4,
  },
  saveText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

