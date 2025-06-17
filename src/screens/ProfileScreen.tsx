// ProfileScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, Button } from 'react-native';
import { getUserData } from '../services/Backend/Firebase/auth';
import { auth } from '../services/Backend/Firebase/firebase';
import { useThemeContext } from '../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';  // Navigation hook

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
  const navigation = useNavigation();  // Navigation hook

  const isDark = theme === 'dark';

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
      contentContainerStyle={[styles.container, { backgroundColor: isDark ? '#121212' : '#FFF' }]}
    >
      <View style={[styles.imageWrapper, { borderColor: isDark ? '#FFA726' : '#FF6F00' }]}>
        <Image
          source={{ uri: user.profilePicture || defaultImage }}
          style={styles.profileImage}
        />
      </View>

      <Text style={[styles.name, { color: isDark ? '#FFA726' : '#FF6F00' }]}>
        {user.name} {user.surname}, {user.age}
      </Text>
      <Text style={[styles.info, { color: isDark ? '#ccc' : '#666' }]}>
        {user.city} | {user.gender}
      </Text>
      <Text style={[styles.email, { color: isDark ? '#aaa' : '#777' }]}>
        {user.email}
      </Text>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: isDark ? '#FFA726' : '#FF6F00' }]}>
          Hobbies
        </Text>
        <View style={styles.hobbyList}>
          {user.hobbies.map((hobby, index) => (
            <Text
              key={index}
              style={[styles.hobbyItem, { backgroundColor: isDark ? '#333' : '#FF6F00', color: '#FFF' }]}
            >
              {hobby}
            </Text>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: isDark ? '#FFA726' : '#FF6F00' }]}>
          About Me
        </Text>
        <Text style={[styles.introduction, { color: isDark ? '#FFF' : '#000' }]}>
          {user.introduction}
        </Text>
      </View>

      {/* Düzenle Butonu */}
      <Button
        title="Edit Profile"
        onPress={() => navigation.navigate('EditProfile', { user })} // EditProfile ekranına yönlendir
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  imageWrapper: {
    marginBottom: 20,
    borderRadius: 100,
    overflow: 'hidden',
    borderWidth: 2,
  },
  profileImage: {
    width: 120,
    height: 120,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  info: {
    fontSize: 16,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    marginBottom: 12,
  },
  section: {
    width: '100%',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  introduction: {
    fontSize: 16,
    lineHeight: 22,
  },
  hobbyList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  hobbyItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 6,
    marginBottom: 6,
    fontSize: 14,
  },
});

export default ProfileScreen;
