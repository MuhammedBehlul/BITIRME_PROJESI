import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useThemeContext } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');

const RequestsScreen = () => {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [usersData, setUsersData] = useState({});
  const [loadingProfile, setLoadingProfile] = useState(false);
  const db = getFirestore();
  const { user } = useAuth();
  const { theme } = useThemeContext();
  const isDark = theme === 'dark';


  useEffect(() => {
    const q = query(
      collection(db, 'chats'),
      where('requestStatus', '==', 'pending'),
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pendingRequests = snapshot.docs
        .map((doc) => ({
          chatId: doc.id,
          ...doc.data(),
        }))
        .filter((r) => r.participants.find((uid) => uid !== user.uid));

      setRequests(pendingRequests);
    });

    return () => unsubscribe();
  }, [db, user.uid]);

  const fetchUserData = async (userId) => {
    if (usersData[userId]) return;
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        setUsersData((prev) => ({ ...prev, [userId]: userDoc.data() }));
      }
    } catch (e) {
      console.log('Failed to fetch user data:', e);
    }
  };

  useEffect(() => {
    requests.forEach((req) => {
      const otherUserId = req.participants.find((uid) => uid !== user.uid);
      fetchUserData(otherUserId);
    });
  }, [requests]);

  const onRequestPress = (request) => {
    const otherUserId = request.participants.find((uid) => uid !== user.uid);
    setSelectedRequest(request);
    setLoadingProfile(true);

    if (!usersData[otherUserId]) {
      getDoc(doc(db, 'users', otherUserId))
        .then((docSnap) => {
          if (docSnap.exists()) {
            setUsersData((prev) => ({ ...prev, [otherUserId]: docSnap.data() }));
          } else {
            Alert.alert('Error', 'User data could not be loaded.');
          }
        })
        .catch(() => Alert.alert('Error', 'User data could not be loaded.'))
        .finally(() => {
          setLoadingProfile(false);
          setProfileModalVisible(true);
        });
    } else {
      setLoadingProfile(false);
      setProfileModalVisible(true);
    }
  };

  const handleAccept = async () => {
    if (!selectedRequest) return;
    try {
      await updateDoc(doc(db, 'chats', selectedRequest.chatId), {
        requestStatus: 'accepted',
        lastUpdated: serverTimestamp(),
      });
      Alert.alert('Success', 'Chat request accepted.');
      setProfileModalVisible(false);
    } catch {
      Alert.alert('Error', 'Failed to accept the request.');
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    try {
      await updateDoc(doc(db, 'chats', selectedRequest.chatId), {
        requestStatus: 'rejected',
        lastUpdated: serverTimestamp(),
      });
      Alert.alert('Info', 'Chat request rejected.');
      setProfileModalVisible(false);
    } catch {
      Alert.alert('Error', 'Failed to reject the request.');
    }
  };

  const ProfileModal = () => {
    if (!selectedRequest) return null;
    const otherUserId = selectedRequest.participants.find((uid) => uid !== user.uid);
    const otherUserData = usersData[otherUserId];

    return (
      <Modal
      visible={profileModalVisible}
      animationType="slide"
      onRequestClose={() => setProfileModalVisible(false)}
      transparent
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: isDark ? '#1c1c1c' : '#fff' }]}>
          {loadingProfile ? (
            <ActivityIndicator size="large" color="#FF6F00" style={{ marginTop: 100 }} />
          ) : (
            <>
              <View style={styles.headerImageContainer}>
                {otherUserData?.profilePicture ? (
                  <Image source={{ uri: otherUserData.profilePicture }} style={styles.profileImage} />
                ) : (
                  <View style={[styles.profileImage, styles.placeholderImageOrange]}>
                    <Text style={styles.placeholderText}>
                      {otherUserData?.name?.[0]}{otherUserData?.surname?.[0]}
                    </Text>
                  </View>
                )}
                <View style={styles.onlineBadge} />
              </View>

              <Text style={[styles.profileName, { color: isDark ? '#FFA726' : '#FF6F00' }]}>
                {otherUserData?.name} {otherUserData?.surname},{' '}
                <Text style={[styles.ageText, { color: isDark ? '#ddd' : '#333' }]}>{otherUserData?.age}</Text>
              </Text>

              <Text style={[styles.locationText, { color: isDark ? '#bbb' : '#666' }]}>{otherUserData?.city}</Text>

              <View style={styles.hobbiesContainer}>
                {(otherUserData?.hobbies || []).map((hobby, i) => (
                  <View
                    key={i}
                    style={[styles.hobbyBadge, { backgroundColor: isDark ? '#333' : '#FFE0B2' }]}
                  >
                    <Text style={[styles.hobbyText, { color: '#FF6F00' }]}>{hobby}</Text>
                  </View>
                ))}
              </View>

              <ScrollView
                style={styles.introContainer}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
              >
                <Text style={{ color: isDark ? '#fff' : '#333', fontSize: 16, lineHeight: 22 }}>
                  {otherUserData?.introduction || 'No introduction provided.'}
                </Text>
              </ScrollView>

              <View style={styles.buttonsRow}>
                <TouchableOpacity
                  style={[styles.button, styles.acceptButton]}
                  onPress={handleAccept}
                >
                  <Text style={styles.buttonText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.rejectButton]}
                  onPress={handleReject}
                >
                  <Text style={styles.buttonText}>Reject</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setProfileModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#f5f5f5' }]}>
      <View style={[styles.headerContainer, { backgroundColor: isDark ? '#121212' : '#f5f5f5' } ]}>
        <Text style={[styles.headerTitle, { color: isDark ? '#FFA726' : '#FF6F00' }]}>Requests</Text>
      </View>

      <FlatList
        data={requests}
        keyExtractor={(item) => item.chatId}
        contentContainerStyle={{ paddingVertical: 12 }}
        renderItem={({ item }) => {
          const otherUserId = item.participants.find((uid) => uid !== user.uid);
          const otherUserData = usersData[otherUserId];

          return (
            <TouchableOpacity
              style={[styles.requestItem, { backgroundColor: isDark ? '#1e1e1e' : '#fff' }]}
              onPress={() => onRequestPress(item)}
              activeOpacity={0.8}
            >
              <View style={styles.listItemRow}>
                {otherUserData?.profilePicture ? (
                  <Image source={{ uri: otherUserData.profilePicture }} style={styles.listProfileImage} />
                ) : (
                  <View style={[styles.listProfileImage, styles.placeholderImageOrange]}>
                    <Text style={styles.placeholderText}>
                      {otherUserData?.name?.[0]}{otherUserData?.surname?.[0]}
                    </Text>
                  </View>
                )}
                <View style={styles.listTextContainer}>
                  <Text style={{ color: isDark ? '#fff' : '#000', fontWeight: 'bold', fontSize: 16 }}>
                    {otherUserData ? `${otherUserData.name} ${otherUserData.surname}` : 'Loading...'}
                  </Text>
                  <Text style={{ color: isDark ? '#ccc' : '#666' }}>
                    Status: {item.requestStatus}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={{ color: isDark ? '#aaa' : '#888' }}>No pending chat requests.</Text>
          </View>
        )}
      />

      {profileModalVisible && <ProfileModal />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
  paddingTop: 16,
  paddingBottom: 8,
  paddingHorizontal: 16,
  backgroundColor: '#FFFFFF',
  borderBottomWidth: 1,
  borderBottomColor: '#EEEEEE',
},

headerTitle: {
  fontSize: 24,
  fontWeight: '700',
  color: '#FF6F00',
},
  requestItem: {
    backgroundColor: '#F9F9F9',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 14,
    shadowColor: '#BBB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  listItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requestText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222222',
  },
  statusText: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  listProfileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  placeholderImageOrange: {
    backgroundColor: '#FF6F00', // Turuncu
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  listTextContainer: {
    marginLeft: 16,
    justifyContent: 'center',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalContent: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: '#FAFAFA',
    borderRadius: 18,
    padding: 24,
    shadowColor: '#00000044',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },
  headerImageContainer: {
    alignSelf: 'center',
    marginBottom: 18,
    position: 'relative',
  },
  profileImage: {
    width: width * 0.4,
    height: width * 0.4,
    borderRadius: 28,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 16,
    height: 16,
    backgroundColor: '#34C759',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FAFAFA',
  },
  profileName: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    color: '#222222',
  },
  ageText: {
    fontWeight: '400',
    color: '#888888',
  },
  locationText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#555555',
    marginVertical: 6,
  },
  hobbiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginVertical: 12,
  },
  hobbyBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    margin: 6,
  },
  hobbyText: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '600',
  },
  introContainer: {
    maxHeight: 140,
    marginVertical: 10,
  },
  profileIntroduction: {
    fontSize: 18,          // büyütüldü
    fontWeight: '700',     // bold yapıldı
    color: '#444444',
    lineHeight: 26,        // okunabilirlik için artırıldı
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 6,
    borderRadius: 28,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#4CAF50', // Green
  },
  rejectButton: {
    backgroundColor: '#E53935', // Red
  },
  buttonText: {
    color: '#FAFAFA',
    fontWeight: '700',
    fontSize: 16,
  },
  closeButton: {
    marginTop: 18,
    alignSelf: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#FF6F00',  // Turuncu
    fontWeight: '700',
  },

  // Empty list
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#888888',
  },
});

export default RequestsScreen;
