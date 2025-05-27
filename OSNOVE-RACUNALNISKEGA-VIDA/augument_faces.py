import cv2
import numpy as np
import os
from pathlib import Path
import random

def load_images(input_dir):
    images = []
    paths = []
    for file in Path(input_dir).glob("*.jpg"):
        img = cv2.imread(str(file))
        if img is not None:
            images.append(img)
            paths.append(str(file))
    return images, paths


def flip_image(image):
    return cv2.flip(image, 1)  # Horizontal flip

def rotate_image(image, angle):
    h, w = image.shape[:2]
    center = (w // 2, h // 2)
    matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
    return cv2.warpAffine(image, matrix, (w, h))

def change_brightness(image, value=30):
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    h, s, v = cv2.split(hsv)
    
    # Convert to int16 to allow adding negative values safely
    v = v.astype(np.int16)
    v = np.clip(v + value, 0, 255).astype(np.uint8)

    final_hsv = cv2.merge((h, s, v))
    bright = cv2.cvtColor(final_hsv, cv2.COLOR_HSV2BGR)
    return bright

def augment_image(image):
    augments = []
    augments.append(flip_image(image))
    augments.append(rotate_image(image, random.choice([-15, 15])))
    augments.append(change_brightness(image, random.randint(-40, 40)))
    return augments

def save_augmented_images(images, original_paths, output_dir="data/augmented"):
    os.makedirs(output_dir, exist_ok=True)
    for img, original_path in zip(images, original_paths):
        filename = Path(original_path).stem
        augmented_versions = augment_image(img)
        for idx, aug_img in enumerate(augmented_versions):
            output_path = os.path.join(output_dir, f"{filename}_aug{idx}.jpg")
            cv2.imwrite(output_path, aug_img)

if __name__ == "__main__":
    images, paths = load_images("data/raw/1")  # or another user's folder
    save_augmented_images(images, paths)
