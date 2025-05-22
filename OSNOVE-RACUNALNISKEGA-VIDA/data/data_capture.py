import cv2
import numpy as np
import os

def capture_images(user_id, output_dir="data/raw", count=50):
    cap = cv2.VideoCapture(0)
    img_count = 0
    classifier = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    while img_count < count:
        ret, frame = cap.read()
        if not ret:
            break
  
        faces = classifier.detectMultiScale(frame, 1.3, 5)
        for (x, y, w, h) in faces:
            face = frame[y:y+h, x:x+w]
            cv2.imwrite(f"{output_dir}/{user_id}/{img_count}.jpg", face)
            img_count += 1
            print(f"Captured {img_count}/{count}")
        cv2.imshow('Capturing Faces', frame)
        if cv2.waitKey(1) == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()
    pass
if __name__ == "__main__":
    capture_images(user_id=1, count=50)
