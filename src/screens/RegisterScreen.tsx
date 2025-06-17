import React, { useState , useEffect} from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, FlatList, Alert} from "react-native";
import { TextInput, Button } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { Picker } from "@react-native-picker/picker";
import Modal from 'react-native-modal';
import * as ImagePicker from "expo-image-picker";
import { db } from "../services/Backend/Firebase/firebase"; 
import { collection, addDoc } from "firebase/firestore";
import { saveUserData } from "../services/Backend/Firebase/firestore";
import { registerWithEmail } from "../services/Backend/Firebase/auth";
import { useAuth } from '../contexts/AuthContext';
import Toast from 'react-native-toast-message';



const RegisterScreen = () => {
  const navigation = useNavigation();
  const [step, setStep] = useState(1);
  const { setUser } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    age: "",
    gender: "",
    email: "",
    password: "",
    city: "",
    hobbies: [] as string[],
    introduction: "",
  });

  const [errors, setErrors] = useState({
    name: "",
    surname: "",
    email: "",
    password: "",
    age: "",
    gender: "",
    city: "",
  });

  // Validate Step 1
  const validateStepOne = () => {
    let isValid = true;
    let errorMessages = { name: "", surname: "", email: "", password: "", age: "", gender: "", city: "" };

    if (!formData.name) {
      errorMessages.name = "Name is required.";
      isValid = false;
    }
    if (!formData.surname) {
      errorMessages.surname = "Surname is required.";
      isValid = false;
    }
    if (!validateEmail(formData.email)) {
      errorMessages.email = "Please enter a valid email address.";
      isValid = false;
    }
    if (formData.password.length < 6) {
      errorMessages.password = "Password must be at least 6 characters.";
      isValid = false;
    }
    if (isNaN(Number(formData.age)) || parseInt(formData.age) < 18) {
      errorMessages.age = "You must be at least 18 years old.";
      isValid = false;
    }
    if (!formData.gender) {
      errorMessages.gender = "Please select a gender.";
      isValid = false;
    }
    if (!formData.city) {
      errorMessages.city = "Please select a city.";
      isValid = false;
    }

    setErrors(errorMessages);
    return isValid;
  };

  const handleNext = async () => {
    if (step === 1 && !validateStepOne()) return;
  
    if (step === 2) {
      if (formData.hobbies.length < 3) {
        alert("Please select at least 3 hobbies.");
        return;
      }
    }
  
    if (step < 3) {
      setStep(step + 1);
    } else {
      try {
        console.log("Step 3 started. Data:", formData);
  
        // Firestore'a kaydedilecek kullanıcı verisi
        const userData = {
          name: formData.name,
          surname: formData.surname,
          age: formData.age,
          gender: formData.gender,
          email: formData.email,
          password: formData.password,
          city: formData.city,
          hobbies: formData.hobbies,
          introduction: formData.introduction,
          createdAt: new Date(),
        };
  
        // Kullanıcıyı Firebase Authentication'a kaydedin
        const userCredential = await registerWithEmail(
          formData.email,
          formData.password,
          `${formData.name} ${formData.surname}`,
          formData
        );

        // Kullanıcıyı AuthContext'te güncelle
        setUser(userCredential.user);  // Burada setUser fonksiyonu ile user verisini güncelleriz.
  
        // Success mesajı ve login ekranına yönlendirme
        Alert.alert(
          "Email Verification Required",
          "Please verify your email address before logging in. Check your inbox for a verification email.",
          [
            {
              text: "OK",
              onPress: () => {
                navigation.navigate("Login"); // Login ekranına yönlendirme
              },
            },
          ]
        );
      } catch (error: any) {
        console.error("Registration Error:", error);
  
        // Firebase hata kodlarına göre uyarı ver
        if (error.code === 'auth/email-already-in-use') {
          alert("This email address is already in use. Please try another one.");
        } else if (error.code === 'auth/invalid-email') {
          alert("Invalid email address. Please check and try again.");
        } else if (error.code === 'auth/weak-password') {
          alert("Your password is too weak. Please enter a stronger password.");
        } else {
          alert("An error occurred during registration. Please try again.");
        }
      }
    }
  };
  

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        {step === 1 && <StepOne formData={formData} setFormData={setFormData} errors={errors} setErrors={setErrors} />}
        {step === 2 && <StepTwo formData={formData} setFormData={setFormData} handlePrev={handlePrev} />}
        {step === 3 && <StepThree formData={formData} setFormData={setFormData} handlePrev={handlePrev} />}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <Button mode="contained" style={styles.button} contentStyle={styles.buttonContent} labelStyle={styles.buttonText} onPress={handleNext}>
          {step < 3 ? "Next" : "Finish"}
        </Button>
      </View>
    </View>
  );
};



