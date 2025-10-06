import { useState, useRef } from 'react';
import { Upload, Download, Image as ImageIcon } from 'lucide-react';

type Quality = 'detailed' | 'intermediate' | 'regular';

function App() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [asciiArt, setAsciiArt] = useState<string>('');
  const [quality, setQuality] = useState<Quality>('intermediate');
  const [isColorful, setIsColorful] = useState(false);
  const [imageSize, setImageSize] = useState(100);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getCharacterSet = (quality: Quality): string => {
    switch (quality) {
      case 'detailed':
        return '@%#*+=-:. ';
      case 'intermediate':
        return '@%#*+=-:. '.substring(0, 7);
      case 'regular':
        return '@%#+-. ';
      default:
        return '@%#*+=-:. ';
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setSelectedImage(result);
        convertToASCII(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const convertToASCII = (imageSrc: string) => {
    setIsProcessing(true);
    const img = new Image();
    
    img.onerror = () => {
      console.error("Error loading image for conversion.");
      setIsProcessing(false);
      setAsciiArt('Error loading image. Please try a different file.');
    };

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        setIsProcessing(false);
        return;
      }

      const aspectRatio = img.height / img.width;
      const width = imageSize;
      const height = Math.floor(width * aspectRatio * 0.5);

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(img, 0, 0, width, height);
      const imageData = ctx.getImageData(0, 0, width, height);

      const chars = getCharacterSet(quality);
      let ascii = '';

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const offset = (y * width + x) * 4;
          const r = imageData.data[offset];
          const g = imageData.data[offset + 1];
          const b = imageData.data[offset + 2];

          const brightness = (r + g + b) / 3;
          const charIndex = Math.floor((brightness / 255) * (chars.length - 1));
          const char = chars[chars.length - 1 - charIndex];

          if (isColorful) {
            ascii += `<span style="color:rgb(${r},${g},${b})">${char}</span>`;
          } else {
            ascii += char;
          }
        }
        ascii += isColorful ? '<br>' : '\n';
      }

      setAsciiArt(ascii);
      setIsProcessing(false);
    };
    img.src = imageSrc;
  };

  const downloadASCII = () => {
    if (!asciiArt) return;

    let blob: Blob;
    let fileName: string;

    if (isColorful) {
      const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Colorful ASCII Art</title>
  <style>
    body {
      background: #000;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
    }
    pre {
      font-family: monospace;
      line-height: 1;
      letter-spacing: 0;
      font-size: 10px;
      white-space: pre-wrap;
    }
  </style>
</head>
<body>
  <pre>${asciiArt}</pre>
</body>
</html>`;
      blob = new Blob([htmlContent], { type: 'text/html' });
      fileName = 'ascii-art.html';
    } else {
      blob = new Blob([asciiArt], { type: 'text/plain' });
      fileName = 'ascii-art.txt';
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSettingChange = (callback: () => void) => {
    callback();
    if (selectedImage) {
      setTimeout(() => convertToASCII(selectedImage), 0);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <ImageIcon className="w-10 h-10 text-slate-700" />
            <h1 className="text-5xl font-extrabold text-slate-800">ASCII Art Converter</h1>
          </div>
          <p className="text-slate-600 text-lg">Transform your images into stunning character mosaics</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Settings Panel */}
          <div className="bg-white rounded-2xl shadow-xl p-8 transition-all duration-300">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 border-b pb-3">Image & Settings</h2>

            {/* Upload Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-3 border-dashed border-blue-300 rounded-xl p-12 text-center cursor-pointer transition-all duration-300 hover:border-blue-500 hover:bg-blue-50/50 mb-6"
            >
              <Upload className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <p className="text-slate-700 font-medium">Click to upload an image</p>
              <p className="text-slate-500 text-sm mt-2">JPG, PNG, GIF</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {selectedImage && (
              <div className="mb-6 rounded-xl overflow-hidden shadow-inner border-4 border-slate-100 p-2">
                <img src={selectedImage} alt="Selected" className="w-full h-auto rounded-lg object-contain max-h-64" />
              </div>
            )}

            {/* Controls */}
            <div className="space-y-6">
              {/* Quality Setting */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">Quality / Character Set</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['regular', 'intermediate', 'detailed'] as Quality[]).map((q) => (
                    <button
                      key={q}
                      onClick={() => handleSettingChange(() => setQuality(q))}
                      className={`py-3 px-4 rounded-xl font-medium capitalize transition-all duration-300 shadow-sm ${
                        quality === q
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Size Setting */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Output Width: {imageSize} characters
                </label>
                <input
                  type="range"
                  min="50"
                  max="200"
                  value={imageSize}
                  onChange={(e) => handleSettingChange(() => setImageSize(parseInt(e.target.value)))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              {/* Style Setting */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">Color Style</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleSettingChange(() => setIsColorful(false))}
                    className={`py-3 px-4 rounded-xl font-medium transition-all duration-300 shadow-sm ${
                      !isColorful
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Monochrome
                  </button>
                  <button
                    onClick={() => handleSettingChange(() => setIsColorful(true))}
                    className={`py-3 px-4 rounded-xl font-medium transition-all duration-300 shadow-sm ${
                      isColorful
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Colorful
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="bg-white rounded-2xl shadow-xl p-8 transition-all duration-300">
            <div className="flex items-center justify-between mb-6 border-b pb-3">
              <h2 className="text-2xl font-bold text-slate-800">Preview</h2>
              {asciiArt && !isProcessing && (
                <button
                  onClick={downloadASCII}
                  className="flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-green-600 transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-green-500/50"
                >
                  <Download className="w-5 h-5" />
                  Download {isColorful ? 'HTML' : 'TXT'}
                </button>
              )}
            </div>

            <div className="bg-slate-900 rounded-xl p-6 overflow-auto max-h-[600px] min-h-[400px]">
              {isProcessing ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-slate-400 text-center">
                    <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p>Processing your image...</p>
                  </div>
                </div>
              ) : asciiArt ? (
                isColorful ? (
                  <pre
                    className="font-mono text-[6px] leading-none text-slate-200"
                    dangerouslySetInnerHTML={{ __html: asciiArt }}
                  />
                ) : (
                  <pre className="font-mono text-[6px] leading-none text-slate-200">
                    {asciiArt}
                  </pre>
                )
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-slate-400 text-center">
                    Upload an image to see the ASCII art preview
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
