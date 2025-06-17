import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Modal,
  FlatList,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Platform 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeContext } from '../contexts/ThemeContext';
import { getAuth } from 'firebase/auth';
import { collection, getDocs, getFirestore, query, where } from 'firebase/firestore';

const screenWidth = Dimensions.get('window').width;

const HomeScreen = () => {
  const navigation = useNavigation();
  const { theme } = useThemeContext();
  const isDark = theme === 'dark';

  // Modal görünürlükleri
  const [modalVisible, setModalVisible] = useState(false); // Arkadaşla event seçimi modalı
  const [firstModalVisible, setFirstModalVisible] = useState(false); // Tek / Arkadaşla seçim modalı

  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showMatches, setShowMatches] = useState(false); // Sağ tarafta kişiler listesini gösterme kontrolü
  const [singleEventRecommendations, setSingleEventRecommendations] = useState([]);
  const [showSingleEventModal, setShowSingleEventModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectUserModalVisible, setSelectUserModalVisible] = useState(false);
  const [pairEventRecommendations, setPairEventRecommendations] = useState([]);
  const [pairEventModalVisible, setPairEventModalVisible] = useState(false);


  const auth = getAuth();
  const db = getFirestore();

  const currentUser = auth.currentUser;

  const defaultImage = 'https://www.w3schools.com/howto/img_avatar.png';

  // Start Search fonksiyonu
  const startSearch = () => {
    navigation.navigate('SearchResults');
  };

  // Event Search butonuna basılınca ilk modal açılır
  const openFirstModal = () => {
    setFirstModalVisible(true);
  };

  // İlk modaldaki "Tek kişilik event önerisi" seçimi
  const handleSingleEvent = async () => {
    setFirstModalVisible(false);
    try {
      const response = await fetch(
        `http://192.168.1.32:8000/recommendations?user_ids=${currentUser.uid}`
      );
      const data = await response.json();
      console.log('📌 Tek Kişilik Event Önerileri:', data.recommendations);

      // Önerileri state'e kaydet ve modal aç
      setSingleEventRecommendations(data.recommendations);

      // Burada yeni bir modal açabilir veya mevcut modala önerileri gösterebilirsin.
      // Örneğin, başka bir modal state'i ile açabilirsin:
      setShowSingleEventModal(true); 

    } catch (error) {
      console.error('Tek kişilik event önerisi hatası:', error);
      Alert.alert('Error', 'Could not get event suggestions.');
    }
};

  // İlk modaldaki "Arkadaşla event önerisi" seçimi
  const handleWithFriendEvent = () => {
    setFirstModalVisible(false);
    setModalVisible(true);
    setShowMatches(false);
    setMatches([]);
    fetchMatches();
  };

  // Firestore'dan eşleşen kullanıcıları çek
  const fetchMatches = async () => {
    if (!currentUser) return;

    console.log('🟡 fetchMatches başladı');
    console.log('🔐 currentUser UID:', currentUser.uid);

    setLoading(true);

    try {
      const chatsRef = collection(db, 'chats');

      // currentUser.uid 'nin olduğu ve status 'accepted' olan chatleri al
      const q = query(
        chatsRef,
        where('participants', 'array-contains', currentUser.uid),
        where('requestStatus', '==', 'accepted')
      );

      const chatSnapshots = await getDocs(q);
      console.log('📦 Bulunan accepted chat sayısı:', chatSnapshots.size);

      const otherUserUIDs: string[] = [];

      chatSnapshots.forEach((doc) => {
        const participants = doc.data().participants;
        console.log('📝 Chat katılımcıları:', participants);

        const otherUID = participants.find((uid: string) => uid !== currentUser.uid);
        if (otherUID) {
          otherUserUIDs.push(otherUID);
        }
      });

      console.log('👥 Diğer kullanıcı UID\'leri:', otherUserUIDs);

      const usersRef = collection(db, 'users');
      const matchedUsers = [];

      const chunkSize = 10; // Firestore 'in' sorgusu 10 eleman sınırı var
      for (let i = 0; i < otherUserUIDs.length; i += chunkSize) {
        const uidChunk = otherUserUIDs.slice(i, i + chunkSize);

        console.log('🔍 UID chunk sorgusu (doc IDs):', uidChunk);

        // UID'ler users koleksiyonundaki doküman ID'si olduğu için __name__ ile sorgula
        const userQuery = query(usersRef, where('__name__', 'in', uidChunk));
        const userSnapshot = await getDocs(userQuery);

        userSnapshot.forEach((userDoc) => {
          matchedUsers.push({ id: userDoc.id, ...userDoc.data() });
        });
      }

      console.log('✅ Eşleşen kullanıcılar:', matchedUsers);

      setMatches(matchedUsers);
      setShowMatches(true);
    } catch (err) {
      console.error('❌ fetchMatches hatası:', err);
      Alert.alert('Error', 'Could not get matches.');
    }

    setLoading(false);
  };




  // Seçilen kişiyle event önerisi ekranına git (iki kişilik öneri için)
  // Seçilen kişiyi state'e kaydet
