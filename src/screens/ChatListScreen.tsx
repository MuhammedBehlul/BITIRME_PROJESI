import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
} from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useThemeContext } from '../contexts/ThemeContext';

const ChatList = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const navigation = useNavigation();
  const db = getFirestore();
  const { theme } = useThemeContext();
  const isDark = theme === 'dark';

  useEffect(() => {
    if (!user?.uid) return;

    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid),
      where('requestStatus', '==', 'accepted'),
      orderBy('lastUpdated', 'desc')
    );

    const unsubscribe = onSnapshot(chatsQuery, async (snapshot) => {

      const chatsData = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const chat = docSnap.data();
          const chatId = docSnap.id;
          const otherUserId = chat.participants.find((id) => id !== user.uid);

          let otherUserData = null;
          if (otherUserId) {
            const otherUserDoc = await getDoc(doc(db, 'users', otherUserId));
            if (otherUserDoc.exists()) {
              otherUserData = otherUserDoc.data();
              
            }else {
            console.warn('[ChatList] otherUserId kullanıcı bulunamadı');
          }
          }

          const unreadCount = chat.unreadCounts?.[user.uid] ?? 0;

          return {
            id: chatId,
            lastMessage: chat.lastMessage || '',
            lastUpdated: chat.lastUpdated ? chat.lastUpdated.toDate() : new Date(),
            otherUserId,
            otherUserName: otherUserData
              ? `${otherUserData.name} ${otherUserData.surname}`
              : 'Unknown',
            otherUserProfilePicture: otherUserData?.profilePicture || null,
            unreadCount,
          };
        })
      );
      setChats(chatsData);
    });

    return () => unsubscribe();
  }, [user]);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.chatItem, { backgroundColor: isDark ? '#1e1e1e' : '#fff' }]}
      onPress={() =>
        navigation.navigate('ChatsScreen', {
          chatId: item.id,
          otherUserId: item.otherUserId,
        })
      }
    >
      <View style={styles.avatarContainer}>
        {item.otherUserProfilePicture ? (
          <Image source={{ uri: item.otherUserProfilePicture }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={[styles.avatarText , { color: isDark ? '#000' : '#fff', fontWeight: 'bold' }]}>
              {item.otherUserName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      <View style={[styles.chatContent, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
  <View style={styles.chatHeader}>
    <Text style={[styles.name, { color: isDark ? '#fff' : '#000' }]} numberOfLines={1}>
      {item.otherUserName}
    </Text>

    {item.unreadCount > 0 && (
      <View style={styles.unreadBadge}>
        <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
      </View>
    )}

    <Text style={[styles.date, { color: isDark ? '#aaa' : '#555' }]}>
      {item.lastUpdated.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })}
    </Text>
  </View>

  <Text style={[styles.lastMessage, { color: isDark ? '#ccc' : '#666' }]} numberOfLines={1}>
    {item.lastMessage || 'No messages yet'}
  </Text>
</View>
    </TouchableOpacity>
  );

  if (!user) {
  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#fff' }]}>
      <Text style={{ color: isDark ? '#fff' : '#000' }}>You need to log in.</Text>
    </View>
  );
}

return (
  <View style={{ flex: 1, backgroundColor: isDark ? '#121212' : '#fff' }}>
    <View style={[styles.header, { backgroundColor: isDark ? '#1f1f1f' : '#f5f5f5' }]}>
      <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>Chats</Text>
    </View>

    {chats.length === 0 ? (
      <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#fff' }]}>
        <Text style={{ color: isDark ? '#ccc' : '#666' }}>No chats yet.</Text>
      </View>
    ) : (
      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        style={{ backgroundColor: isDark ? '#121212' : '#fff' }}
      />
    )}
  </View>
);
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { flex: 1, backgroundColor: '#f9f9f9' },
  header: {
  flexDirection: 'row',
  justifyContent: 'flex-start',  // burayı flex-start yap
  alignItems: 'center',
  paddingTop: 50,
  paddingBottom: 16,
  paddingHorizontal: 20,
  backgroundColor: '#fff',
  borderBottomWidth: 1,
  borderBottomColor: '#eee',
  elevation: 2,
  shadowColor: '#000',
  shadowOpacity: 0.05,
  shadowOffset: { width: 0, height: 2 },
  shadowRadius: 4,
},
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  chatItem: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFA726',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  chatContent: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111',
    flexShrink: 1,
    marginRight: 4,
  },
  date: {
    fontSize: 12,
    color: '#999',
    marginLeft: 'auto',
  },
  lastMessage: {
    fontSize: 14,
    color: '#555',
  },
  unreadBadge: {
    backgroundColor: 'red',
    borderRadius: 10,
    minWidth: 20,
    paddingHorizontal: 6,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  unreadBadgeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
});

export default ChatList;
