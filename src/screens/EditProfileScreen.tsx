import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext'; // AuthContext'i import ediyoruz
import { updateUserData } from '../services/Backend/Firebase/auth'; // Firestore güncelleme fonksiyonu
import { fetchUserData } from '../services/Backend/Firebase/firestore'; // Firestore verisi çekme fonksiyonu
import { useThemeContext } from '../contexts/ThemeContext'; // Tema Context'ini import ediyoruz

const EditProfileScreen = () => {
  const { user } = useAuth(); // AuthContext'ten kullanıcıyı alıyoruz
  const { theme } = useThemeContext(); // Tema bilgisi

  // Eğer kullanıcı yoksa, ekran gösterilmez
  if (!user) {
    return (
      <View>
        <Text>Loading...</Text>
      </View>
    );
  }

  // Firestore'dan alınacak veri
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const getUserData = async () => {
      const data = await fetchUserData(user.uid);
      setUserData(data); // Veriyi state'e kaydediyoruz
    };
    if (user?.uid) {
      getUserData();
    }
  }, [user]);

  // Kullanıcı verisi yüklendikten sonra formu başlat
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [age, setAge] = useState('');
  const [city, setCity] = useState('');
  const [introduction, setIntroduction] = useState('');

  useEffect(() => {
    if (userData) {
      // Firestore'dan gelen kullanıcı verisiyle formu başlatma
      setName(userData.name || '');
      setSurname(userData.surname || '');
      setAge(userData.age ? userData.age.toString() : ''); // Burada 'age' değerini string'e çeviriyoruz
      setCity(userData.city || '');
      setIntroduction(userData.introduction || '');
    }
  }, [userData]);

  const handleSave = async () => {
    const parsedAge = parseInt(age, 10);
    const updatedUser = {
      name: name || '',
      surname: surname || '',
      age: isNaN(parsedAge) ? null : parsedAge,
      city: city || '',
      introduction: introduction || '',
    };

    try {
      if (!user?.uid) {
        throw new Error("User ID is missing.");
      }

      await updateUserData(user.uid, updatedUser);

      Alert.alert("Success", "Profile updated successfully.");
    } catch (error) {
      console.error("Error updating user data:", error);
      Alert.alert("Error", "Failed to update profile.");
    }
  };

  // Kullanıcı verisi yüklenene kadar boş bir ekran göstermek
  if (!userData) {
    return (
      <View>
        <Text>Loading user data...</Text>
      </View>
    );
  }

  const isDark = theme === 'dark'; // Tema durumu

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: isDark ? '#121212' : '#FFF' }]}>
      <Text style={[styles.title, { color: isDark ? '#FFA726' : '#FF6F00' }]}>Edit Profile</Text>

      <Text style={[styles.label, { color: isDark ? '#CCC' : '#555' }]}>First Name</Text>
      <TextInput
        style={[styles.input, { backgroundColor: isDark ? '#333' : '#FFF', color: isDark ? '#FFF' : '#000' }]}
        placeholder="Enter your first name"
        value={name}
        onChangeText={setName}
      />

      <Text style={[styles.label, { color: isDark ? '#CCC' : '#555' }]}>Last Name</Text>
      <TextInput
        style={[styles.input, { backgroundColor: isDark ? '#333' : '#FFF', color: isDark ? '#FFF' : '#000' }]}
        placeholder="Enter your last name"
        value={surname}
        onChangeText={setSurname}
      />

      <Text style={[styles.label, { color: isDark ? '#CCC' : '#555' }]}>Age</Text>
      <TextInput
        style={[styles.input, { backgroundColor: isDark ? '#333' : '#FFF', color: isDark ? '#FFF' : '#000' }]}
        placeholder="Enter your age"
        value={age}
        onChangeText={setAge}
        keyboardType="numeric"
      />

      <Text style={[styles.label, { color: isDark ? '#CCC' : '#555' }]}>City</Text>
      <TextInput
        style={[styles.input, { backgroundColor: isDark ? '#333' : '#FFF', color: isDark ? '#FFF' : '#000' }]}
        placeholder="City"
        value={city}
        onChangeText={setCity}
      />

      <Text style={[styles.label, { color: isDark ? '#CCC' : '#555' }]}>About</Text>
      <TextInput
        style={[styles.input, styles.multiline, { backgroundColor: isDark ? '#333' : '#FFF', color: isDark ? '#FFF' : '#000' }]}
        placeholder="Write something about yourself"
        value={introduction}
        onChangeText={setIntroduction}
        multiline
        numberOfLines={4}
      />

      <Button title="Save" onPress={handleSave} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  label: {
    marginBottom: 4,
    fontWeight: '500',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  multiline: {
    height: 100,
    textAlignVertical: 'top',
  },
});

export default EditProfileScreen;
