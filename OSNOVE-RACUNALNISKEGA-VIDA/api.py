
from fastapi import FastAPI, File, UploadFile, HTTPException 
from fastapi.responses import JSONResponse
from PIL import Image
import numpy as np
from pymongo import MongoClient
from bson import ObjectId
import io
import cv2
import os 
from dotenv import load_dotenv

dotenv_path = os.path.join(os.path.dirname(__file__), 'apiMongo.env') # Pravilno poišče datoteko
if os.path.exists(dotenv_path):
    load_dotenv(dotenv_path=dotenv_path)
    print(f"Loaded environment variables from: {dotenv_path}")
else:
    print(f"Warning: .env file not found at {dotenv_path}. Relying on OS environment variables.")

MONGO_CONNECTION_STRING = os.getenv("MONGO_URI")
if not MONGO_CONNECTION_STRING:
    print("ERROR: MONGO_URI environment variable not set.")
    # Tu ustavim aplikacijo ali uporabim nek default za lokalni razvoj
    MONGO_CONNECTION_STRING = "mongodb://localhost:27017/test_fallback" # Primer za fallback

MONGO_CONNECTION_STRING = os.getenv("MONGO_URI")

if not MONGO_CONNECTION_STRING:
    print("ERROR: MONGO_URI environment variable not set.")
    # isto tu
    MONGO_CONNECTION_STRING = "mongodb://localhost:27017/test_fallback" # Primer za fallback

client = MongoClient(MONGO_CONNECTION_STRING)
db = client.test 
users_collection = db.users

try:
    client.admin.command('ping')
    print("Successfully connected to MongoDB!")
except Exception as e:
    print(f"Error connecting to MongoDB using URI '{MONGO_CONNECTION_STRING[:20]}...': {e}")

def preprocess_image_for_model(image_array: np.ndarray) -> np.ndarray:
    """Pripravi sliko za model (velikost, barvni prostor)."""
    if len(image_array.shape) == 3 and image_array.shape[2] == 3: # BGR
        img_gray = cv2.cvtColor(image_array, cv2.COLOR_BGR2GRAY)
    elif len(image_array.shape) == 2: # sivinska
        img_gray = image_array
    else: # Drugače vrni napako
        raise ValueError("Unsupported image format for preprocessing")

    img_resized = cv2.resize(img_gray, EXPECTED_SHAPE)
    # img_normalized = img_resized / 255.0  če rabi manjšo sliko
    # return np.expand_dims(img_normalized, axis=-1) # Če model pričakuje še eno dimenzijo
    return img_resized #zaenkrat

def load_mock_model():
    """Simulira nalaganje modela. V resnici ne naredi ničesar."""
    print("Mock model loaded.")
    # dejanski model, ko bo na voljo
    # from tensorflow.keras.models import load_model
    # model = load_model("path/to/your/model.h5")
    # return model
    return "mock_model_instance" # Samo placeholder

MOCK_MODEL = load_mock_model() # Naloži model ob zagonu API-ja

def predict_with_mock_model(image_array: np.ndarray, model_instance):
    """Simulira napoved z modelom."""
    # Tu bi klicala model.predict(image_array)
    # Za mock model vrnem fiksno vrednost
    print(f"Mock model received image with shape: {image_array.shape}")
    # Preverim če je slika dovolj svetla/temna za testiranje
    if np.mean(image_array) > 128:
        return {"user_id": "mock_user_1", "confidence": 0.95}
    else:
        return {"user_id": "unknown", "confidence": 0.40}


EXPECTED_SHAPE = (224, 224) #velikost 224x224
app = FastAPI()
# Shranjuj "zahteve za prijavo" - zelo poenostavljeno
# V resnični aplikaciji bo tu baza podatkov ali Redis.
pending_logins = {} 


@app.post("/initiate_2fa")
async def initiate_2fa_request(user_id: str):
    # Ta endpoint bi klicala spletna aplikacija, ko se uporabnik želi prijaviti.
    # API generira nekakšen "izziv" ali sejo.
    import uuid
    challenge_id = str(uuid.uuid4())
    pending_logins[challenge_id] = {"user_id": user_id, "verified": False, "mock": True}#TODO to kasneje ZBRIŠI samo placeholder za testing
    print(f"[MOCK API] 2FA initiated for {user_id}. Challenge ID: {challenge_id}")

    # Tukaj bi Član 1 sprožil potisno obvestilo na mobilno aplikacijo s tem challenge_id.
    return JSONResponse(content={"message": f"2FA initiated for {user_id}. Challenge ID: {challenge_id}", "challenge_id": challenge_id})

