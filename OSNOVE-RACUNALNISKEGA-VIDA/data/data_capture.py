import cv2
import numpy as np
import os
import json
from datetime import datetime
from utils.skin_detection import doloci_barvo_koze, obdelaj_sliko_s_skatlami

SHOW_PREVIEW = False  # Set to True if you want to see a live preview window

def ensure_user_dir(user_id, output_dir="data/raw"):
    user_path = os.path.join(output_dir, str(user_id))
    os.makedirs(user_path, exist_ok=True)
    return user_path

def setup_capture():
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        raise IOError("Cannot open webcam")
    classifier = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    return cap, classifier

def preprocess_face(face_img):
    # 1. Odstranjevanje šuma s Gaussian blur
    denoised = cv2.GaussianBlur(face_img, (5, 5), 0)

    # 2. Pretvorimo v grayscale
    gray = cv2.cvtColor(denoised, cv2.COLOR_BGR2GRAY)

    # 3. Linearizacija sivin
    min_val = np.min(gray)
    max_val = np.max(gray)
    if max_val - min_val > 0:
        linearized = ((gray - min_val) / (max_val - min_val) * 255).astype(np.uint8)
    else:
        linearized = gray

    return linearized

def save_face(face_img, output_path, size=(224, 224)):
    preprocessed = preprocess_face(face_img)
    resized = cv2.resize(preprocessed, size)
    cv2.imwrite(output_path, resized)

def save_metadata(user_id, count, path="metadata.json"):
    data = {
        "user_id": user_id,
        "images_captured": count,
        "timestamp": datetime.now().isoformat(),
        "image_size": "224x224",
        "format": "jpg",
    }
    with open(path, "w") as f:
        json.dump(data, f, indent=4)

def capture_images(user_id, output_dir="data/raw", count=50):
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("[ERROR] Cannot open camera.")
        return

    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    user_path = ensure_user_dir(user_id, output_dir)
    img_count = 0

    # Optional: Estimate skin tone once at beginning
    ret, frame = cap.read()
    if not ret:
        print("[ERROR] Failed to grab initial frame.")
        return
    skin_range = doloci_barvo_koze(frame, (100, 100), (150, 150))
    print(f"[INFO] Skin color range: {skin_range}")

    print("[INFO] Starting image capture...")
    while img_count < count:
        ret, frame = cap.read()
        if not ret:
            break

        faces = face_cascade.detectMultiScale(frame, scaleFactor=1.3, minNeighbors=5)
        for (x, y, w, h) in faces:
            face = frame[y:y+h, x:x+w]
            output_path = os.path.join(user_path, f"{img_count}.jpg")
            save_face(face, output_path)
            img_count += 1
            print(f"[INFO] Captured {img_count}/{count}")
            if img_count >= count:
                break

        key = cv2.waitKey(1)
        if key == ord('q'):
            break

    save_metadata(user_id, img_count)
    cap.release()
    cv2.destroyAllWindows()
    print("[INFO] Done.")

if __name__ == "__main__":
    user_input = input("Enter User ID or Name: ")
    capture_images(user_id=user_input, count=50)
