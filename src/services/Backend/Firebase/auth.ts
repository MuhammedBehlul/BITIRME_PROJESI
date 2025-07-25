import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from "firebase/auth";
import { auth } from "./firebase";
import { saveUserData } from "./firestore";  // Firestore verisini kaydetme fonksiyonu
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc, updateDoc} from "firebase/firestore";
import { db } from "./firebase"; // Firestore veritabanı bağlantısı


// Kullanıcı kaydı fonksiyonu
export const registerWithEmail = async (
  email: string,
  password: string,
  displayName: string,
  userData: { name: string, surname: string, age: string, gender: string, city: string, hobbies: string[], introduction: string }
) => {
  try {
    // Yeni kullanıcıyı oluştur
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    // Kullanıcı profilini güncelle
    await updateProfile(userCredential.user, {
      displayName,
    });


    // Firestore'a kullanıcı verisini kaydet
    const userId = userCredential.user.uid;
    const userDataWithCreatedAt = {
      name: userData.name || '',
      surname: userData.surname || '',
      age: userData.age || '',
      gender: userData.gender || '',
      city: userData.city || '',
      hobbies: userData.hobbies || [],  
      introduction: userData.introduction || '',
      email: userCredential.user.email || '',
      createdAt: new Date(),
    };

    await saveUserData(userId, userDataWithCreatedAt);

    // E-posta doğrulama göndermek
    await sendEmailVerification(userCredential.user);


    return userCredential.user;

  } catch (error: any) {
    console.error("Error registering user: ", error);
    throw new Error(error.message || "Kullanıcı kaydederken bir hata oluştu.");
  }
};

// Giriş fonksiyonu
export const loginWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    // E-posta doğrulaması kontrolü
    if (!userCredential.user.emailVerified) {
      throw new Error('Lütfen e-posta adresinizi doğrulayın.');
    }

    return userCredential.user;
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      throw new Error("Kullanıcı bulunamadı.");
    } else if (error.code === 'auth/wrong-password') {
      throw new Error("Hatalı parola.");
    } else {
      throw new Error("Giriş sırasında bir hata oluştu.");
    }
  }
};

// Çıkış fonksiyonu
export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout Error:", error);
    throw new Error("Çıkış yapılırken bir hata oluştu.");
  }
};
// Kullanıcı verisini Firestore'dan al
export const getUserData = async (userId: string) => {
  try {
    const userRef = doc(db, "users", userId);  // "users" koleksiyonunda kullanıcı verisini bul
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data();  // Kullanıcı verisini döndür
    } else {
      throw new Error("Kullanıcı verisi bulunamadı.");
    }
  } catch (error) {
    console.error("Error getting user data: ", error);
    throw new Error("Kullanıcı verisi alınırken bir hata oluştu.");
  }
};

// Kullanıcı verisini güncelleme fonksiyonu
export const updateUserData = async (userId, updatedData) => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, updatedData);
  } catch (error) {
    console.error("Error updating user data: ", error);
    throw new Error("Kullanıcı verisi güncellenemedi.");
  }
};
