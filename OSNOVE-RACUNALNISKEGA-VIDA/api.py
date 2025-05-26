# api.py
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from PIL import Image
import numpy as np
import io

app = FastAPI()

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    contents = await file.read()
    image = Image.open(io.BytesIO(contents)).convert("L")
    image_array = np.array(image)
    
    # Tu boš kasneje uporabila pravi model
    predicted_user = "user_123"
    
    return JSONResponse(content={"user": predicted_user})
