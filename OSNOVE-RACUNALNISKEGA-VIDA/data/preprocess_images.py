import cv2
import os

def preprocess_images(input_dir, output_dir):
    os.makedirs(output_dir, exist_ok=True)
    for fname in os.listdir(input_dir):
        img = cv2.imread(os.path.join(input_dir, fname))
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        # Denoise (example)
        gray = cv2.GaussianBlur(gray, (3, 3), 0)
        cv2.imwrite(os.path.join(output_dir, fname), gray)