@app.post("/verify_face/{challenge_id}")
async def verify_face(challenge_id: str, file: UploadFile = File(None)):#File je obcijski za mock
    if challenge_id not in pending_logins:
        raise HTTPException(status_code=404, detail="Invalid or expired challenge ID")

    # Preveri, ali je ta challenge že bil uporabljen/potrjen
    if pending_logins[challenge_id].get("verified"):
        raise HTTPException(status_code=400, detail="Challenge already verified")

    expected_user_id = pending_logins[challenge_id]["user_id"]
    
    #----MOCK LOGIKA----#
    # Vedno uspešno, če je 'mock' flag postavljen
    if pending_logins[challenge_id].get("mock"):
        pending_logins[challenge_id]["verified"] = True
        pending_logins[challenge_id]["verified_user"] = expected_user_id # Uporabimo user_id iz initiate_2fa

        print(f"[MOCK API] User {expected_user_id} verified successfully for challenge {challenge_id} (mocked).")
        if file:
            # Kljub mocku shranimo sliko, če je poslana, za kasnejšo analizo/debug
            contents = await file.read()
            print(f"[MOCK API] Received image of size {len(contents)} for challenge {challenge_id}, but verification is mocked.")
       
        return JSONResponse(content={
            "message": "User verified successfully (mocked).",
            "verified_user": expected_user_id,
            "expected_user": expected_user_id,
            "confidence": 1.0 # Mock confidence
        })

    #-----------------#
    try:
        contents = await file.read()
        image_pil = Image.open(io.BytesIO(contents)) # PIL slika
        
        # Pretvorba v OpenCV format (BGR) za lažje delo s cv2 funkcijami
        image_cv = cv2.cvtColor(np.array(image_pil), cv2.COLOR_RGB2BGR)

        # Predprocesiranje slike, da ustreza vhodu modela
        # To mora biti enako, kot se uporablja pri učenju modela!
        processed_image = preprocess_image_for_model(image_cv) 
        
        # Uporabi (lažni) model za napoved
        # Dejansko bi bilo: prediction = REAL_MODEL.predict(np.expand_dims(processed_image, axis=0))
        prediction = predict_with_mock_model(processed_image, MOCK_MODEL)
        
        predicted_user_id = prediction.get("user_id")
        confidence = prediction.get("confidence", 0.0)

        # Osnovna logika verifikacije
        # Tukaj primerjam `predicted_user_id` z `expected_user_id` iz `pending_logins`
        # in preverim `confidence`.
        if predicted_user_id == expected_user_id and confidence > 0.7: # Prag zaupanja
            pending_logins[challenge_id]["verified"] = True
            pending_logins[challenge_id]["verified_user"] = predicted_user_id
            return JSONResponse(content={
                "message": "User verified successfully.",
                "verified_user": predicted_user_id,
                "expected_user": expected_user_id,
                "confidence": confidence
            })
        else:
            return JSONResponse(status_code=401, content={
                "message": "User verification failed.",
                "predicted_user": predicted_user_id,
                "expected_user": expected_user_id,
                "confidence": confidence
            })

    except ValueError as e: # Napaka pri predprocesiranju
        raise HTTPException(status_code=400, detail=f"Image processing error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@app.get("/check_2fa_status/{challenge_id}")
async def check_2fa_status(challenge_id: str):
    # Ta endpoint bi spletna aplikacija periodično klicala, da preveri, ali je uporabnik potrdil na mobilni
    if challenge_id not in pending_logins:
        raise HTTPException(status_code=404, detail="Invalid or expired challenge ID")
    
    status = pending_logins[challenge_id]
    if status.get("verified"):
        return JSONResponse(content={"status": "VERIFIED", "user_id": status.get("verified_user")})
    else:
        #lahko tudi timeout
        return JSONResponse(content={"status": "PENDING"})