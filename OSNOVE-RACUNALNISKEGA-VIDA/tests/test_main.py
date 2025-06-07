import pytest
import os
from pathlib import Path
from data.data_capture import ensure_user_dir, save_metadata

@pytest.fixture
def test_user_dir(tmp_path):
    user_id = "test_user"
    user_path = ensure_user_dir(user_id, base_dir=tmp_path)
    return user_id, user_path

def test_ensure_user_dir_creates_folder(test_user_dir):
    user_id, user_path = test_user_dir
    assert user_path.exists()
    assert user_path.is_dir()

def test_save_metadata_creates_json(test_user_dir):
    user_id, user_path = test_user_dir
    save_metadata(user_id, 10, path=user_path / "metadata.json")
    metadata_file = user_path / "metadata.json"
    assert metadata_file.exists()

    import json
    with open(metadata_file, "r") as f:
        data = json.load(f)
    assert data["user_id"] == user_id
    assert data["images_captured"] == 10
