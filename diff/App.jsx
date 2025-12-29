import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, ZoomIn, ZoomOut, Layers, FileText, Columns, Download } from 'lucide-react';

const VisualDiffTool = () => {
  const [file1, setFile1] = useState(null);
  const [file2, setFile2] = useState(null);
  const [image1, setImage1] = useState(null);
  const [image2, setImage2] = useState(null);
  const [diffMode, setDiffMode] = useState('overlay');
  const [opacity, setOpacity] = useState(50);
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(false);
  const [diffResult, setDiffResult] = useState(null);
  const [error, setError] = useState(null);
  
  const canvas1Ref = useRef(null);
  const canvas2Ref = useRef(null);
  const diffCanvasRef = useRef(null);

  const handleFileUpload = async (e, fileNum) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    
    if (fileNum === 1) {
      setFile1(file);
    } else {
      setFile2(file);
    }

    try {
      if (file.type === 'application/pdf') {
        // For PDFs, we'll use PDF.js via CDN
        // Check if PDF.js is already loaded
        if (!window['pdfjs-dist/build/pdf']) {
          await loadPdfJs();
        }
        const imageData = await convertPdfToImage(file);
        if (fileNum === 1) {
          setImage1(imageData);
        } else {
          setImage2(imageData);
        }
      } else if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (fileNum === 1) {
            setImage1(e.target.result);
          } else {
            setImage2(e.target.result);
          }
        };
        reader.readAsDataURL(file);
      } else {
        setError('Please upload an image or PDF file');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error processing file:', error);
      setError('Error processing file. Please try again.');
      setLoading(false);
    }
    
    // Set loading to false only after image processing (including async PDF) is done
    if (!file.type.startsWith('image/')) {
       // Image reader is async, so loading will be set to false in its onload
    } else if (file.type !== 'application/pdf') {
       setLoading(false);
    }
  };

  const loadPdfJs = () => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      
      script.onload = () => {
        const workerScript = document.createElement('script');
        workerScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        workerScript.onload = () => {
          window['pdfjs-dist/build/pdf'].GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          resolve();
        };
        workerScript.onerror = () => reject(new Error('Failed to load PDF.js worker'));
        document.head.appendChild(workerScript);
      };
      
      script.onerror = () => reject(new Error('Failed to load PDF.js'));
      document.head.appendChild(script);
    });
  }

  const convertPdfToImage = async (file) => {
    const pdfjsLib = window['pdfjs-dist/build/pdf'];
    if (!pdfjsLib) {
      throw new Error('PDF.js library is not loaded.');
    }
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const typedArray = new Uint8Array(e.target.result);
          const pdf = await pdfjsLib.getDocument(typedArray).promise;
          const page = await pdf.getPage(1); // Get first page
          
          const viewport = page.getViewport({ scale: 2 }); // Increase scale for better quality
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          
          await page.render({
            canvasContext: context,
            viewport: viewport
          }).promise;
          
          resolve(canvas.toDataURL('image/png'));
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (e) => reject(new Error('File reading error'));
      reader.readAsArrayBuffer(file);
    });
  };

  const loadImage = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve(img);
        setLoading(false); // Stop loading once image is loaded into memory
      };
      img.onerror = (err) => {
        reject(err);
        setLoading(false);
      }
      img.src = src;
    });
  };

  useEffect(() => {
    if (image1 && image2) {
      performDiff();
    }
  }, [image1, image2, diffMode, opacity]);

  const performDiff = async () => {
    if (!image1 || !image2) return;

    setLoading(true); // Show loading during diff calculation
    setError(null);
    setDiffResult(null); // Clear previous results

    try {
      const img1 = await loadImage(image1);
      const img2 = await loadImage(image2);
      
      const maxWidth = Math.max(img1.width, img2.width);
      const maxHeight = Math.max(img1.height, img2.height);
      
      // Draw original images to reference canvases
      if (canvas1Ref.current) {
        const ctx = canvas1Ref.current.getContext('2d');
        canvas1Ref.current.width = maxWidth;
        canvas1Ref.current.height = maxHeight;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, maxWidth, maxHeight);
        ctx.drawImage(img1, 0, 0, img1.width, img1.height);
      }
      
      if (canvas2Ref.current) {
        const ctx = canvas2Ref.current.getContext('2d');
        canvas2Ref.current.width = maxWidth;
        canvas2Ref.current.height = maxHeight;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, maxWidth, maxHeight);
        ctx.drawImage(img2, 0, 0, img2.width, img2.height);
      }

      // Perform diff
      if (diffCanvasRef.current) {
        const diffCtx = diffCanvasRef.current.getContext('2d');
        diffCanvasRef.current.width = maxWidth;
        diffCanvasRef.current.height = maxHeight;
        
        diffCtx.fillStyle = '#ffffff';
        diffCtx.fillRect(0, 0, maxWidth, maxHeight);
        
        if (diffMode === 'overlay') {
          // Overlay mode: blend both images
          diffCtx.globalAlpha = 1;
          diffCtx.drawImage(img1, 0, 0, img1.width, img1.height);
          diffCtx.globalAlpha = opacity / 100;
          // Using 'difference' can be hard to see, 'multiply' or 'screen' might be better
          // But 'difference' is what many diff tools use. Let's try to enhance it.
          // Re-drawing with 'difference'
          diffCtx.globalCompositeOperation = 'difference';
          diffCtx.drawImage(img2, 0, 0, img2.width, img2.height);
          diffCtx.globalCompositeOperation = 'source-over'; // Reset
          
          // To make differences clearer, let's also try a different blend
          // This is complex, let's stick to the original logic for now.
          // The key part is drawing both images.
          diffCtx.clearRect(0,0,maxWidth,maxHeight);
          diffCtx.globalAlpha = 1;
          diffCtx.drawImage(img1, 0, 0, img1.width, img1.height);
          diffCtx.globalAlpha = opacity / 100;
          diffCtx.drawImage(img2, 0, 0, img2.width, img2.height);
          diffCtx.globalAlpha = 1.0; // Reset alpha


        } else if (diffMode === 'sidebyside') {
          // Side by side mode
          const halfWidth = Math.floor(maxWidth / 2);
          
          // Draw image 1 on the left half
          diffCtx.drawImage(img1, 0, 0, img1.width, img1.height, 0, 0, halfWidth, maxHeight);
          
          // Draw image 2 on the right half
          diffCtx.drawImage(img2, 0, 0, img2.width, img2.height, halfWidth, 0, halfWidth, maxHeight);
          
          // Draw divider line
          diffCtx.strokeStyle = '#3b82f6'; // blue-500
          diffCtx.lineWidth = 3;
          diffCtx.beginPath();
          diffCtx.moveTo(halfWidth, 0);
          diffCtx.lineTo(halfWidth, maxHeight);
          diffCtx.stroke();

        } else if (diffMode === 'pixel') {
          // Pixel difference mode
          
          // Ensure both images are drawn at the same size for comparison
          const tempCanvas1 = document.createElement('canvas');
          tempCanvas1.width = maxWidth;
          tempCanvas1.height = maxHeight;
          const tempCtx1 = tempCanvas1.getContext('2d');
          tempCtx1.fillStyle = '#ffffff';
          tempCtx1.fillRect(0, 0, maxWidth, maxHeight);
          tempCtx1.drawImage(img1, 0, 0, img1.width, img1.height);
          const imageData1 = tempCtx1.getImageData(0, 0, maxWidth, maxHeight);
          
          const tempCanvas2 = document.createElement('canvas');
          tempCanvas2.width = maxWidth;
          tempCanvas2.height = maxHeight;
          const tempCtx2 = tempCanvas2.getContext('2d');
          tempCtx2.fillStyle = '#ffffff';
          tempCtx2.fillRect(0, 0, maxWidth, maxHeight);
          tempCtx2.drawImage(img2, 0, 0, img2.width, img2.height);
          const imageData2 = tempCtx2.getImageData(0, 0, maxWidth, maxHeight);
          
          const diffData = diffCtx.createImageData(maxWidth, maxHeight);
          let pixelsDifferent = 0;
          
          // Using pixelmatch library for better diffing if available
          // Since we can't easily import it, we'll do a manual diff
          const diffThreshold = 30; // Sensitivity for difference
          
          for (let i = 0; i < imageData1.data.length; i += 4) {
            const r1 = imageData1.data[i];
            const g1 = imageData1.data[i + 1];
            const b1 = imageData1.data[i + 2];
            
            const r2 = imageData2.data[i];
            const g2 = imageData2.data[i + 1];
            const b2 = imageData2.data[i + 2];

            const diff = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
            
            if (diff > diffThreshold) {
              // Highlight differences in red
              diffData.data[i] = 255;
              diffData.data[i + 1] = 0;
              diffData.data[i + 2] = 0;
              diffData.data[i + 3] = 255;
              pixelsDifferent++;
            } else {
              // Show desaturated version of original
              const gray = (r1 + g1 + b1) / 3;
              diffData.data[i] = gray;
              diffData.data[i + 1] = gray;
              diffData.data[i + 2] = gray;
              diffData.data[i + 3] = 255; // Full opacity
            }
          }
          
          diffCtx.putImageData(diffData, 0, 0);
          
          const totalPixels = maxWidth * maxHeight;
          const percentDiff = totalPixels > 0 ? ((pixelsDifferent / totalPixels) * 100).toFixed(2) : 0;
          setDiffResult(`${percentDiff}% pixels different (${pixelsDifferent.toLocaleString()} pixels)`);
        }
      }
    } catch (error) {
      console.error('Error performing diff:', error);
      setError('Error performing comparison. Please try again.');
    } finally {
      setLoading(false); // Done with diff
    }
  };

  const clearFiles = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setFile1(null);
    setFile2(null);
    setImage1(null);
    setImage2(null);
    setDiffResult(null);
    setError(null);
    setZoom(1);
    setOpacity(50);
    // Clear canvas
    if (diffCanvasRef.current) {
        const ctx = diffCanvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, diffCanvasRef.current.width, diffCanvasRef.current.height);
    }
  };

  const downloadDiff = () => {
    if (diffCanvasRef.current) {
      const link = document.createElement('a');
      link.download = `visual-diff-${diffMode}-${Date.now()}.png`;
      link.href = diffCanvasRef.current.toDataURL('image/png');
      link.click();
    }
  };

  // Pre-load PDF.js on component mount
  useEffect(() => {
    loadPdfJs().catch(err => {
        console.error("Failed to load PDF.js", err);
        setError("Could not load PDF renderer. Please refresh the page.");
    });
  }, []);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Visual Diff Comparison Tool
          </h1>
          <p className="text-slate-300 text-sm md:text-base">Compare PDFs and images pixel-by-pixel or side-by-side</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg">
            <p className="text-red-300 text-center">{error}</p>
          </div>
        )}

        {/* Upload Section */}
        <div className="grid md:grid-cols-2 gap-4 md:gap-6 mb-8">
          {[1, 2].map((num) => (
            <div key={num} className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 md:p-6 border border-slate-700 transition-all duration-300">
              <label className="flex flex-col items-center justify-center h-40 md:h-48 border-2 border-dashed border-slate-600 rounded-lg cursor-pointer hover:border-blue-500 transition-colors bg-slate-900/30 hover:bg-slate-900/50">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileUpload(e, num)}
                  className="hidden"
                  disabled={loading}
                />
                {(num === 1 ? file1 : file2) ? (
                  <div className="text-center px-4 relative">
                    <FileText className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 text-blue-400" />
                    <p className="text-xs md:text-sm text-slate-300 break-all" title={(num === 1 ? file1 : file2).name}>
                        {(num === 1 ? file1 : file2).name}
                    </p>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        if (num === 1) {
                          setFile1(null);
                          setImage1(null);
                        } else {
                          setFile2(null);
                          setImage2(null);
                        }
                      }}
                      className="absolute -top-2 -right-2 p-1 bg-red-600 rounded-full text-white hover:bg-red-500"
                      title="Remove file"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 text-slate-400" />
                    <p className="text-sm md:text-base text-slate-300">Upload File {num}</p>
                    <p className="text-xs text-slate-500 mt-1">PDF or Image</p>
                  </div>
                )}
              </label>
            </div>
          ))}
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
            <p className="mt-4 text-slate-300">Processing files...</p>
          </div>
        )}

        {/* Controls */}
        {image1 && image2 && !loading && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 md:p-6 border border-slate-700 mb-8">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setDiffMode('overlay')}
                  className={`px-3 md:px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm font-medium ${
                    diffMode === 'overlay'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Overlay</span>
                </button>
                <button
                  onClick={() => setDiffMode('sidebyside')}
                  className={`px-3 md:px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm font-medium ${
                    diffMode === 'sidebyside'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  <Columns className="w-4 h-4" />
                  <span>Side by Side</span>
                </button>
                <button
                  onClick={() => setDiffMode('pixel')}
                  className={`px-3 md:px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm font-medium ${
                    diffMode === 'pixel'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Pixel Diff</span>
                </button>
              </div>

              {/* === RESPONSIVE CONTROLS CHANGE HERE === */}
              {/* - Was: flex flex-wrap gap-4 items-center justify-between
                - Now: flex flex-col md:flex-row gap-4 items-start md:items-center
                - This stacks controls vertically on mobile (flex-col items-start)
                - And horizontally on medium+ screens (md:flex-row md:items-center)
              */}
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center w-full">
                {diffMode === 'overlay' && (
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <span className="text-sm text-slate-300 min-w-[50px]">Opacity:</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={opacity}
                      onChange={(e) => setOpacity(Number(e.target.value))}
                      className="w-full md:w-32"
                    />
                    <span className="text-sm text-slate-300 w-12 text-right">{opacity}%</span>
                  </div>
                )}

                {/* - Added `md:ml-auto` to this group
                  - This pushes it to the right on medium+ screens,
                  - creating a robust layout whether the opacity slider is visible or not.
                */}
                <div className="flex flex-wrap gap-2 md:ml-auto">
                  <button
                    onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}
                    className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-5 h-5" />
                  </button>
                  <span className="px-4 py-2 bg-slate-700 rounded-lg text-sm font-medium w-20 text-center">{Math.round(zoom * 100)}%</span>
                  <button
                    onClick={() => setZoom(Math.min(3, zoom + 0.25))}
                    className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-5 h-5" />
                  </button>
                  <button
                    onClick={downloadDiff}
                    className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                    title="Download Result"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  <button
                    onClick={clearFiles}
                    className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                    title="Clear All"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              {/* === END OF RESPONSIVE CHANGE === */}
            </div>

            {diffResult && (
              <div className="mt-4 p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
                <p className="text-blue-300 font-semibold text-sm md:text-base text-center">Analysis: {diffResult}</p>
              </div>
            )}
          </div>
        )}

        {/* Diff Result */}
        {image1 && image2 && !loading && (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 md:p-6 border border-slate-700">
            <h2 className="text-lg md:text-xl font-semibold mb-4">Comparison Result</h2>
            {/* - Added w-full to the container
              - Set a min-h to prevent collapse
              - Use aspect-video on mobile, and larger fixed height on desktop
            */}
            <div className="overflow-auto w-full bg-slate-900 rounded-lg p-2 md:p-4 min-h-[300px] h-[70vh] max-h-[800px]">
              <canvas
                ref={diffCanvasRef}
                style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
                className="transition-transform duration-100"
              />
            </div>
          </div>
        )}

        {/* Hidden canvases for processing */}
        <canvas ref={canvas1Ref} className="hidden" />
        <canvas ref={canvas2Ref} className="hidden" />
      </div>
    </div>
  );
};

export default VisualDiffTool;
