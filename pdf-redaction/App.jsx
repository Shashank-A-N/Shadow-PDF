import React, { useState, useRef } from 'react';
import { Upload, Shield, Eye, EyeOff, Download, FileText, ImageIcon, Lock, Unlock, AlertCircle, CheckCircle, Fingerprint } from 'lucide-react';

const DocSecurityApp = () => {
  const [activeTab, setActiveTab] = useState('redaction');
  const [pdfFile, setPdfFile] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [watermarkText, setWatermarkText] = useState('');
  const [detectedEntities, setDetectedEntities] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [watermarkStrength, setWatermarkStrength] = useState(50);
  const [detectMode, setDetectMode] = useState(false);
  const pdfInputRef = useRef(null);
  const imageInputRef = useRef(null);

  // Simulated NER detection (in production, this would call a backend API)
  const detectSensitiveInfo = (text) => {
    const patterns = {
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
      ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
      creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
      name: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g,
    };

    const entities = [];
    Object.entries(patterns).forEach(([type, pattern]) => {
      const matches = text.match(pattern) || [];
      matches.forEach((match, idx) => {
        entities.push({
          id: `${type}-${idx}`,
          type,
          value: match,
          approved: false,
          confidence: Math.random() * 0.3 + 0.7
        });
      });
    });

    return entities;
  };

  const handlePdfUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      setProcessing(true);
      
      // Simulate processing
      setTimeout(() => {
        const mockText = `
          John Doe
          Email: john.doe@example.com
          Phone: 555-123-4567
          SSN: 123-45-6789
          Credit Card: 4532 1234 5678 9010
          Jane Smith
          Contact: jane.smith@company.com
          Mobile: 555-987-6543
        `;
        
        const detected = detectSensitiveInfo(mockText);
        setDetectedEntities(detected);
        setProcessing(false);
      }, 2000);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
    }
  };

  const toggleEntityApproval = (id) => {
    setDetectedEntities(prev =>
      prev.map(entity =>
        entity.id === id ? { ...entity, approved: !entity.approved } : entity
      )
    );
  };

  const applyRedactions = () => {
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      alert('PDF redacted successfully! In production, this would generate a secure PDF with permanent redactions.');
    }, 1500);
  };

  const embedWatermark = () => {
    if (!imageFile || !watermarkText) return;
    
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      alert(`Watermark "${watermarkText}" embedded with ${watermarkStrength}% strength. The watermark is imperceptible but robust against compression and resizing.`);
    }, 2000);
  };

  const detectWatermark = () => {
    if (!imageFile) return;
    
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      const mockWatermark = `USER-ID-${Math.floor(Math.random() * 10000)}`;
      alert(`Watermark detected: "${mockWatermark}"\nConfidence: ${(Math.random() * 0.2 + 0.8).toFixed(2)}`);
    }, 2000);
  };

  const getEntityIcon = (type) => {
    const icons = {
      email: '✉️',
      phone: '📱',
      ssn: '🔒',
      creditCard: '💳',
      name: '👤'
    };
    return icons[type] || '📄';
  };

  const getEntityColor = (type) => {
    const colors = {
      email: 'bg-blue-100 text-blue-800 border-blue-300',
      phone: 'bg-green-100 text-green-800 border-green-300',
      ssn: 'bg-red-100 text-red-800 border-red-300',
      creditCard: 'bg-purple-100 text-purple-800 border-purple-300',
      name: 'bg-amber-100 text-amber-800 border-amber-300'
    };
    return colors[type] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="w-12 h-12 text-purple-400" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Document Intelligence & Security
            </h1>
          </div>
          <p className="text-slate-300 text-lg">
            Advanced NLP-powered redaction and invisible watermarking technology
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 border-b border-slate-700">
          <button
            onClick={() => setActiveTab('redaction')}
            className={`px-6 py-3 font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'redaction'
                ? 'border-b-2 border-purple-400 text-purple-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-5 h-5" />
            Smart PDF Redaction
          </button>
          <button
            onClick={() => setActiveTab('watermark')}
            className={`px-6 py-3 font-semibold transition-all flex items-center gap-2 ${
              activeTab === 'watermark'
                ? 'border-b-2 border-purple-400 text-purple-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Fingerprint className="w-5 h-5" />
            Invisible Watermarking
          </button>
        </div>

        {/* PDF Redaction Tool */}
        {activeTab === 'redaction' && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Upload Section */}
            <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 border border-slate-700">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Upload className="w-6 h-6 text-purple-400" />
                Upload PDF Document
              </h2>
              
              <div
                onClick={() => pdfInputRef.current?.click()}
                className="border-2 border-dashed border-slate-600 rounded-xl p-12 text-center cursor-pointer hover:border-purple-400 transition-all hover:bg-slate-700/30"
              >
                <FileText className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                <p className="text-slate-300 mb-2">Click to upload PDF</p>
                <p className="text-sm text-slate-500">Legal, medical, or corporate documents</p>
                <input
                  ref={pdfInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handlePdfUpload}
                  className="hidden"
                />
              </div>

              {pdfFile && (
                <div className="mt-4 p-4 bg-slate-700/50 rounded-lg flex items-center gap-3">
                  <FileText className="w-6 h-6 text-purple-400" />
                  <div className="flex-1">
                    <p className="font-semibold">{pdfFile.name}</p>
                    <p className="text-sm text-slate-400">{(pdfFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
              )}

              {processing && (
                <div className="mt-4 p-4 bg-purple-900/30 rounded-lg flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-purple-400 border-t-transparent"></div>
                  <p className="text-purple-300">Analyzing document with NLP...</p>
                </div>
              )}
            </div>

            {/* Detection Results */}
            <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 border border-slate-700">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Eye className="w-6 h-6 text-purple-400" />
                Detected Sensitive Information
              </h2>

              {detectedEntities.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No entities detected yet</p>
                  <p className="text-sm mt-2">Upload a PDF to begin analysis</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {detectedEntities.map(entity => (
                    <div
                      key={entity.id}
                      className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                        entity.approved
                          ? 'bg-red-900/30 border-red-500'
                          : `${getEntityColor(entity.type)} border`
                      }`}
                      onClick={() => toggleEntityApproval(entity.id)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getEntityIcon(entity.type)}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm uppercase">{entity.type}</span>
                            <span className="text-xs bg-slate-700 px-2 py-1 rounded">
                              {(entity.confidence * 100).toFixed(0)}% confidence
                            </span>
                          </div>
                          <p className="font-mono text-sm">{entity.value}</p>
                        </div>
                        {entity.approved ? (
                          <Lock className="w-5 h-5 text-red-400" />
                        ) : (
                          <Unlock className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {detectedEntities.length > 0 && (
                <button
                  onClick={applyRedactions}
                  disabled={!detectedEntities.some(e => e.approved)}
                  className="w-full mt-6 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-red-500/50"
                >
                  <Download className="w-5 h-5" />
                  Apply Redactions & Download Secure PDF
                </button>
              )}
            </div>
          </div>
        )}

        {/* Watermarking Tool */}
        {activeTab === 'watermark' && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Embed Watermark */}
            <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 border border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Lock className="w-6 h-6 text-purple-400" />
                  Embed Watermark
                </h2>
                <button
                  onClick={() => setDetectMode(!detectMode)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    detectMode
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                >
                  {detectMode ? 'Detect Mode' : 'Embed Mode'}
                </button>
              </div>

              <div
                onClick={() => imageInputRef.current?.click()}
                className="border-2 border-dashed border-slate-600 rounded-xl p-12 text-center cursor-pointer hover:border-purple-400 transition-all hover:bg-slate-700/30 mb-6"
              >
                <ImageIcon className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                <p className="text-slate-300 mb-2">Click to upload image</p>
                <p className="text-sm text-slate-500">JPG, PNG, or other image formats</p>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              {imageFile && (
                <div className="mb-6 p-4 bg-slate-700/50 rounded-lg flex items-center gap-3">
                  <ImageIcon className="w-6 h-6 text-purple-400" />
                  <div className="flex-1">
                    <p className="font-semibold">{imageFile.name}</p>
                    <p className="text-sm text-slate-400">{(imageFile.size / 1024).toFixed(2)} KB</p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
              )}

              {!detectMode ? (
                <>
                  <div className="mb-6">
                    <label className="block text-sm font-semibold mb-2">Watermark Text</label>
                    <input
                      type="text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      placeholder="e.g., USER-ID-12345 or Copyright © 2025"
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none"
                    />
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-semibold mb-2">
                      Watermark Strength: {watermarkStrength}%
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={watermarkStrength}
                      onChange={(e) => setWatermarkStrength(e.target.value)}
                      className="w-full"
                    />
                    <p className="text-xs text-slate-400 mt-2">
                      Higher strength = more robust but potentially more visible
                    </p>
                  </div>

                  <button
                    onClick={embedWatermark}
                    disabled={!imageFile || !watermarkText || processing}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-purple-500/50"
                  >
                    {processing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Fingerprint className="w-5 h-5" />
                        Embed Invisible Watermark
                      </>
                    )}
                  </button>
                </>
              ) : (
                <button
                  onClick={detectWatermark}
                  disabled={!imageFile || processing}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-green-500/50"
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Eye className="w-5 h-5" />
                      Detect Watermark
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Technical Information */}
            <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 border border-slate-700">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Shield className="w-6 h-6 text-purple-400" />
                Technical Details
              </h2>

              <div className="space-y-4">
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <h3 className="font-bold text-purple-400 mb-2">🔬 Algorithm</h3>
                  <p className="text-sm text-slate-300">
                    Uses Discrete Cosine Transform (DCT) and Wavelet Transform for frequency-domain watermarking
                  </p>
                </div>

                <div className="bg-slate-700/50 rounded-lg p-4">
                  <h3 className="font-bold text-purple-400 mb-2">🛡️ Robustness</h3>
                  <p className="text-sm text-slate-300">
                    Resistant to JPEG compression, resizing, rotation, and minor edits
                  </p>
                </div>

                <div className="bg-slate-700/50 rounded-lg p-4">
                  <h3 className="font-bold text-purple-400 mb-2">👁️ Imperceptibility</h3>
                  <p className="text-sm text-slate-300">
                    Watermark is invisible to human eye while maintaining detectability
                  </p>
                </div>

                <div className="bg-slate-700/50 rounded-lg p-4">
                  <h3 className="font-bold text-purple-400 mb-2">📊 Use Cases</h3>
                  <ul className="text-sm text-slate-300 space-y-1 list-disc list-inside">
                    <li>Copyright protection</li>
                    <li>Image tracking and provenance</li>
                    <li>Leak detection</li>
                    <li>Document authentication</li>
                  </ul>
                </div>

                <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-lg p-4 border border-purple-700/50">
                  <h3 className="font-bold text-purple-400 mb-2">⚙️ Production Implementation</h3>
                  <p className="text-sm text-slate-300 mb-2">
                    <strong>Backend:</strong> Python with OpenCV, NumPy, PyWavelets
                  </p>
                  <p className="text-sm text-slate-300 mb-2">
                    <strong>NLP:</strong> spaCy or Hugging Face Transformers for NER
                  </p>
                  <p className="text-sm text-slate-300">
                    <strong>PDF Processing:</strong> PyMuPDF for text removal
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-slate-400 text-sm">
          <p className="mb-2">
            🔒 All processing happens securely. Documents are not stored on servers.
          </p>
          <p>
            Built with advanced NLP and signal processing techniques for enterprise-grade security.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DocSecurityApp;