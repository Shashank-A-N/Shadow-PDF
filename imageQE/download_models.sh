#!/usr/bin/env bash
set -euo pipefail

mkdir -p models

# Real-ESRGAN x4 weights
if [ ! -f models/RealESRGAN_x4plus.pth ]; then
  echo "Downloading RealESRGAN_x4plus.pth..."
  curl -L -o models/RealESRGAN_x4plus.pth \
    https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth
fi

# SwinIR x4 ONNX weights (example)
if [ ! -f models/swinir_x4.onnx ]; then
  echo "Downloading SwinIR x4 ONNX..."
  curl -L -o models/swinir_x4.onnx \
    https://github.com/JingyunLiang/SwinIR/releases/download/v0.0/swinir_x4.onnx
fi

# OpenCV DNN SuperRes fallback (EDSR x4)
if [ ! -f models/EDSR_x4.pb ]; then
  echo "Downloading EDSR_x4.pb..."
  curl -L -o models/EDSR_x4.pb \
    https://github.com/opencv/opencv_contrib/raw/4.x/modules/dnn_superres/samples/EDSR_x4.pb
fi

echo "Models ready in ./models"
