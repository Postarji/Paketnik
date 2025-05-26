import cv2
import numpy as np
import os

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

def save_face(face_img, output_path):
    cv2.imwrite(output_path, face_img)

def capture_images(user_id, output_dir="data/raw", count=50):
    user_dir = os.path.join(output_dir, str(user_id))
    os.makedirs(user_dir, exist_ok=True)

    cap, classifier = setup_capture()
    img_count = 0

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

        cv2.imshow("Capturing Faces - Press 'q' to quit", frame)
        if cv2.waitKey(1) == ord('q'):
            print("Interrupted by user.")
            break

    cap.release()
    cv2.destroyAllWindows()
    print("[DONE] Image capture complete.")

if __name__ == "__main__":
    capture_images(user_id=1, count=50)
