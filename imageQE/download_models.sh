#!/usr/bin/env bash
set -e

mkdir -p models

# Real-ESRGAN weights
curl -L -o models/RealESRGAN_x4plus.pth \
  https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth

# SwinIR ONNX weights (example x4 model)
curl -L -o models/swinir_x4.onnx \
  https://github.com/JingyunLiang/SwinIR/releases/download/v0.0/swinir_x4.onnx

# OpenCV DNN SR fallback model
curl -L -o models/EDSR_x4.pb \
  https://github.com/opencv/opencv_contrib/raw/4.x/modules/dnn_superres/samples/EDSR_x4.pb