const StepOne = ({ formData, setFormData, errors, setErrors }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState(formData.city);

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    setErrors({ ...errors, [field]: "" });
  };

  

  const provinces = [
    "Adana", "Adiyaman", "Afyonkarahisar", "Agri", "Amasya", "Ankara", "Antalya", "Artvin", "Aydin", "Balikesir",
    "Bilecik", "Bingol", "Bitlis", "Bolu", "Burdur", "Bursa", "Canakkale", "Cankiri", "Corum", "Denizli",
    "Diyarbakir", "Edirne", "Elazig", "Erzincan", "Erzurum", "Eskisehir", "Gaziantep", "Giresun", "Gumushane",
    "Hakkari", "Hatay", "Isparta", "Istanbul", "Izmir", "Karabuk", "Karaman", "Kastamonu", "Kayseri", "Kirikkale",
    "Kirklareli", "Kirsehir", "Kocaeli", "Konya", "Kutahya", "Malatya", "Manisa", "Kahramanmaras", "Mardin", "Mugla",
    "Mus", "Nevsehir", "Nigde", "Ordu", "Osmaniye", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas",
    "Sanliurfa", "Sirnak", "Tekirdag", "Tokat", "Trabzon", "Tunceli", "Usak", "Van", "Yalova", "Yozgat", "Zonguldak"
];


  const handleProvinceChange = (province: string) => {
    setSelectedProvince(province);
    setFormData({ ...formData, city: province });
    setIsModalVisible(false);
    setErrors({ ...errors, city: "" });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Step 1: Personal Info</Text>

      <View style={styles.row}>
        <View style={styles.halfWidth}>
          <TextInput
            label="Name"
            mode="outlined"
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => handleChange("name", text)}
            error={!!errors.name}
          />
          {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
        </View>

        <View style={styles.halfWidth}>
          <TextInput
            label="Surname"
            mode="outlined"
            style={styles.input}
            value={formData.surname}
            onChangeText={(text) => handleChange("surname", text)}
            error={!!errors.surname}
          />
          {errors.surname ? <Text style={styles.errorText}>{errors.surname}</Text> : null}
        </View>
      </View>

      <TextInput
        label="Email"
        mode="outlined"
        style={[styles.input, { textAlignVertical: "center" },]}  // Metni dikey olarak hizala
        keyboardType="email-address"
        value={formData.email}
        onChangeText={(text) => handleChange("email", text)}
        error={!!errors.email}
        autoCapitalize="none"
      />


      {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}

      <TextInput
        label="Password"
        mode="outlined"
        secureTextEntry
        style={styles.input}
        value={formData.password}
        onChangeText={(text) => handleChange("password", text)}
        error={!!errors.password}
      />
      {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}

      <TextInput
        label="Age"
        mode="outlined"
        keyboardType="numeric"
        style={styles.input}
        value={formData.age}
        onChangeText={(text) => handleChange("age", text)}
        error={!!errors.age}
      />
      {errors.age ? <Text style={styles.errorText}>{errors.age}</Text> : null}

      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={formData.gender}
          onValueChange={(itemValue) => handleChange("gender", itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="Select Gender" value="" />
          <Picker.Item label="Male" value="Male" />
          <Picker.Item label="Female" value="Female" />
        </Picker>
      </View>
      {errors.gender ? <Text style={styles.errorText}>{errors.gender}</Text> : null}

      {/* Province Picker */}
      <Text style={styles.label}>Location</Text>
      <TouchableOpacity style={styles.pickerContainer} onPress={() => setIsModalVisible(true)}>
        <Text style={styles.selectedProvince}>{selectedProvince || "Select Province"}</Text>
      </TouchableOpacity>
      {errors.city ? <Text style={styles.errorText}>{errors.city}</Text> : null}

      {/* Modal */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Province</Text>
            <FlatList
              data={provinces}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => handleProvinceChange(item)} style={styles.modalItemContainer}>
                  <Text style={styles.modalItem}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.closeModalButton}>
              <Text style={styles.closeModalText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};


const validateEmail = (email) => {
  const emailRegex = /\S+@\S+\.\S+/;
  return emailRegex.test(email);
};


const StepTwo = ({ formData, setFormData, handlePrev }) => {
  const [error, setError] = useState("");

  const hobbiesList = [
    { name: "Music", icon: "🎵" },
    { name: "Sports", icon: "⚽" },
    { name: "Books", icon: "📚" },
    { name: "Cinema", icon: "🎬" },
    { name: "Travel", icon: "🌍" },
    { name: "Gaming", icon: "🎮" },
    { name: "Food", icon: "🍽️" },
    { name: "Technology", icon: "💻" },
    { name: "Art", icon: "🎨" },
    { name: "Photography", icon: "📸" },
    { name: "Yoga", icon: "🧘" },
    { name: "Dance", icon: "💃" },
    { name: "Nature", icon: "🌳" },
    { name: "Science", icon: "🔬" },
];


  const toggleHobby = (hobby: string) => {
    let updatedHobbies;

    if (formData.hobbies.includes(hobby)) {
      // Seçili hobiyi kaldır
      updatedHobbies = formData.hobbies.filter((h) => h !== hobby);
    } else {
      // Eğer 3'e ulaştıysa ekleme yapma
      if (formData.hobbies.length >= 3) {
        setError("You can select up to 3 hobbies.");
        return;
      }
      updatedHobbies = [...formData.hobbies, hobby];
    }

    setError(""); // Hata mesajını temizle
    setFormData({ ...formData, hobbies: updatedHobbies });
  };

  return (
    <View style={styles.container}>
      {/* 🔙 Geri Butonu */}
      <TouchableOpacity style={styles.backButton} onPress={handlePrev}>
        <Text style={styles.backButtonText}>{"<"}</Text>
      </TouchableOpacity>

      {/* 📌 Başlık - Butondan Aşağıda Olacak */}
      <Text style={styles.title}>Step 2: Select Hobbies</Text>
      <Text style={styles.subtitle}>
        Select a few of your interests and let everyone know what you’re passionate about.
      </Text>

      {/* 🎯 Hobi Seçenekleri */}
      <View style={styles.hobbiesContainer}>
        {hobbiesList.map(({ name, icon }, index) => {
          const isSelected = formData.hobbies.includes(name);

          return (
            <TouchableOpacity
              key={index}
              style={[styles.hobbyButton, isSelected && styles.selectedHobby]}
              onPress={() => toggleHobby(name)}
            >
              <Text style={[styles.hobbyText, isSelected && styles.selectedHobbyText]}>
                {icon} {name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Hata mesajı */}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};


const StepThree = ({ formData, setFormData, handlePrev }) => {
  return (
    <View style={styles.container}>
      {/* 🔙 Geri Butonu */}
      <TouchableOpacity style={styles.backButton} onPress={handlePrev}>
        <Text style={styles.backButtonText}>{"<"}</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Step 3: Introduce Yourself</Text>
      <Text style={styles.subtitle}>
        Please tell us about you more. What are your interests, hobbies, or anything you want to share.
      </Text>
      <TextInput
        label="Introduction"
        mode="outlined"
        style={[styles.input, styles.introductionInput]}
        multiline
        numberOfLines={10}
        value={formData.introduction}
        onChangeText={(text) => setFormData({ ...formData, introduction: text })}
      />
    </View>
  );
};


  const StepFour = ({ formData, setFormData, handlePrev }) => {
    const [image, setImage] = useState(formData.profilePicture || null);
  
    // 📸 Resim seçme fonksiyonu
    const pickImage = async () => {
      let permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        alert("Permission to access gallery is required!");
        return;
      }
  
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // Kare kırpma
        quality: 0.7, // %70 kalite
      });
  
      if (!result.canceled) {
        const selectedImage = result.assets[0].uri;
        setImage(selectedImage);
        setFormData({ ...formData, profilePicture: selectedImage });
      }
    };
  
    return (
      <View style={styles.container}>
        {/* 🔙 Geri Butonu */}
        <TouchableOpacity style={styles.backButton} onPress={handlePrev}>
          <Text style={styles.backButtonText}>{"<"}</Text>
        </TouchableOpacity>
  
        <Text style={styles.title}>Step 4: Upload Profile Picture</Text>
  
        {/* 📸 Seçilen Fotoğrafı Göster */}
        <View style={styles.imageContainer}>
          {image && <Image source={{ uri: image }} style={styles.imagePreview} />}
        </View>
  
        {/* 📷 Fotoğraf Seç Butonu */}
        <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
          <Text style={styles.uploadText}>{image ? "Change Photo" : "Upload Photo"}</Text>
        </TouchableOpacity>
      </View> 
    ); 
  }; 

  

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#FFFFFF",
      padding: 20,
    },
    scrollView: {
      flexGrow: 1,
      justifyContent: "center",
    },
    title: {
      fontSize: 28,
      fontWeight: "bold",
      color: "#FF6F00",
      textAlign: "center",
      marginBottom: 20,
      marginTop: 30,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 12,
      alignItems: "center",
    },
    halfWidth: {
      width: "48%",
    },
    input: {
      marginBottom: 12,
    },
    introductionInput: {
      height: 200, 
      textAlignVertical: "top", // Yazı hizalaması
    },
    pickerContainer: {
      borderWidth: 1,
      borderColor: "#FF6F00",
      borderRadius: 8,
      marginBottom: 12,
      paddingHorizontal: 10,
    },
    picker: {
      height: 50,
      width: "100%",
    },
    hobbiesContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
    },
    errorText: {
      color: "red",
      fontSize: 14,
      marginBottom: 8,
    },
    backButton: {
      position: "absolute",
      top: 5,
      left: 5,
      width: 45,
      height: 45,
      backgroundColor: "#E0E0E0",
      borderRadius: 8,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#000",
      shadowOpacity: 0.4,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 4,
    },
    backButtonText: {
      fontSize: 24,
      fontWeight: "bold",
      color: "#FF6F00",
      backgroundColor: "transparent",
      paddingVertical: 5,
      paddingHorizontal: 10,
    },
    subtitle: {
      fontSize: 14,
      color: "#000",
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: 20,
    },
    hobbyButton: {
      width: "48%",
      aspectRatio: 2.5,
      backgroundColor: "#FFF",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: 10,
      borderWidth: 2,
      borderColor: "#FF6F00",
      marginBottom: 12,
    },
    selectedHobby: {
      backgroundColor: "#FF6F00",
    },
    hobbyText: {
      fontSize: 18,
      color: "#000",
      fontWeight: "bold",
    },
    selectedHobbyText: {
      color: "#FFF",
    },
    uploadButton: {
      backgroundColor: "#FF6F00",
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 10,
      alignItems: "center",
      marginTop: 20,
    },
    uploadText: {
      color: "#FFF",
      fontSize: 18,
      fontWeight: "bold",
    },    
    button: {
      backgroundColor: "#FF6F00",
      borderRadius: 10,
      marginTop: 20,
    },
    buttonContent: {
      paddingVertical: 12,
      width: "100%",
    },
    buttonText: {
      color: "#FFF",
      fontSize: 18,
      fontWeight: "bold",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      backgroundColor: "#fff",
      width: "80%",
      maxHeight: "70%",
      borderRadius: 12,
      padding: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
      elevation: 5, // For Android shadow effect
    },
    modalTitle: {
      fontSize: 22,
      fontWeight: "bold",
      color: "#FF6F00", // Turuncu tema
      marginBottom: 15,
      textAlign: "center",
    },
    modalItemContainer: {
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: "#eee",
    },
    modalItem: {
      fontSize: 18,
      color: "#333",
      textAlign: "center",
      paddingVertical: 8,
      fontWeight: "500",
    },
    closeModalButton: {
      marginTop: 15,
      padding: 12,
      backgroundColor: "#FF6F00", // Turuncu
      borderRadius: 8,
      borderWidth: 1,
      borderColor: "#FF6F00", // Matching border color
    },
    closeModalText: {
      color: "#fff",
      textAlign: "center",
      fontWeight: "bold",
      fontSize: 16,
    },
    selectedProvince: {
      paddingVertical: 12,
      fontSize: 18,
      color: "#333",
      textAlign: "center",
      fontWeight: "500",
    },
    imageContainer: { 
      alignItems: "center", 
      justifyContent: "center", 
      width: "100%", 
      marginBottom: 20 
    },
    imagePreview: { width: 150, height: 150, borderRadius: 75, marginBottom: 10 },
  });
  
  

export default RegisterScreen;
