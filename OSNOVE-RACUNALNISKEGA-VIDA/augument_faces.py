import cv2
import numpy as np
import os
from pathlib import Path
import random
import csv
from config import AUGMENTED_DIR

def load_images(input_dir):
    images = []
    paths = []
    for file in Path(input_dir).glob("*.jp*g"):
        img = cv2.imread(str(file))
        if img is not None:
            images.append(img)
            paths.append(file)
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

def add_gaussian_noise(image, mean=0, std=15):
    noise = np.random.normal(mean, std, image.shape).astype(np.int16)
    noisy_image = image.astype(np.int16) + noise
    noisy_image = np.clip(noisy_image, 0, 255).astype(np.uint8)
    return noisy_image

def resize_image(image, size=(224, 224)):
    return cv2.resize(image, size)


def augment_image(image):
    augments = []

    if random.random() < 0.5:
        augments.append(flip_image(image))
    if random.random() < 0.5:
        augments.append(rotate_image(image, random.choice([-15, 15])))
    if random.random() < 0.5:
        augments.append(change_brightness(image, random.randint(-40, 40)))
    if random.random() < 0.5:
        augments.append(add_gaussian_noise(image))

    return augments or [image]


def save_augmented_images(images, paths, output_dir=AUGMENTED_DIR, size=(224, 224)):
    # Ta del kode izvaja augmentacijo (povečanje) podatkov in shrani tako spremenjene slike kot tudi njihove oznake.
    # Ustvari CSV datoteko ('labels.csv'), kjer vsaka vrstica vsebuje:
    #   - ime shranjene augmentirane slike
    #   - pripadajočo oznako (ID uporabnika oz. razred), ki se določi glede na ime nadrejenega imenika originalne slike.
    # To omogoča enostavno uporabo slik pri nadzorovanem učenju (npr. za klasifikacijo)
      output_dir.mkdir(parents=True, exist_ok=True)
      label_file_path = output_dir / "labels.csv"
      with label_file_path.open(mode='w', newline='') as f:
          writer = csv.writer(f)
          writer.writerow(["filename", "label"])
          for img, original_path in zip(images, paths):
              label = original_path.parent.name
              filename = original_path.stem
              for i, aug_img in enumerate(augment_image(img)):
                  aug_img = resize_image(aug_img, size)
                  output_name = f"{filename}_aug{i}.jpg"
                  output_path = output_dir / output_name
                  cv2.imwrite(str(output_path), aug_img)
                  writer.writerow([output_name, label])
                  
if __name__ == "__main__":
    images, paths = load_images("data/raw/1")  # or another user's folder
    save_augmented_images(images, paths)
