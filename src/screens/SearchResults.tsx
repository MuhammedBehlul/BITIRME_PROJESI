import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useThemeContext } from '../contexts/ThemeContext';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

const SearchResults = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // MANUEL olarak buraya ngrok URL'nizi yazın
  const [backendUrl] = useState<string>(
    "http://192.168.1.32:8000" // kendi bilgisayarının IP adresi
  );




  const { theme } = useThemeContext();
  const { user, loading } = useAuth();
  const isDark = theme === 'dark';

  const db = getFirestore();

  // Backend URL otomatik fetch kaldırıldı, artık backendUrl hep sabit

  useEffect(() => {
    const fetchUsers = async () => {
      if (!user?.uid || !backendUrl) {
        setUsers([]);
        return;
      }

      setLoadingUsers(true);
      try {
        const uid = user.uid;
        const response = await axios.get(`${backendUrl}/same-cluster-users/${uid}`);
        const suggestedIds = response.data.user_ids || response.data.users?.map((user: any) => user.id) || [];

        if (suggestedIds.length === 0) {
          setUsers([]);
          return;
        }

        const promises = suggestedIds.map((id: string) => getDoc(doc(db, 'users', id)));
        const snapshots = await Promise.all(promises);

        const userInfoList = snapshots
          .map((snap, index) => (snap.exists() ? { id: suggestedIds[index], ...snap.data() } : null))
          .filter(Boolean) as any[];

        setUsers(userInfoList);
      } catch (error) {
        console.error('Kullanıcılar alınamadı:', error);
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };

    if (!loading) {
      fetchUsers();
    }
  }, [user, loading, backendUrl]);

const handleAccept = async () => {
  const acceptedUser = users[currentUserIndex];

  try {
    const currentUserId = user.uid;
    const otherUserId = acceptedUser.id;

    // chatId iki UID'nin alfabetik sıralı birleşimi
    const chatId = [currentUserId, otherUserId].sort().join('_');

    const chatRef = doc(db, 'chats', chatId);

    const chatData = {
        participants: [currentUserId, otherUserId],
        requestSentBy: currentUserId,
        requestStatus: 'pending',
        lastMessage: '',
        lastUpdated: serverTimestamp(),
        createdAt: serverTimestamp(),
        unreadCounts: {
          [currentUserId]: 0,
          [otherUserId]: 0,
        },
      };

    await setDoc(chatRef, chatData);

    console.log('Chat oluşturuldu (tekil koleksiyon):', chatId);
  } catch (error) {
    console.error('Chat isteği gönderilemedi:', error);
  }

  setCurrentUserIndex((prevIndex) => (prevIndex + 1) % users.length);
};



  const handleReject = () => {
    console.log('Kullanıcı reddedildi:', users[currentUserIndex]);
    setCurrentUserIndex((prevIndex) => (prevIndex + 1) % users.length);
  };

  if (loading || loadingUsers || !backendUrl) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#FFF' }]}>
        <ActivityIndicator size="large" color={isDark ? '#FFA726' : '#FF6F00'} />
        <Text style={{ marginTop: 10, color: isDark ? '#FFF' : '#000' }}>
          {backendUrl ? 'Loading...' : 'Waiting for Backend URL...'}
        </Text>
      </View>
    );
  }

  if (users.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#FFF' }]}>
        <Text style={{ color: isDark ? '#FFF' : '#000' }}>Hiç öneri bulunamadı.</Text>
      </View>
    );
  }

  const currentUser = users[currentUserIndex];

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#FFF' }]}>
      <Text style={[styles.title, { color: isDark ? '#FFA726' : '#FF6F00' }]}>Suggested People</Text>

      <View style={[styles.card, { backgroundColor: isDark ? '#1E1E1E' : '#FFF' }]}>
        <Image
          source={
            currentUser.profilePicture && currentUser.profilePicture.trim() !== ''
              ? { uri: currentUser.profilePicture }
              : require('../../assets/default-profile.jpg')
          }
          style={styles.userImage}
        />
        <Text style={[styles.name, { color: isDark ? '#FFA726' : '#FF6F00' }]}>
          {`${currentUser.name} ${currentUser.surname}, ${currentUser.age}`}
        </Text>
        <Text style={[styles.location, { color: isDark ? '#CCC' : '#666' }]}>{currentUser.city}</Text>
        <Text style={{ color: isDark ? '#FFF' : '#000', marginBottom: 10 }}>{currentUser.introduction}</Text>
        <Text style={{ color: isDark ? '#FFA726' : '#FF6F00' }}>Hobiler: {currentUser.hobbies?.join(', ')}</Text>

        <View style={styles.actions}>
          <TouchableOpacity onPress={handleReject}>
            <Ionicons name="close-circle" size={40} color="#D32F2F" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleAccept}>
            <Ionicons name="checkmark-circle" size={40} color="#388E3C" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const screenWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  card: {
    width: screenWidth * 0.9,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 5,
  },
  userImage: {
    width: screenWidth * 0.7,
    height: screenWidth * 0.7,
    borderRadius: 16,
    marginBottom: 15,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  location: {
    fontSize: 18,
    marginBottom: 10,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '60%',
    marginTop: 20,
  },
});

export default SearchResults;
