from data.data_capture import capture_images
from augument_faces import load_images, save_augmented_images
from model_train import main as train_model_main
from config import RAW_DIR, AUGMENTED_DIR, METADATA_FILE


def main():
    print("Starting Face Authentication System...")

    user_input = input("Enter User ID or Name: ")

    print("Capturing face images...")
    capture_images(user_id=user_input, count=50, color_space='grayscale')

    print("Loading captured images for augmentation...")
    user_folder = RAW_DIR / user_input
    images, paths = load_images(user_folder)

    if not images:
        print(f"[ERROR] No images found in {user_folder}.")
        return

    print("Augmenting and saving images...")
    save_augmented_images(images, paths, output_dir=AUGMENTED_DIR, size=(224, 224))
    
    print("Training the model...")
    train_model_main()

    print("Done. Images captured and augmented.")

if __name__ == "__main__":
    main()
