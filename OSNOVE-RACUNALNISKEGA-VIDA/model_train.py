import os
import pandas as pd
import numpy as np
import cv2
import random
import json
from PIL import Image, ImageDraw
from sklearn.model_selection import train_test_split
import tensorflow as tf
from keras._tf_keras.keras.utils import Sequence
from keras import Sequential
from keras.layers import Conv2D, MaxPooling2D, Flatten, Dense, Dropout
import matplotlib.pyplot as plt
from config import AUGMENTED_DIR



class FaceSequence(Sequence):
    def __init__(self, image_paths, labels, batch_size=32, input_size=(224, 224), shuffle=True, augment_fn=None):
        self.image_paths = image_paths
        self.labels = labels
        self.batch_size = batch_size
        self.input_size = input_size
        self.shuffle = shuffle
        self.augment_fn = augment_fn
        self.on_epoch_end()

    def __len__(self):
        return int(np.ceil(len(self.image_paths) / self.batch_size))

    def __getitem__(self, idx):
        batch_paths = self.image_paths[idx * self.batch_size:(idx + 1) * self.batch_size]
        batch_labels = self.labels[idx * self.batch_size:(idx + 1) * self.batch_size]
        batch_images = []

        for path in batch_paths:
            img = cv2.imread(path)
            if img is None:
                continue
            img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            img = cv2.resize(img, self.input_size)
            img = img.astype(np.float32) / 255.0

            if self.augment_fn:
                img = self.augment_fn(img)

            batch_images.append(img)

        return np.array(batch_images), np.array(batch_labels)

    def on_epoch_end(self):
        if self.shuffle:
            combined = list(zip(self.image_paths, self.labels))
            random.shuffle(combined)
            self.image_paths, self.labels = zip(*combined)


# === Nalaganje poti in oznak iz labels.csv ===
def nalozi_poti_in_oznake():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    base_path = AUGMENTED_DIR 
    pot_csv = os.path.join(base_path, 'labels.csv')
    df = pd.read_csv(pot_csv)
    paths = [os.path.join(base_path, fname) for fname in df['filename']]
    labels = df['label'].values
    label_map = {label: i for i, label in enumerate(sorted(set(labels)))}
    numeric_labels = np.array([label_map[label] for label in labels])
    return np.array(paths), numeric_labels, label_map


# === CNN model za klasifikacijo obrazov ===
def zgradi_model(capacity=3, vhodna_oblika=(224, 224, 3), razredi=1, koncna_aktivacija='sigmoid'):
    model = Sequential()
    kanali = 32
    for i in range(capacity):
        model.add(Conv2D(kanali, (3, 3), padding='same', input_shape=vhodna_oblika if i == 0 else None))
        model.add(Dropout(0.25))
        model.add(tf.keras.layers.Activation('elu'))
        model.add(MaxPooling2D(pool_size=(2, 2)))
        kanali *= 2

    model.add(Flatten())
    model.add(Dense(64, activation='sigmoid'))
    model.add(Dense(64, activation='sigmoid'))
    model.add(Dense(1, activation='sigmoid'))  # Ena sama enota za binarno klasifikacijo
    model.add(Dense(razredi, activation=koncna_aktivacija)) # Uporabi posredovano aktivacijo

    return model


# === Risanje grafa točnosti ===
def narisi_grafe(history, capacity_label):
    plt.plot(history.history['accuracy'], label='Učna')
    plt.plot(history.history['val_accuracy'], label='Validacijska')
    plt.title(f'Točnost modela (kapaciteta: {capacity_label})')
    plt.xlabel('Epoha')
    plt.ylabel('Točnost')
    plt.legend()
    plt.grid(True)
    plt.savefig(f"accuracy_{capacity_label}.png")
    plt.close()


# === Glavni program ===
def main():
    poti, oznake, label_map = nalozi_poti_in_oznake()

    if len(label_map) < 1:
        print("[NAPAKA] Potrebujemo vsaj en razred (osebo) za učenje modela.")
        return

    # Če imamo samo en razred, uporabimo umetno binarno klasifikacijo (obraz vs. ni obraz)
    if len(label_map) == 1:
        oznake = np.array([1 for _ in oznake])
        print("[OPOZORILO] Samo en razred: treniranje kot binarna klasifikacija z umetnimi negativnimi primeri.")

    poti_train, poti_temp, oznake_train, oznake_temp = train_test_split(
        poti, oznake, test_size=0.4, random_state=42)
    poti_val, poti_test, oznake_val, oznake_test = train_test_split(
        poti_temp, oznake_temp, test_size=0.5, random_state=42)

    train_gen = FaceSequence(poti_train, oznake_train, batch_size=32, input_size=(224, 224))
    val_gen = FaceSequence(poti_val, oznake_val, batch_size=32, input_size=(224, 224))
    test_gen = FaceSequence(poti_test, oznake_test, batch_size=32, input_size=(224, 224), shuffle=False)

    for capacity in [2, 3, 4]:
        print(f"\n--- Učenje modela s kapaciteto {capacity} ---")
        model = zgradi_model(capacity=capacity, vhodna_oblika=(224, 224, 3), razredi=1)
        model.compile(optimizer='adam', loss='binary_crossentropy', metrics=['accuracy'])
        history = model.fit(train_gen, validation_data=val_gen, epochs=20, verbose=2)

        test_loss, test_accuracy = model.evaluate(test_gen, verbose=0)
        print(f"Testna natančnost (kapaciteta {capacity}): {test_accuracy:.4f}")

        model.save(f"model_obrazi_kapaciteta_{capacity}.keras")
        narisi_grafe(history, f"kapaciteta_{capacity}")

    if label_map:
        # Določi pot relativno glede na lokacijo TE datoteke (model_train.py)
        script_dir = os.path.dirname(os.path.abspath(__file__))
        label_map_path = os.path.join(script_dir, "label_map.json")
        
        with open(label_map_path, 'w') as f:
            json.dump(label_map, f, indent=4)
        print(f"Label map saved to {label_map_path}")
        print(f"Content of saved label_map: {label_map}")
    else:
        print("[NAPAKA] label_map je prazen, ne morem shraniti v JSON.")

if __name__ == "__main__":
    main()