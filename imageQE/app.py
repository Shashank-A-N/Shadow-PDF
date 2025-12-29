from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from PIL import Image
import cv2
import numpy as np
import io
from typing import Optional

app = FastAPI(title="Image Upscaling API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def upscale_image(image: Image.Image, scale_factor: int = 2, method: str = "lanczos") -> Image.Image:
    """
    Upscale image using various methods
    Methods: lanczos, cubic, edsr, espcn
    """
    original_width, original_height = image.size
    new_width = original_width * scale_factor
    new_height = original_height * scale_factor
    
    if method == "lanczos":
        return image.resize((new_width, new_height), Image.LANCZOS)
    
    elif method == "cubic":
        return image.resize((new_width, new_height), Image.BICUBIC)
    
    elif method in ["edsr", "espcn"]:
        # Convert PIL to OpenCV format
        img_array = np.array(image)
        if img_array.shape[2] == 4:  # RGBA
            img_array = cv2.cvtColor(img_array, cv2.COLOR_RGBA2RGB)
        img_array = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
        
        # Use OpenCV's DNN super resolution
        sr = cv2.dnn_superres.DnnSuperResImpl_create()
        
        # Model paths (you need to download these)
        model_name = "EDSR" if method == "edsr" else "ESPCN"
        model_path = f"{model_name}_x{scale_factor}.pb"
        
        try:
            sr.readModel(model_path)
            sr.setModel(model_name.lower(), scale_factor)
            result = sr.upsample(img_array)
            
            # Convert back to PIL
            result = cv2.cvtColor(result, cv2.COLOR_BGR2RGB)
            return Image.fromarray(result)
        except:
            # Fallback to Lanczos if model not found
            return image.resize((new_width, new_height), Image.LANCZOS)
    
    else:
        return image.resize((new_width, new_height), Image.LANCZOS)

@app.get("/")
async def root():
    return {
        "message": "Image Upscaling API",
        "endpoints": {
            "/upscale": "POST - Upload image for upscaling",
            "/health": "GET - Health check"
        }
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/upscale")
async def upscale(
    file: UploadFile = File(...),
    scale: int = 2,
    method: str = "lanczos"
):
    """
    Upscale an image
    
    Parameters:
    - file: Image file (PNG, JPG, JPEG, WebP)
    - scale: Scale factor (2, 3, or 4)
    - method: Upscaling method (lanczos, cubic, edsr, espcn)
    """
    
    # Validate scale factor
    if scale not in [2, 3, 4]:
        raise HTTPException(status_code=400, detail="Scale must be 2, 3, or 4")
    
    # Validate method
    valid_methods = ["lanczos", "cubic", "edsr", "espcn"]
    if method not in valid_methods:
        raise HTTPException(status_code=400, detail=f"Method must be one of {valid_methods}")
    
    # Read and validate image
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Convert to RGB if necessary
        if image.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', image.size, (255, 255, 255))
            if image.mode == 'P':
                image = image.convert('RGBA')
            background.paste(image, mask=image.split()[-1] if image.mode in ('RGBA', 'LA') else None)
            image = background
        elif image.mode != 'RGB':
            image = image.convert('RGB')
            
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image file: {str(e)}")
    
    # Check image size limits
    max_pixels = 4000 * 4000
    if image.size[0] * image.size[1] > max_pixels:
        raise HTTPException(status_code=400, detail="Image too large. Maximum 4000x4000 pixels")
    
    # Upscale image
    try:
        upscaled_image = upscale_image(image, scale, method)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upscaling failed: {str(e)}")
    
    # Convert to bytes
    img_byte_arr = io.BytesIO()
    upscaled_image.save(img_byte_arr, format='PNG', optimize=True)
    img_byte_arr.seek(0)
    
    return StreamingResponse(
        img_byte_arr,
        media_type="image/png",
        headers={
            "Content-Disposition": f"attachment; filename=upscaled_{scale}x_{file.filename}",
            "X-Original-Size": f"{image.size[0]}x{image.size[1]}",
            "X-Upscaled-Size": f"{upscaled_image.size[0]}x{upscaled_image.size[1]}"
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)