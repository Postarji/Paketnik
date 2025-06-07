from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent
DATA_DIR = PROJECT_ROOT / "data"
RAW_DIR = DATA_DIR / "raw"
AUGMENTED_DIR = DATA_DIR / "augmented"
METADATA_FILE = PROJECT_ROOT / "metadata.json"
