import cv2
import numpy as np
import os

def capture_images(user_id, count=50):
    cap = cv2.VideoCapture(0)
    img_count = 0
    while img_count < count:
        ret, frame = cap.read()
        if not ret:
            break

        #TODO
        cv2.imshow('Capturing Faces', frame)
        if cv2.waitKey(1) == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()
    pass
if __name__ == "__main__":
    capture_images(user_id=1, count=50)
