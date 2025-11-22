import { useRef, useState, useEffect } from 'react';
import { Navigation } from './Navigation';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { Upload, FileText, Image, Video, CheckCircle, AlertCircle, Zap, Brain, X, Clock, Target, Cpu, Shield, Link, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { DetectionResult, User } from '../App';
import { api, USE_MOCK_API } from '../services/api';
import { MockApiService } from '../services/mockApi';

interface UploadPageProps {
  navigate: (page: string) => void;
  user: User | null;
  logout: () => void;
  addDetectionResult: (result: DetectionResult) => void;
  onViewResult: (result: DetectionResult) => void;
}

export function UploadPage({ navigate, user, logout, addDetectionResult, onViewResult }: UploadPageProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [inputMode, setInputMode] = useState<'file' | 'url'>('file');
  const [imageUrl, setImageUrl] = useState('');
  const [urlPreview, setUrlPreview] = useState<string | null>(null);
  const [validatingUrl, setValidatingUrl] = useState(false);
  const urlValidationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const acceptedTypes = [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp',
    'video/mp4', 'video/mov', 'video/avi', 'video/mkv', 'video/webm', 'video/flv', 'video/wmv'
  ];
  const maxFileSize = 50 * 1024 * 1024; // 50MB

const mockApiInstance = USE_MOCK_API ? new MockApiService() : null;

  const validateFile = (file: File) => {
    if (!acceptedTypes.includes(file.type)) {
      return 'Please upload a valid image (JPEG, PNG, WebP, GIF, BMP) or video (MP4, MOV, AVI, MKV, WebM, FLV, WMV) file.';
    }
    if (file.size > maxFileSize) {
      return 'File size must be less than 50MB.';
    }
    return null;
  };

  const handleFileSelect = (selectedFile: File) => {
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setFile(selectedFile);
    setError(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const removeFile = () => {
    setFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateAndPreviewUrl = async (url: string) => {
    if (!url.trim()) {
      setUrlPreview(null);
      setError(null);
      return;
    }

    try {
      let processedUrl = url.trim();
      
      // Check if it's raw base64 data (starts with base64 characters but no data: prefix)
      // Base64 pattern: alphanumeric, +, /, =, and may contain whitespace/newlines
      const base64Pattern = /^[A-Za-z0-9+/=\s\n\r]+$/;
      const cleanedUrl = processedUrl.replace(/\s/g, '').replace(/\n/g, '').replace(/\r/g, '');
      
      // Check if it looks like raw base64 (no protocol, matches base64 pattern, reasonable length)
      const isRawBase64 = !processedUrl.startsWith('data:') && 
                          !processedUrl.startsWith('http://') && 
                          !processedUrl.startsWith('https://') &&
                          base64Pattern.test(processedUrl) &&
                          cleanedUrl.length >= 20; // Minimum for base64 image (even small images)
      
      // If it's raw base64, prepend the data URL prefix (assume JPEG)
      if (isRawBase64) {
        processedUrl = `data:image/jpeg;base64,${cleanedUrl}`;
        console.log('[URL] Detected raw base64, prepended data URL prefix. Length:', cleanedUrl.length);
      }
      
      // Check if it's a base64 data URL
      const isBase64 = processedUrl.startsWith('data:image/');
      
      if (isBase64) {
        // Validate base64 format - use DOTALL flag to match newlines
        const base64Match = processedUrl.match(/^data:image\/(\w+);base64,(.+)$/s);
        if (!base64Match) {
          setError('Invalid base64 image format. Expected: data:image/[type];base64,[data]');
          setUrlPreview(null);
          setValidatingUrl(false);
          return;
        }
        
        const imageType = base64Match[1].toLowerCase();
        const allowedTypes = ['jpeg', 'jpg', 'png', 'gif', 'webp', 'bmp'];
        if (!allowedTypes.includes(imageType)) {
          setError(`Unsupported image type: ${imageType}. Supported: ${allowedTypes.join(', ')}`);
          setUrlPreview(null);
          setValidatingUrl(false);
          return;
        }
        
        // Extract and clean base64 data (remove whitespace/newlines)
        const base64Data = base64Match[2].trim().replace(/\n/g, '').replace(/\r/g, '').replace(/ /g, '');
        
        // Check size (approximate - base64 is ~33% larger than binary)
        const sizeInBytes = (base64Data.length * 3) / 4;
        if (sizeInBytes > 16 * 1024 * 1024) {
          setError('Image too large (max 16MB)');
          setUrlPreview(null);
          setValidatingUrl(false);
          return;
        }
        
        setValidatingUrl(true);
        setError(null);
        
        // Try to load image for preview
        const img = document.createElement('img');
        await new Promise((resolve, reject) => {
          img.onload = () => {
            setUrlPreview(processedUrl);
            setImageUrl(processedUrl); // Update the input with the processed URL
            setValidatingUrl(false);
            resolve(null);
          };
          img.onerror = () => {
            setError('Invalid base64 image data. Please check the image address.');
            setUrlPreview(null);
            setValidatingUrl(false);
            reject(new Error('Image load failed'));
          };
          img.src = processedUrl;
        });
      } else {
        // Regular HTTP/HTTPS URL
        const urlObj = new URL(processedUrl);
        if (!['http:', 'https:'].includes(urlObj.protocol)) {
          setError('Only HTTP, HTTPS URLs, or base64 data URLs are supported');
          setUrlPreview(null);
          return;
        }

        setValidatingUrl(true);
        setError(null);

        // Try to load image for preview
        const img = document.createElement('img');
        img.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
          img.onload = () => {
            setUrlPreview(processedUrl);
            setImageUrl(processedUrl); // Update the input with the processed URL
            setValidatingUrl(false);
            resolve(null);
          };
          img.onerror = () => {
            setError('Could not load image from URL. Please check the URL is valid and accessible.');
            setUrlPreview(null);
            setValidatingUrl(false);
            reject(new Error('Image load failed'));
          };
          img.src = processedUrl;
        });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('[URL Validation Error]', errorMsg);
      
      // Provide more helpful error message
      if (url.trim().length > 20 && !url.includes('://') && !url.startsWith('data:')) {
        setError('Invalid base64 format. If pasting base64 data, ensure it includes the full data URL prefix: data:image/[type];base64,[data]');
      } else {
        setError('Invalid image address format. Please enter a valid HTTP/HTTPS URL or base64 data URL (data:image/...).');
      }
      setUrlPreview(null);
      setValidatingUrl(false);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setImageUrl(url);
    
    // Clear previous timeout
    if (urlValidationTimeoutRef.current) {
      clearTimeout(urlValidationTimeoutRef.current);
    }
    
    // Debounce URL validation
    urlValidationTimeoutRef.current = setTimeout(() => {
      validateAndPreviewUrl(url);
    }, 500);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (urlValidationTimeoutRef.current) {
        clearTimeout(urlValidationTimeoutRef.current);
      }
    };
  }, []);

  const startDetection = async () => {
    if (inputMode === 'url') {
      if (!imageUrl.trim()) {
        setError('Please enter an image URL.');
        return;
      }
      
      if (!urlPreview) {
        setError('Please wait for URL validation to complete.');
        return;
      }
      
      setError(null);
      setUploading(true);
      setAnalyzing(true);
      setProgress(0);

      try {
        let detection: DetectionResult | null = null;

        if (USE_MOCK_API && mockApiInstance) {
          // Mock API doesn't support URL yet, use file upload simulation
          const response = await mockApiInstance.detectDeepfake(new File([], 'url-image.jpg'), setProgress);
          detection = {
            ...response.result,
            confidence: response.result.confidence,
          };
        } else {
          const response = await api.detectDeepfakeFromUrl(imageUrl, setProgress);
          detection = response;
        }

        if (detection) {
          await addDetectionResult(detection);
          setImageUrl('');
          setUrlPreview(null);
          onViewResult(detection);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to analyze the image from URL. Please try again.',
        );
      } finally {
        setUploading(false);
        setAnalyzing(false);
        setProgress(0);
      }
    } else {
      if (!file) {
        setError('Please select a file to analyze.');
        return;
      }
      
      setError(null);
      setUploading(true);
      setAnalyzing(true);
      setProgress(0);

      try {
        let detection: DetectionResult | null = null;

        if (USE_MOCK_API && mockApiInstance) {
          const response = await mockApiInstance.detectDeepfake(file, setProgress);
          detection = {
            ...response.result,
            confidence: response.result.confidence,
          };
        } else {
          const response = await api.detectDeepfake(file, setProgress);
          detection = response;
        }

        if (detection) {
          await addDetectionResult(detection);
          removeFile();
          onViewResult(detection);
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to analyze the file. Please try again.',
        );
      } finally {
        setUploading(false);
        setAnalyzing(false);
        setProgress(0);
      }
    }
  };

  const getFileIcon = () => {
    if (!file) return Upload;
    
    if (file.type.startsWith('image/')) {
      return Image;
    } else if (file.type.startsWith('video/')) {
      return Video;
    }
    return Upload;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const FileIcon = getFileIcon();

  return (
    <div className="flex h-screen bg-gray-50">
      <Navigation navigate={navigate} currentPage="upload" user={user} logout={logout} />
      
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <motion.div 
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                Upload Media for Analysis
              </h1>
              <p className="text-muted-foreground text-lg">
                Upload your image or video file to detect potential deepfake manipulation using advanced AI
              </p>
            </motion.div>

            {/* Upload Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-teal-50/50"></div>
                <CardHeader className="relative z-10">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-teal-600 rounded-lg flex items-center justify-center">
                      <Brain className="h-4 w-4 text-white" />
                    </div>
                    AI-Powered Detection Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  {/* Mode Toggle */}
                  <div className="mb-6 flex gap-2 border-b border-gray-200 pb-4">
                    <Button
                      variant={inputMode === 'file' ? 'default' : 'ghost'}
                      onClick={() => {
                        setInputMode('file');
                        setImageUrl('');
                        setUrlPreview(null);
                        setError(null);
                      }}
                      className="flex-1"
                      disabled={uploading || analyzing}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload File
                    </Button>
                    <Button
                      variant={inputMode === 'url' ? 'default' : 'ghost'}
                      onClick={() => {
                        setInputMode('url');
                        setFile(null);
                        setError(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="flex-1"
                      disabled={uploading || analyzing}
                    >
                      <Link className="h-4 w-4 mr-2" />
                      Enter URL
                    </Button>
                  </div>

                  <AnimatePresence mode="wait">
                    {inputMode === 'url' ? (
                      <motion.div
                        key="url-input"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4"
                      >
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Image URL
                          </label>
                          <Input
                            type="url"
                            placeholder="https://example.com/image.jpg"
                            value={imageUrl}
                            onChange={handleUrlChange}
                            disabled={uploading || analyzing}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Enter an image URL (http/https) or base64 data URL (data:image/...)
                          </p>
                        </div>

                        {validatingUrl && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Validating URL...
                          </div>
                        )}

                        {urlPreview && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="rounded-lg overflow-hidden border border-gray-200"
                          >
                            <img
                              src={urlPreview}
                              alt="Preview"
                              className="w-full h-auto max-h-96 object-contain"
                              onError={() => {
                                setError('Failed to load image preview');
                                setUrlPreview(null);
                              }}
                            />
                          </motion.div>
                        )}

                        <Button
                          onClick={startDetection}
                          disabled={!urlPreview || uploading || analyzing || !imageUrl.trim()}
                          className="w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700"
                          size="lg"
                        >
                          {analyzing ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Analyzing...
                            </>
                          ) : (
                            <>
                              <Zap className="h-4 w-4 mr-2" />
                              Analyze Image
                            </>
                          )}
                        </Button>
                      </motion.div>
                    ) : !file ? (
                      <motion.div
                        key="upload-zone"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                      >
                        <motion.div
                          className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 relative overflow-hidden ${
                            dragOver 
                              ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-teal-50 shadow-lg scale-105' 
                              : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/30'
                          }`}
                          onDrop={handleDrop}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          whileHover={{ scale: 1.02 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          {dragOver && (
                            <motion.div
                              className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-teal-400/20 rounded-xl"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                            />
                          )}
                          
                          <motion.div 
                            className="w-20 h-20 bg-gradient-to-r from-blue-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-6 relative"
                            animate={{ 
                              scale: dragOver ? [1, 1.1, 1] : 1,
                              rotate: dragOver ? [0, 5, -5, 0] : 0
                            }}
                            transition={{ duration: 0.5 }}
                          >
                            <Upload className="h-10 w-10 text-white" />
                            <motion.div
                              className="absolute inset-0 bg-white/20 rounded-2xl"
                              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                          </motion.div>
                          
                          <h3 className="text-xl font-bold mb-2 text-gray-800">
                            {dragOver ? 'Drop your file here!' : 'Drag and drop your media file'}
                          </h3>
                          <p className="text-gray-600 mb-8 text-lg">
                            or click to browse from your device
                          </p>
                          
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Button 
                              onClick={() => fileInputRef.current?.click()}
                              className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-lg px-8 py-3 h-auto shadow-lg hover:shadow-xl transition-all duration-300"
                              size="lg"
                            >
                              <Zap className="mr-2 h-5 w-5" />
                              Choose File
                            </Button>
                          </motion.div>
                          
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,video/*"
                            onChange={handleFileInputChange}
                            className="hidden"
                          />
                          
                          <p className="text-sm text-gray-500 mt-6 leading-relaxed">
                            Supported formats: <span className="font-medium">JPEG, PNG, WebP, MP4, MOV, AVI</span><br />
                            Maximum file size: <span className="font-medium">50MB</span>
                          </p>
                        </motion.div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="file-preview"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.4 }}
                        className="space-y-6"
                      >
                        {/* File Preview */}
                        <motion.div 
                          className="flex items-center gap-4 p-6 bg-gradient-to-r from-blue-50 to-teal-50 rounded-xl border border-blue-200"
                          whileHover={{ scale: 1.02 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <motion.div 
                            className="w-16 h-16 bg-gradient-to-r from-blue-500 to-teal-500 rounded-xl flex items-center justify-center"
                            animate={{ rotate: [0, 360] }}
                            transition={{ duration: 2, ease: "easeInOut" }}
                          >
                            <FileIcon className="h-8 w-8 text-white" />
                          </motion.div>
                          <div className="flex-1">
                            <p className="font-semibold text-lg text-gray-800">{file.name}</p>
                            <p className="text-blue-600 font-medium">{formatFileSize(file.size)}</p>
                          </div>
                          <motion.div
                            whileHover={{ scale: 1.1, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={removeFile}
                              disabled={uploading || analyzing}
                              className="hover:bg-red-100 hover:text-red-600"
                            >
                              <X className="h-5 w-5" />
                            </Button>
                          </motion.div>
                        </motion.div>

                        {/* Upload Progress */}
                        <AnimatePresence>
                          {(uploading || analyzing) && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="space-y-4"
                            >
                              <div className="flex items-center justify-between">
                                <motion.span 
                                  className="font-medium text-lg"
                                  animate={{ color: uploading ? "#2563eb" : "#059669" }}
                                >
                                  {uploading ? 'Uploading...' : 'AI Analysis in Progress...'}
                                </motion.span>
                                <span className="text-muted-foreground font-medium">
                                  {uploading ? `${progress}%` : 'Processing'}
                                </span>
                              </div>
                              <Progress value={uploading ? progress : undefined} className="h-3" />
                              {analyzing && (
                                <motion.div 
                                  className="flex items-center gap-3 text-blue-600 bg-blue-50 p-4 rounded-lg"
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                >
                                  <motion.div 
                                    className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                  />
                                  <span className="font-medium">
                                    Our advanced AI is scanning for deepfake patterns and anomalies...
                                  </span>
                                </motion.div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Action Button */}
                        {!uploading && !analyzing && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="pt-4"
                          >
                            <motion.div
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Button 
                                onClick={startDetection}
                                disabled={!file || uploading}
                                className="w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-lg py-4 h-auto shadow-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                size="lg"
                              >
                                <Brain className="h-5 w-5 mr-2" />
                                Start AI Detection
                              </Button>
                            </motion.div>
                          </motion.div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Error Message */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Alert className="border-red-200 bg-red-50">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <AlertDescription className="text-red-700 font-medium">
                            {error}
                          </AlertDescription>
                        </Alert>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>

            {/* Security Notice */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card className="mt-8 border-0 bg-gradient-to-r from-blue-50 to-teal-50 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <motion.div 
                      className="w-8 h-8 bg-gradient-to-r from-blue-600 to-teal-600 rounded-full flex items-center justify-center mt-1"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <CheckCircle className="h-4 w-4 text-white" />
                    </motion.div>
                    <div>
                      <p className="font-semibold text-blue-900 mb-2 text-lg">Your privacy is our priority</p>
                      <p className="text-blue-700 leading-relaxed">
                        All files are processed with military-grade encryption and automatically deleted after analysis. 
                        We never store your media, share it with third parties, or use it for training purposes.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}