// ProfileScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { getUserData } from '../services/Backend/Firebase/auth';
import { auth } from '../services/Backend/Firebase/firebase';
import * as ImagePicker from 'expo-image-picker';
import { uploadProfilePicture } from '../services/Backend/Firebase/uploadProfilePicture';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/Backend/Firebase/firebase';
import { useThemeContext } from '../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

interface UserProfile {
  name: string;
  surname: string;
  age: string;
  city: string;
  gender: string;
  email: string;
  hobbies: string[];
  introduction: string;
  profilePicture: string | null;
}

const ProfileScreen = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { theme } = useThemeContext();
  const navigation = useNavigation();
  const isDark = theme === 'dark';

  const handleProfileImageChange = async () => {
  try {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert("Access to gallery required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets.length > 0) {
      const imageUri = result.assets[0].uri;
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const downloadURL = await uploadProfilePicture(userId, imageUri);

      if (downloadURL) {
        const userDocRef = doc(db, 'users', userId);
        await updateDoc(userDocRef, { profilePicture: downloadURL });

        // Anlık state güncelle
        setUser((prevUser) =>
          prevUser ? { ...prevUser, profilePicture: downloadURL } : prevUser
        );
      }
    }
  } catch (error) {
    console.error('Profil resmi değiştirilirken hata:', error);
  }
};


  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (userId) {
          const userData = await getUserData(userId);
          setUser(userData as UserProfile);
        }
      } catch (error) {
        console.error('Error fetching user data: ', error);
      } finally {
        setLoading(false);
      }
    };

    if (auth.currentUser) {
      fetchUserData();
    }
  }, []);

  if (loading) return <Text style={{ color: isDark ? '#fff' : '#000' }}>Yükleniyor...</Text>;
  if (!user) return <Text style={{ color: isDark ? '#fff' : '#000' }}>Kullanıcı verisi bulunamadı.</Text>;

  const defaultImage = 'https://www.w3schools.com/howto/img_avatar.png';

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: isDark ? '#121212' : '#f9f9f9' }]}
    >
      <View style={styles.headerSection}>
        <View style={[styles.imageWrapper, { borderColor: isDark ? '#FFA726' : '#FF6F00' }]}>
          <Image source={{ uri: user.profilePicture || defaultImage }} style={styles.profileImage} />
        </View>

        <TouchableOpacity style={styles.editPhotoButton} onPress={handleProfileImageChange}>
          <Ionicons name="camera" size={20} color="#fff" />
          <Text style={styles.editPhotoText}>Change/Add Photo</Text>
        </TouchableOpacity>

        <Text style={[styles.name, { color: isDark ? '#FFA726' : '#FF6F00' }]}>
          {user.name} {user.surname}, {user.age}
        </Text>
        <Text style={[styles.info, { color: isDark ? '#ccc' : '#666' }]}>
          {user.city} | {user.gender}
        </Text>
        <Text style={[styles.email, { color: isDark ? '#aaa' : '#777' }]}>{user.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: isDark ? '#FFA726' : '#FF6F00' }]}>Hobbies</Text>
        <View style={styles.hobbyList}>
          {user.hobbies.map((hobby, index) => (
            <View key={index} style={[styles.hobbyItem, { backgroundColor: isDark ? '#333' : '#FFE0B2' }]}>
              <Ionicons name="heart" size={14} color="#FF6F00" style={{ marginRight: 6 }} />
              <Text style={{ color: '#FF6F00' }}>{hobby}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: isDark ? '#FFA726' : '#FF6F00' }]}>About</Text>
        <View style={[styles.aboutBox, { backgroundColor: isDark ? '#1f1f1f' : '#fff' }]}>
          <Text style={{ color: isDark ? '#fff' : '#333', fontSize: 16, lineHeight: 22 }}>
            {user.introduction}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.editButton, { backgroundColor: isDark ? '#FFA726' : '#FF6F00' }]}
        onPress={() => navigation.navigate('EditProfile', { user })}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>Edit Profile</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  imageWrapper: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  editPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6F00',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  editPhotoText: {
    color: '#fff',
    marginLeft: 6,
    fontSize: 14,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  info: {
    fontSize: 16,
  },
  email: {
    fontSize: 14,
  },
  section: {
    width: '100%',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  hobbyList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  hobbyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  aboutBox: {
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  editButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 24,
  },
});

export default ProfileScreen;
