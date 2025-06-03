import cv2
import numpy as np
import os
import json
from datetime import datetime
from .utils.skin_detection import doloci_barvo_koze, obdelaj_sliko_s_skatlami
from config import RAW_DIR, METADATA_FILE

SHOW_PREVIEW = False  # Set to True if you want to see a live preview window

# ================= COLOR CONVERSIONS =================
def convert_to_grayscale(image):
    if len(image.shape) == 3:
        return cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    return image

def convert_to_lab(image):
    if len(image.shape) == 3:
        return cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    return image

def convert_to_hsv(image):
    if len(image.shape) == 3:
        return cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    return image

def convert_to_yuv(image):
    if len(image.shape) == 3:
        return cv2.cvtColor(image, cv2.COLOR_BGR2YUV)
    return image

def ensure_user_dir(user_id, base_dir=RAW_DIR):
    user_path = base_dir / str(user_id)
    user_path.mkdir(parents=True, exist_ok=True)
    return user_path

def setup_capture():
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        raise IOError("Cannot open webcam")
    classifier = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    return cap, classifier

def preprocess_face(face_img, color_space='grayscale'):
    # 1. Pretvorimo v izbrani barvni prostor
    if color_space == 'grayscale':
        img = convert_to_grayscale(face_img)
    elif color_space == 'lab':
        img = convert_to_lab(face_img)
    elif color_space == 'hsv':
        img = convert_to_hsv(face_img)
    elif color_space == 'yuv':
        img = convert_to_yuv(face_img)
    else:
        img = face_img

    # 2. Odstrani šum
    img = cv2.GaussianBlur(img, (5, 5), 0)

    # 3. Linearizacija sivin
    if len(img.shape) == 2:
        min_val = np.min(img)
        max_val = np.max(img)
        if max_val - min_val > 0:
            img = ((img - min_val) / (max_val - min_val) * 255).astype(np.uint8)

    return img

def save_face(face_img, output_path, size=(224, 224), color_space='grayscale'):
    preprocessed = preprocess_face(face_img, color_space=color_space)
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

def capture_images(user_id, output_dir=RAW_DIR, count=50, color_space='grayscale'):
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("[ERROR] Cannot open camera.")
        return

    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    user_path = ensure_user_dir(user_id, output_dir)
    img_count = 0

    ret, frame = cap.read()
    if not ret:
        print("[ERROR] Failed to grab initial frame.")
        return
    skin_range = doloci_barvo_koze(frame, (100, 100), (150, 150))
    print(f"[INFO] Skin color range: {skin_range}")

    while img_count < count:
        ret, frame = cap.read()
        if not ret:
            break
        faces = face_cascade.detectMultiScale(frame, scaleFactor=1.3, minNeighbors=5)
        for (x, y, w, h) in faces:
            face = frame[y:y+h, x:x+w]
            output_path = user_path / f"{img_count}.jpg"
            save_face(face, output_path)
            img_count += 1
            print(f"[INFO] Captured {img_count}/{count}")
            if img_count >= count:
                break
        #if cv2.waitKey(1) == ord('q'):
            #break

    save_metadata(user_id, img_count)
    cap.release()
    #cv2.destroyAllWindows()
    print("[INFO] Done.")

if __name__ == "__main__":
    user_input = input("Enter User ID or Name: ")
    capture_images(user_id=user_input, count=50, color_space='grayscale')# Options: grayscale, lab, hsv, yuv
