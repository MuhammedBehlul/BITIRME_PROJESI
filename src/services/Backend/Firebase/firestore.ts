import { db } from './firebase'; // Firestore config dosyasını içe aktarın
import { doc, setDoc, getDoc } from 'firebase/firestore';

// Kullanıcı verilerini kaydetme fonksiyonu
export const saveUserData = async (userId: string, userData: any) => {
  try {
    // userId ile Firestore'da bir kullanıcı belgesi oluşturuluyor
    const userDocRef = doc(db, "users", userId);

    // Veriyi Firestore'a kaydediyoruz
    await setDoc(userDocRef, {
      name: userData.name,
      surname: userData.surname,
      email: userData.email || "", // Eğer email undefined ya da boşsa boş bir string
      age: userData.age,
      gender: userData.gender,
      city: userData.city,
      hobbies: userData.hobbies,
      introduction: userData.introduction,
      profilePicture: userData.profilePicture || null, // Profil resmi yoksa null
      createdAt: userData.createdAt, // Oluşturulma tarihi
    });

    console.log('User data saved successfully!');
  } catch (error) {
    console.error('Error saving user data: ', error);
  }
};

// Kullanıcı verilerini Firestore'dan çekme fonksiyonu
export const fetchUserData = async (uid: string) => {
  try {
    const docRef = doc(db, 'users', uid); // 'users' koleksiyonundaki kullanıcı belgesini alıyoruz
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const userData = docSnap.data(); // Veriyi alıyoruz
      //console.log('Fetched user data:', userData); // Veriyi konsola yazdırıyoruz
      return userData;
    } else {
      console.log('No such document!');
      return null;
    }
  } catch (error) {
    console.error("Error fetching user data: ", error);
    return null;
  }
};

