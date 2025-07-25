import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../Firebase/firebase";

export const uploadProfilePicture = async (
  userId: string,
  imageUri: string
): Promise<string | null> => {
  try {
    console.log("1. Başladı - userId:", userId);
    console.log("2. imageUri:", imageUri);

    if (!imageUri || typeof imageUri !== "string") {
      console.log("3. Geçersiz imageUri");
      return null;
    }

    // Fetch ile blob'a dönüştürme
    const response = await fetch(imageUri);
    if (!response.ok) {
      console.log("4. fetch başarısız:", response.status);
      return null;
    }
    const blob = await response.blob();
    console.log("5. blob oluşturuldu:", blob);

    // Storage referansı
    const imageRef = ref(storage, `profilePictures/${userId}/profile.jpg`);
    console.log("6. imageRef oluşturuldu:", imageRef.fullPath);

    // Yükleme işlemi
    await uploadBytes(imageRef, blob);
    console.log("7. upload tamamlandı");

    // İndirilebilir URL al
    const downloadURL = await getDownloadURL(imageRef);
    console.log("8. Download URL alındı:", downloadURL);

    return downloadURL;
  } catch (error: any) {
    console.error("❌ HATA YAKALANDI:", error);
    return null;
  }
};
