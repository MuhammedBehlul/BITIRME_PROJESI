import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  Image,
  TouchableOpacity
} from 'react-native';
import { GiftedChat } from 'react-native-gifted-chat';
import { useRoute } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import {
  getFirestore,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  where,
  doc,
  getDoc,
  updateDoc,
  increment
} from 'firebase/firestore';
import { useThemeContext } from '../contexts/ThemeContext';

const ChatScreen = () => {
  const [messages, setMessages] = useState([]);
  const [otherUserData, setOtherUserData] = useState(null);
  const [profileModalVisible, setProfileModalVisible] = useState(false);

  const { user } = useAuth();
  const route = useRoute();
  const params = route.params || {};
  const db = getFirestore();
  const defaultImage = 'https://www.w3schools.com/howto/img_avatar.png';

  const { theme } = useThemeContext();
  const isDark = theme === 'dark';

  const { chatId, otherUserId } = params;

  const getValidAvatar = (url) => {
    return url && typeof url === 'string' && url.trim().length > 5 ? url : defaultImage;
  };

  if (!chatId || !otherUserId) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: 'red', fontSize: 16 }}>
          Sohbet bilgisi eksik. Lütfen geri dönüp tekrar deneyin.
        </Text>
      </View>
    );
  }

  useEffect(() => {
    if (!chatId || !otherUserId) return;

    const fetchOtherUser = async () => {
      try {
        const docRef = doc(db, 'users', otherUserId);
        const userDoc = await getDoc(docRef);
        if (userDoc.exists()) {
          setOtherUserData(userDoc.data());
        }
      } catch (err) {
        // Hata yakalandı, ama console log kaldırıldı
      }
    };
    fetchOtherUser();
  }, [db, otherUserId]);

  useEffect(() => {
    if (!otherUserData) return;
    const q = query(
      collection(db, 'messages'),
      where('chatId', '==', chatId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs
        .map(doc => {
          const data = doc.data();
          if (!data.createdAt) {
            return null;
          }
          return {
            _id: doc.id,
            text: data.text,
            createdAt: data.createdAt.toDate(),
            user: {
              _id: data.from,
              name: data.from === user.uid ? 'Sen' : otherUserData?.name || 'Diğer',
              avatar: data.from === user.uid ? user.photoURL : getValidAvatar(otherUserData?.profilePicture),
            },
          };
        })
        .filter(m => m !== null);

      setMessages(msgs);

      // Kullanıcının unread sayısını sıfırla
      const chatRef = doc(db, 'chats', chatId);
      updateDoc(chatRef, {
        [`unreadCounts.${user.uid}`]: 0
      }).catch(() => {
        // Hata yakalandı, console log kaldırıldı
      });
    });

    return () => {
      unsubscribe();
    };
  }, [chatId, db, user.uid, otherUserId, otherUserData]);

  const onSend = useCallback(async (newMessages = []) => {
    if (newMessages.length === 0) return;

    const { text } = newMessages[0];

    // Mesajı anlık olarak ekle
    setMessages(previousMessages =>
      GiftedChat.append(previousMessages, [
        {
          _id: new Date().getTime().toString(),
          text,
          createdAt: new Date(),
          user: {
            _id: user.uid,
            name: 'Sen',
            avatar: user.photoURL,
          },
        },
      ])
    );

    try {
      await addDoc(collection(db, 'messages'), {
        text,
        from: user.uid,
        to: otherUserId,
        chatId,
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, 'chats', chatId), {
        lastUpdated: serverTimestamp(),
        lastMessage: text,
        [`unreadCounts.${otherUserId}`]: increment(1),
      });
    } catch {
      // Hata yakalandı, console log kaldırıldı
    }
  }, [db, chatId, otherUserId, user.uid]);

  const ProfileModal = () => (
    <Modal
      visible={profileModalVisible}
      animationType="slide"
      onRequestClose={() => setProfileModalVisible(false)}
    >
      <ScrollView contentContainerStyle={styles.modalContainer}>
        {otherUserData?.profilePicture ? (
          <Image source={{ uri: getValidAvatar(otherUserData?.profilePicture) }} style={styles.miniAvatar} />
        ) : (
          <View style={[styles.profileImage, styles.placeholderImage]}>
            <Text style={{ fontSize: 40, color: '#888' }}>
              {otherUserData?.name?.[0]}{otherUserData?.surname?.[0]}
            </Text>
          </View>
        )}
        <Text style={styles.profileName}>{otherUserData?.name} {otherUserData?.surname}</Text>
        <Text style={styles.profileDetail}>Yaş: {otherUserData?.age}</Text>
        <Text style={styles.profileDetail}>Şehir: {otherUserData?.city}</Text>
        <Text style={styles.profileDetail}>Cinsiyet: {otherUserData?.gender}</Text>
        <Text style={styles.profileDetail}>Hobiler: {otherUserData?.hobbies?.join(', ')}</Text>
        <Text style={styles.profileIntroduction}>{otherUserData?.introduction}</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => setProfileModalVisible(false)}
        >
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </ScrollView>
    </Modal>
  );

  return (
    <>
      {otherUserData && (
        <TouchableOpacity
          style={[
            styles.profileHeader,
            { backgroundColor: isDark ? '#1a1a1a' : '#f2f2f2' } // Dark/light mode rengi
          ]}
          onPress={() => setProfileModalVisible(true)}
        >
          <Image
            source={{ uri: getValidAvatar(otherUserData?.profilePicture) }}
            style={styles.miniAvatar}
            onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
          />

          <Text style={[styles.miniName, { color: isDark ? '#fff' : '#000' }]}>
            {otherUserData.name}
          </Text>
        </TouchableOpacity>

      )}

      <GiftedChat
        messages={messages}
        onSend={messages => onSend(messages)}
        user={{ _id: user.uid, name: 'Sen', avatar: user.photoURL }}
        placeholder="Mesaj yaz..."
        showUserAvatar
        showAvatarForEveryMessage
        scrollToBottom
        alwaysShowSend
      />
      <ProfileModal />
    </>
  );
};

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#121212',
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  miniAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#ccc'
  },
  miniName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: { padding: 20, alignItems: 'center' },
  profileImage: { width: 140, height: 140, borderRadius: 70, marginBottom: 15 },
  placeholderImage: { backgroundColor: '#ddd', justifyContent: 'center', alignItems: 'center' },
  profileName: { fontSize: 24, fontWeight: '700', marginBottom: 8 },
  profileDetail: { fontSize: 16, marginBottom: 6 },
  profileIntroduction: {
    fontStyle: 'italic',
    marginTop: 12,
    textAlign: 'center',
    fontSize: 15,
    color: '#444',
  },
  closeButton: {
    marginTop: 25,
    backgroundColor: '#FF6F00',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  closeButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});

export default ChatScreen;