const selectMatch = (user) => {
  setSelectedUser(user);
  setSelectUserModalVisible(false);
};

const [backendUrl] = useState<string>("http://192.168.1.32:8000");

const handleSuggest = async () => {
  try {
    if (!selectedUser) {
      Alert.alert('Hata', 'Lütfen bir kullanıcı seçin.');
      return;
    }

    const userIdsParam = `${currentUser.uid},${selectedUser.uid || selectedUser.id}`;
    const url = `http://192.168.1.32:8000/recommendations?user_ids=${encodeURIComponent(userIdsParam)}`;

    console.log('API isteği:', url);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('📌 İki Kişilik Event Önerileri:', data.recommendations);

    setPairEventRecommendations(data.recommendations);
    setPairEventModalVisible(true);

  } catch (error) {
    console.error('İki kişilik event önerisi hatası:', error);
    Alert.alert('Error', 'Could not get event suggestions.');
  }
};


  

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#FFF' }]}>
      <Text style={[styles.title, { color: isDark ? '#FFA726' : '#FF6F00' }]}>
        Find Friends & Events Near You
      </Text>

      {/* Start Search Butonu */}
      <View
        style={[
          styles.searchContainer,
          {
            backgroundColor: isDark ? '#FFA726' : '#FF6F00',
            shadowColor: isDark ? '#000' : '#000',
          },
        ]}
      >
        <Text style={styles.searchText}>Let's discover new friends!</Text>

        <TouchableOpacity
          style={[
            styles.startButton,
            {
              backgroundColor: isDark ? '#222' : '#FFF',
            },
          ]}
          onPress={startSearch}
        >
          <Text style={[styles.buttonText, { color: isDark ? '#FFA726' : '#FF6F00' }]}>
            Start Search
          </Text>
          <Ionicons
            name="ios-arrow-forward"
            size={24}
            color={isDark ? '#FFA726' : '#FF6F00'}
            style={styles.buttonIcon}
          />
        </TouchableOpacity>
      </View>

      {/* Event Search Butonu */}
      <View
        style={[
          styles.searchContainer,
          {
            backgroundColor: isDark ? '#FFB74D' : '#FF8F00',
            shadowColor: isDark ? '#000' : '#000',
            marginBottom: 20,
          },
        ]}
      >
        <Text style={[styles.searchText, { color: isDark ? '#222' : '#FFF' }]}>
          Find Events for Your Matches!
        </Text>

        <TouchableOpacity
          style={[
            styles.startButton,
            {
              backgroundColor: isDark ? '#222' : '#FFF',
            },
          ]}
          onPress={openFirstModal}
        >
          <Text style={[styles.buttonText, { color: isDark ? '#FFB74D' : '#FF8F00' }]}>
            Event Search
          </Text>
          <Ionicons
            name="calendar-outline"
            size={24}
            color={isDark ? '#FFB74D' : '#FF8F00'}
            style={styles.buttonIcon}
          />
        </TouchableOpacity>
      </View>

      {/* İlk Modal: Tek kişilik mi arkadaşla mı? */}
      <Modal
        visible={firstModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setFirstModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={[styles.firstModalContainer, { backgroundColor: isDark ? '#222' : '#FFF' }]}>
            <Text style={[styles.modalTitle, { color: isDark ? '#FFA726' : '#FF6F00', marginBottom: 25 }]}>
              Select Event Suggestion Type
            </Text>

            <TouchableOpacity
              style={[styles.optionButton, { backgroundColor: isDark ? '#FFA726' : '#FF6F00' }]}
              onPress={handleSingleEvent}
            >
              <Text style={[styles.optionText, { color: isDark ? '#222' : '#FFF' }]}>
                Single Person Event Suggestion
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionButton, { backgroundColor: isDark ? '#FFA726' : '#FF6F00', marginTop: 15 }]}
              onPress={handleWithFriendEvent}
            >
              <Text style={[styles.optionText, { color: isDark ? '#222' : '#FFF' }]}>
                Event Suggestion With Friend
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: isDark ? '#FFA726' : '#FF6F00', marginTop: 30 }]}
              onPress={() => setFirstModalVisible(false)}
            >
              <Text style={{ color: isDark ? '#222' : '#FFF', fontWeight: 'bold' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Tek Kişilik Event Önerisi Modalı */}
      <Modal
        visible={showSingleEventModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowSingleEventModal(false)}
      >
        <View style={styles.modalBackground}>
          <View style={[styles.modalContainer, { backgroundColor: isDark ? '#222' : '#FFF' }]}>
            <Text style={[styles.modalTitle, { color: isDark ? '#FFA726' : '#FF6F00' }]}>
              Recommended Events For You
            </Text>

            <ScrollView style={{ maxHeight: 300, marginTop: 20 }}>
              {singleEventRecommendations.length === 0 ? (
        <Text style={{ color: isDark ? '#FFF' : '#000', textAlign: 'center' }}>
          No event recommendations found.
        </Text>
      ) : (
        singleEventRecommendations.map((event, index) => (
          <View
            key={index}
            style={[
              styles.recommendationCard,
              { backgroundColor: isDark ? '#333' : '#EEE', marginBottom: 12 },
            ]}
          >
            <Text style={{ color: isDark ? '#FFA726' : '#FF6F00', fontSize: 16, fontWeight: 'bold' }}>
              🎯 {event.title || `Event ${index + 1}`}
            </Text>
            <Text style={{ color: isDark ? '#CCC' : '#555', marginTop: 4 }}>
              📍 {event.location || 'Unknown location'}
            </Text>
            <Text style={{ color: event.score > 0.35 ? '#4CAF50' : '#FFA000', marginTop: 4 }}>
              ⭐ Skor: {event.score.toFixed(3)}
            </Text>
          </View>
        ))
      )}

      </ScrollView>

      <TouchableOpacity
        style={[styles.closeButton, { backgroundColor: isDark ? '#FFA726' : '#FF6F00', marginTop: 20 }]}
        onPress={() => setShowSingleEventModal(false)}
      >
        <Text style={{ color: isDark ? '#222' : '#FFF', fontWeight: 'bold' }}>Close</Text>
      </TouchableOpacity>
        </View>
      </View>
    </Modal>



      {/* Arkadaşla Event Önerisi Modalı */}
      <Modal
      visible={modalVisible}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalBackground}>
        <View style={[styles.modalContainer, { backgroundColor: isDark ? '#222' : '#FFF' }]}>
          <Text style={[styles.modalTitle, { color: isDark ? '#FFA726' : '#FF6F00' }]}>
            Select a person for event suggestion
          </Text>

          <View style={styles.modalContent}>
          {/* Sol taraf: Kullanıcı profili */}
          <View style={styles.profileBox}>
            <Image
              source={{ uri: currentUser?.photoURL || defaultImage }}
              style={styles.avatar}
            />
            <Text style={[styles.userName, { color: isDark ? '#FFF' : '#000', fontWeight: '600' }]}>
              {currentUser?.displayName || 'User'}
            </Text>
            <Text style={[styles.youText, { color: isDark ? '#FFA726' : '#FF6F00', marginTop: 4 }]}>
              You
            </Text>
          </View>

          {/* Sağ taraf: Seçili kullanıcı ya da + butonu */}
          <View style={styles.rightSide}>
          {selectedUser ? (
            <View style={styles.selectedUserBox}>
              <Image
                source={{ uri: selectedUser.photoURL || defaultImage }}
                style={styles.selectedUserAvatar}
              />
              <Text style={[styles.selectedUserName, { color: isDark ? '#FFF' : '#000' }]}>
                {selectedUser.displayName || selectedUser.name || 'No Name'}
              </Text>
              <Text style={[styles.youText, { color: isDark ? '#FFA726' : '#FF6F00', marginTop: 4 }]}>
                Your friend
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: isDark ? '#FFA726' : '#FF6F00' }]}
              onPress={() => setSelectUserModalVisible(true)}
            >
              <Ionicons name="add-outline" size={48} color={isDark ? '#222' : '#FFF'} />
            </TouchableOpacity>
          )}
        </View>
        </View>

          {/* Suggest Event butonu*/}
          {selectedUser && (
            <TouchableOpacity
              style={[styles.suggestButton, { backgroundColor: isDark ? '#FFA726' : '#FF6F00', alignSelf: 'center', marginVertical: 12 }]}
              onPress={handleSuggest}
            >
              <Text style={{ color: isDark ? '#222' : '#FFF', fontWeight: '700', fontSize: 16 }}>
                Suggest Event
              </Text>
            </TouchableOpacity>
          )}

            {/* Close butonu */}
            <TouchableOpacity
              style={styles.dangerButton}
              onPress={() => {
                setSelectedUser(null);
                setModalVisible(false);
              }}
            >
              <Text style={styles.dangerButtonText}>Cancel</Text>
            </TouchableOpacity>

        </View>
      </View>
    </Modal>

    {/* Kişi Seçme Modalı */}
    <Modal
      visible={selectUserModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setSelectUserModalVisible(false)}
    >
      <View style={styles.modalBackground}>
        <View style={[styles.modalContainer, { backgroundColor: isDark ? '#222' : '#FFF', maxHeight: '70%' }]}>
          <Text style={[styles.modalTitle, { color: isDark ? '#FFA726' : '#FF6F00' }]}>
            Select a user
          </Text>

          {loading ? (
            <ActivityIndicator size="large" color={isDark ? '#FFA726' : '#FF6F00'} />
          ) : (
            <ScrollView style={styles.matchesList}>
              {matches.length === 0 ? (
                <Text style={{ color: isDark ? '#FFF' : '#000', textAlign: 'center', marginTop: 20 }}>
                  No matches found
                </Text>
              ) : (
                matches.map((user) => (
                  <TouchableOpacity
                    key={user.id}
                    style={[
                      styles.matchRow,
                      {
                        backgroundColor:
                          selectedUser?.id === user.id
                            ? isDark ? '#FFA726' : '#FF6F00'
                            : 'transparent',
                      },
                    ]}
                    onPress={() => selectMatch(user)}
                    activeOpacity={0.7}
                  >
                    <Image
                      source={{ uri: user.photoURL || defaultImage }}
                      style={styles.matchAvatar}
                    />
                    <Text style={[styles.matchName, { color: isDark ? '#FFF' : '#000' }]}>
                      {user.displayName || user.name || 'No Name'}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          )}

          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: isDark ? '#FFA726' : '#FF6F00', marginTop: 10 }]}
            onPress={() => setSelectUserModalVisible(false)}
          >
            <Text style={{ color: isDark ? '#222' : '#FFF', fontWeight: 'bold' }}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
    {/* Çift Kişilik Event Öneri Modalı */}
<Modal
  visible={pairEventModalVisible}
  animationType="fade"
  transparent={true}
  onRequestClose={() => setPairEventModalVisible(false)}
>
  <View style={styles.modalBackground}>
    <View style={[styles.modalContainer, { backgroundColor: isDark ? '#222' : '#FFF' }]}>
      <Text style={[styles.modalTitle, { color: isDark ? '#FFA726' : '#FF6F00' }]}>
        Recommended Events For You & {selectedUser?.displayName || selectedUser?.name || 'Friend'}
      </Text>

      <ScrollView style={{ maxHeight: 300, marginTop: 20 }}>
        {pairEventRecommendations.length === 0 ? (
          <Text style={{ color: isDark ? '#FFF' : '#000', textAlign: 'center' }}>
            No event recommendations found.
          </Text>
        ) : (
          pairEventRecommendations.map((event, index) => (
            <View
              key={index}
              style={[
                styles.recommendationCard,
                { backgroundColor: isDark ? '#333' : '#EEE', marginBottom: 12 },
              ]}
            >
              <Text style={{ color: isDark ? '#FFA726' : '#FF6F00', fontSize: 16, fontWeight: 'bold' }}>
                🎯 {event.title || `Event ${index + 1}`}
              </Text>
              <Text style={{ color: isDark ? '#CCC' : '#555', marginTop: 4 }}>
                📍 {event.location || 'Unknown location'}
              </Text>
              <Text style={{ color: event.score > 0.35 ? '#4CAF50' : '#FFA000', marginTop: 4 }}>
                ⭐ Skor: {event.score.toFixed(3)}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      <TouchableOpacity
        style={[styles.closeButton, { backgroundColor: isDark ? '#FFA726' : '#FF6F00', marginTop: 20 }]}
        onPress={() => setPairEventModalVisible(false)}
      >
        <Text style={{ color: isDark ? '#222' : '#FFF', fontWeight: 'bold' }}>Close</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>


    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 30,
    marginBottom: 15,
    textAlign: 'center',
  },
  searchContainer: {
    width: screenWidth * 0.9,
    height: screenWidth * 0.6,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 7,
    elevation: 6,
    marginBottom: 25,
  },

  searchText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  startButton: {
    width: '70%',
    height: 50,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 7,
    elevation: 5,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonIcon: {
    marginLeft: 10,
  },

  eventContainer: {
    width: screenWidth * 0.6,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },

  // Modallar
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContainer: {
    width: '90%',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  firstModalContainer: {
    width: '85%',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },

  optionButton: {
    width: '90%',
    paddingVertical: 12,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 18,
    fontWeight: '600',
  },

  closeButton: {
    width: 120,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContent: {
    flexDirection: 'row',
    marginTop: 15,
    width: '100%',
    justifyContent: 'space-between',
  },

  profileBox: {
  width: '45%',
  height: 200,             
  justifyContent: 'center',
  alignItems: 'center',
  borderRightWidth: 1,
  borderColor: '#ccc',
  paddingRight: 12,
  paddingVertical: 10,
},

avatar: {
  width: 70,
  height: 70,
  borderRadius: 35,
},

userName: {
  fontSize: 18,
  marginTop: 10,
  fontWeight: '600',
},

youText: {
  fontSize: 14,
  fontWeight: '700',
},

rightSide: {
  width: '45%',
  height: 200,
  justifyContent: 'center',
  alignItems: 'center',
  paddingLeft: 12,
},

  addButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  matchList: {
    width: '100%',
    maxHeight: 250,
  },

  matchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },

  avatarSmall: {
    width: 35,
    height: 35,
    borderRadius: 17,
    marginRight: 12,
  },
  recommendationCard: {
  padding: 15,
  borderRadius: 10,
  marginVertical: 8,
  marginHorizontal: 10,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 3,
  elevation: 3,
},matchesList: {
    flexGrow: 0,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    borderBottomColor: 'rgba(0,0,0,0.1)', // hafif ayırıcı
  },
  matchAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#ccc',
  },
  matchName: {
    fontWeight: '600',
    fontSize: 16,
  },
  
selectedUserBox: {
  alignItems: 'center',
  marginBottom: 12,
},

selectedUserAvatar: {
  width: 75,
  height: 75,
  borderRadius: 40,
  marginBottom: 6,
},

selectedUserName: {
  fontWeight: '600',
  fontSize: 18,  
  textAlign: 'center',
},

suggestButton: {
  paddingVertical: 12,
  paddingHorizontal: 36,
  borderRadius: 25,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.3,
  shadowRadius: 4,
  elevation: 6,
},
dangerButton: {
  paddingVertical: 12,
  paddingHorizontal: 36,
  borderRadius: 25,
  alignSelf: 'center',
  backgroundColor: '#D32F2F', // Koyu kırmızı
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.3,
  shadowRadius: 4,
  elevation: 6,
  marginTop: 8,
},
dangerButtonText: {
  color: '#FFF',
  fontWeight: '700',
  fontSize: 16,
  textAlign: 'center',
},




});

export default HomeScreen;
