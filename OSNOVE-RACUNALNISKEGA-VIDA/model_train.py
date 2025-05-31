import os
import pandas as pd
import numpy as np
import cv2
import random
from PIL import Image, ImageDraw
from sklearn.model_selection import train_test_split
import tensorflow as tf
from keras._tf_keras.keras.utils import Sequence
from keras import Sequential
from keras.layers import Conv2D, MaxPooling2D, Flatten, Dense, Dropout
import matplotlib.pyplot as plt



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