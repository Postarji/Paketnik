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