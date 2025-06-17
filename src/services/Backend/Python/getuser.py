import os
from fastapi import FastAPI, HTTPException, Query
from firebase_admin import credentials, firestore, initialize_app
import firebase_admin
from dotenv import load_dotenv
import uvicorn
import traceback
from sentence_transformers import SentenceTransformer, util
import pandas as pd

# .env dosyasını yükle
load_dotenv()

# Firebase kimlik bilgileri
firebase_cred_path = os.getenv("FIREBASE_CREDENTIALS")
if not firebase_cred_path or not os.path.exists(firebase_cred_path):
    raise RuntimeError(
        "FIREBASE_CREDENTIALS environment variable is missing or file not found."
    )

cred = credentials.Certificate(firebase_cred_path)
if not firebase_admin._apps:
    initialize_app(cred)
db = firestore.client()

# CSV dosyasının yolu
csv_path = os.getenv("EVENT_CSV_PATH", "event_dataset.csv")
if not os.path.exists(csv_path):
    raise RuntimeError(f"CSV file not found at {csv_path}")

# Veri ve model
df = pd.read_csv(csv_path)
model = SentenceTransformer("all-MiniLM-L6-v2")

# FastAPI uygulaması
app = FastAPI()


def generate_recommendations(hobbies, cities):
    if not hobbies or not cities:
        raise HTTPException(status_code=400, detail="Hobbies or cities are empty")

    user_text = " ".join(hobbies)
    user_embedding = model.encode(user_text, convert_to_tensor=True)

    filtered_events = df[
        df["location"].str.lower().isin([city.lower() for city in cities])
    ]
    recommendations = []
    for _, row in filtered_events.iterrows():
        event_embedding = model.encode(row["title"], convert_to_tensor=True)
        score = util.cos_sim(user_embedding, event_embedding).item()
        recommendations.append(
            {"title": row["title"], "location": row["location"], "score": score}
        )

    recommendations = sorted(recommendations, key=lambda x: x["score"], reverse=True)
    return recommendations[:20]


@app.get("/recommendations")
def recommend(user_ids: str = Query(...)):
    user_id_list = user_ids.split(",")
    if not (1 <= len(user_id_list) <= 2):
        raise HTTPException(status_code=400, detail="You must provide 1 or 2 user IDs")

    hobbies = set()
    cities = set()

    for uid in user_id_list:
        doc = db.collection("users").document(uid).get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail=f"User {uid} not found")

        data = doc.to_dict()
        hobbies.update(data.get("hobbies", []))
        city = data.get("city", "")
        if city:
            cities.add(city.lower())

    return {"recommendations": generate_recommendations(list(hobbies), list(cities))}


@app.get("/same-cluster-users/{user_id}")
def get_same_cluster_users(user_id: str):
    try:
        user_ref = db.collection("users").document(user_id)
        user_doc = user_ref.get()

        if not user_doc.exists:
            raise HTTPException(status_code=404, detail="User not found")

        user_data = user_doc.to_dict()
        user_cluster = user_data.get("cluster")
        if user_cluster is None:
            raise HTTPException(
                status_code=400, detail="User has no cluster assigned yet"
            )

        query = db.collection("users").where("cluster", "==", user_cluster).stream()
        same_cluster_ids = []

        for doc in query:
            other_user_id = doc.id
            if other_user_id == user_id:
                continue

            chat_id_1 = f"{user_id}_{other_user_id}"
            chat_id_2 = f"{other_user_id}_{user_id}"

            chat_doc_1 = db.collection("chats").document(chat_id_1).get()
            chat_doc_2 = db.collection("chats").document(chat_id_2).get()

            status_1 = (
                chat_doc_1.to_dict().get("requestStatus") if chat_doc_1.exists else None
            )
            status_2 = (
                chat_doc_2.to_dict().get("requestStatus") if chat_doc_2.exists else None
            )

            if status_1 in ["accepted", "pending"] or status_2 in [
                "accepted",
                "pending",
            ]:
                continue

            same_cluster_ids.append(other_user_id)

        return {"user_ids": same_cluster_ids}

    except Exception:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal Server Error")


# Uygulama başlatma
if __name__ == "__main__":
    uvicorn.run("getuser:app", host="0.0.0.0", port=8000, reload=True)
