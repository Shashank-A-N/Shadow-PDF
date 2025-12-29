# 🚀 AI-Powered PDF & Image Toolkit

[![Project Status](https://img.shields.io/badge/status-in%20development-blueviolet.svg)](https://github.com/Shashank-A-N/Shadow-PDF)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Issues](https://img.shields.io/github/issues/Shashank-A-N/Shadow-PDF)](https://github.com/Shashank-A-N/Shadow-PDF/issues)

A comprehensive, AI-powered web application with 40+ tools for all your PDF and image needs. Convert, edit, merge, split, and analyze your documents in one place.

![Project Screenshot](https://files.fm/u/nwtdgsspnz)

---

## 📋 Table of Contents

- [About The Project](#about-the-project)
- [✨ Key Features](#-key-features)
- [🛠️ Technology Stack](#️-technology-stack)
- [🚀 Getting Started](#-getting-started)
- [🔧 Usage](#-usage)
- [🛣️ Project Status & Roadmap](#️-project-status--roadmap)
- [🤝 Contributing](#-contributing)
- [📜 License](#-license)

---

## 📖 About The Project

The **AI-Powered PDF & Image Toolkit** is a comprehensive web-based suite designed to revolutionize how users interact with digital documents and images. This all-in-one platform combines over 40 traditional PDF manipulation tools with cutting-edge AI capabilities (powered by Google Gemini), offering an intelligent and seamless experience for document processing, conversion, editing, and analysis.

It's built to be a fast, secure, and user-friendly **Progressive Web App (PWA)**, allowing you to "install" it on your desktop or mobile device for an app-like experience and offline access to many tools.

---

## ✨ Key Features

This project includes over 40 specialized tools, organized into 6 main categories:

### 🤖 AI-Powered Tools (Powered by Google Gemini)
* **AI Document Summarizer:** Get concise summaries of lengthy documents.
* **Q&A with Document:** Ask questions about your PDF and get intelligent answers.
* **Image Quality Enhancer:** Revitalize blurry or low-quality photos.
* **Image Background Remover:** Instantly remove backgrounds with AI precision.

### 🗂️ PDF Organization & Management
* **Merge PDF:** Combine multiple PDFs into one.
* **Split PDF:** Separate pages into independent files.
* **Organize PDF:** Visually reorder, add, rotate, and delete pages.
* **Remove Pages:** Select and remove specific pages.
* **Extract Pages:** Create a new PDF from selected pages.
* **Scan to PDF:** Capture images from your camera and convert to PDF.
* **Rearrange Pages:** Visually drag and drop pages into a new order.
* **Compare PDF:** Show a side-by-side comparison to spot changes.

### ⚡ PDF Optimization & Repair
* **Compress PDF:** Reduce file size while maintaining quality.
* **Repair PDF:** Recover data from corrupt or damaged PDF files.
* **OCR PDF:** Convert scanned PDFs into searchable text.

### 🔄 File Conversion
* **To PDF:** Convert `Image`, `Word`, `PowerPoint`, `Excel`, and `HTML` to PDF.
* **From PDF:** Convert PDF to `Image`, `Word`, `PowerPoint`, `Excel`, and `HTML`.
* **PDF to PDF/A:** Convert PDFs to the ISO-standardized format for long-term archiving.

### ✏️ PDF Editing & Customization
* **Edit PDF:** Add text, images, shapes, and freehand annotations.
* **Rotate PDF:** Rotate all or specific pages.
* **Watermark:** Stamp an image or text over your PDF.
* **Crop PDF:** Crop margins or select specific areas.
* **Add Page Numbers:** Customize and add page numbers.

### 🛡️ PDF Security & Protection
* **Protect PDF:** Add a password to encrypt your document.
* **Unlock PDF:** Remove password protection from a PDF.
* **Redact PDF:** Permanently black out sensitive information.
* **PDF Permissions:** Control user access to printing, copying, or editing.
* **PDF Secret Hider:** Hide secret messages within PDF files (Steganography).
* **Forensics Analyzer:** Analyze PDF metadata and hidden content.

###  workflow
* **Create Workflow:** Combine multiple tools to automate repetitive tasks.

---

## 🛠️ Technology Stack

This project is built with a modern, scalable tech stack:

* **Frontend:**
    * HTML5
    * JavaScript (ES6+)
    * Tailwind CSS
* **PWA Features:**
    * Service Workers (`sw.js`)
    * Web App Manifest (`manifest.json`)
* **Backend & APIs:**
    * Node.js / Python (for heavy tasks like OCR, Repair) - Deployed on services like Render.
    * Google Gemini API (for AI features)
    * Client-side libraries like `PDF.js` for in-browser rendering.

---

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

You need a modern web browser and a local web server to handle PWA features. The easiest way is using the **[Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)** extension for VS Code.

### Installation

1.  Clone the repo:
    ```sh
    git clone [https://github.com/YOUR_USERNAME/YOUR_REPO.git](https://github.com/YOUR_USERNAME/YOUR_REPO.git)
    ```
2.  Navigate to the project directory:
    ```sh
    cd YOUR_REPO
    ```
3.  If you have the "Live Server" extension in VS Code, right-click on `index.html` and choose **"Open with Live Server"**. This is required for the Service Worker and "Install" functionality to work.

---

## 🔧 Usage

Open the application in your browser from the Live Server. You will see the "Install App" button in the header, allowing you to add it to your desktop or home screen.

Simply click on any of the 40+ tool cards to start, or use the search bar to find the exact tool you need.

---

## 🛣️ Project Status & Roadmap

* **Completed:** 40+ client-side and server-side tools, responsive UI, dark mode, and PWA installability.
* **In Progress:** Backend API integration for AI tools, user authentication.
* **Planned:**
    * Cloud integration for file history.
    * Advanced OCR and AI enhancements (translation, tone analysis).
    * Collaborative features (real-time editing, comments).

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## 📜 License

Distributed under the MIT License. See `LICENSE` file for more information.
