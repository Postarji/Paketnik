import cv2
import numpy as np
import os
import json

SHOW_PREVIEW = False  # Set to True if your environment supports cv2.imshow()

def setup_capture():
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        raise IOError("Cannot open webcam")
    classifier = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    return cap, classifier

def detect_faces(frame, classifier):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = classifier.detectMultiScale(gray, scaleFactor=1.3, minNeighbors=5)
    return faces

def save_face(face_img, output_path, size=(128, 128)):
    resized = cv2.resize(face_img, size)
    cv2.imwrite(output_path, resized)

def save_metadata(user_id, count, path="metadata.json"):
    data = {
        "user_id": user_id,
        "images_captured": count
    }
    with open(path, "w") as f:
        json.dump(data, f, indent=4)

def capture_images(user_id, output_dir="data/raw", count=50):
    user_dir = os.path.join(output_dir, str(user_id))
    os.makedirs(user_dir, exist_ok=True)

    cap, classifier = setup_capture()
    img_count = 0

    try:
        while img_count < count:
            ret, frame = cap.read()
            if not ret:
                print("Failed to read frame from camera")
                break

            faces = detect_faces(frame, classifier)
            for (x, y, w, h) in faces:
                face = frame[y:y+h, x:x+w]
                img_path = os.path.join(user_dir, f"{img_count}.jpg")
                save_face(face, img_path)
                img_count += 1
                print(f"[INFO] Captured {img_count}/{count}")

            if SHOW_PREVIEW:
                for (x, y, w, h) in faces:
                    cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
                cv2.imshow("Capturing Faces - Press 'q' to quit", frame)
                if cv2.waitKey(1) == ord('q'):
                    print("Interrupted by user.")
                    break

    finally:
        cap.release()
        if SHOW_PREVIEW:
            cv2.destroyAllWindows()
        save_metadata(user_id, img_count)
        print(f"[DONE] Captured {img_count} images for user {user_id}")

if __name__ == "__main__":
    user_input = input("Enter User ID or Name: ")
    capture_images(user_id=user_input, count=50)
