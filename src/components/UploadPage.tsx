import { useState, useRef } from 'react';
import { Navigation } from './Navigation';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { Upload, FileText, Image, Video, CheckCircle, AlertCircle, Zap, Brain, X, Clock, Target, Cpu, Shield, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { DetectionResult, DetectionModel, User } from '../App';

interface UploadPageProps {
  navigate: (page: string) => void;
  user: User | null;
  logout: () => void;
  addDetectionResult: (result: DetectionResult) => void;
}

// Available detection models
const DETECTION_MODELS: DetectionModel[] = [
  {
    id: 'fast-cnn',
    name: 'FastDetect',
    version: 'v2.1',
    description: 'Speed',
    accuracy: 85,
    speed: 'fast',
    speciality: 'Quick screening and basic detection',
    processingTime: '5-15 seconds',
    recommendedFor: ['Quick checks', 'Batch processing', 'Real-time screening'],
  },
  {
    id: 'standard-ensemble',
    name: 'Standard',
    version: 'v3.0',
    description: 'Balanced',
    accuracy: 92,
    speed: 'medium',
    speciality: 'General-purpose detection with good balance',
    processingTime: '30-60 seconds',
    recommendedFor: ['General use', 'Social media content', 'News verification'],
  },
  {
    id: 'high-accuracy-transformer',
    name: 'DeepAnalysis',
    version: 'v4.2',
    description: 'Accuracy',
    accuracy: 96,
    speed: 'slow',
    speciality: 'Maximum precision for critical applications',
    processingTime: '2-5 minutes',
    recommendedFor: ['Legal evidence', 'Forensic analysis', 'High-stakes verification'],
    isPremium: true,
  },
  {
    id: 'video-specialist',
    name: 'VideoGuard',
    version: 'v2.8',
    description: 'Video',
    accuracy: 94,
    speed: 'slow',
    speciality: 'Video-specific features and temporal analysis',
    processingTime: '1-3 minutes',
    recommendedFor: ['Video content', 'Streaming media', 'Temporal inconsistencies'],
  },
];

export function UploadPage({ navigate, user, logout, addDetectionResult }: UploadPageProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<DetectionModel | null>(DETECTION_MODELS[0]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/mov', 'video/avi'];
  const maxFileSize = 50 * 1024 * 1024; // 50MB

  const validateFile = (file: File) => {
    if (!acceptedTypes.includes(file.type)) {
      return 'Please upload a valid image (JPEG, PNG, WebP) or video (MP4, MOV, AVI) file.';
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

  const handleModelSelect = (model: DetectionModel) => {
    setSelectedModel(model);
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

  const startDetection = async () => {
    if (!file || !selectedModel) return;

    setUploading(true);
    setProgress(0);

    // Simulate upload progress based on model speed
    const uploadSpeed = selectedModel.speed === 'fast' ? 100 : selectedModel.speed === 'medium' ? 150 : 250;

    const uploadInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(uploadInterval);
          setUploading(false);
          setAnalyzing(true);
          
          // Simulate analysis time based on model processing time
          const analysisTime = selectedModel.speed === 'fast' ? 2000 : selectedModel.speed === 'medium' ? 4000 : 6000;
          
          setTimeout(() => {
            // Generate more realistic results based on model accuracy
            const isDeepfake = Math.random() > 0.6;
            const baseConfidence = selectedModel.accuracy;
            const variance = selectedModel.speed === 'fast' ? 15 : selectedModel.speed === 'medium' ? 10 : 5;
            const confidence = Math.min(99, Math.max(70, baseConfidence + (Math.random() - 0.5) * variance));
            
            const mockResult: DetectionResult = {
              id: Date.now().toString(),
              fileName: file.name,
              date: new Date().toISOString().split('T')[0],
              result: isDeepfake ? 'deepfake' : 'authentic',
              confidence: Math.floor(confidence),
              fileUrl: URL.createObjectURL(file),
              modelUsed: selectedModel.name,
              processingTime: analysisTime / 1000
            };
            
            addDetectionResult(mockResult);
            setAnalyzing(false);
            navigate('results');
          }, analysisTime);
          
          return 100;
        }
        return prev + 10;
      });
    }, uploadSpeed);
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
                  <AnimatePresence mode="wait">
                    {!file ? (
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

                        {/* Model Selection */}
                        {!uploading && !analyzing && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="space-y-4"
                          >
                            <Separator className="my-6" />
                            
                            <div className="space-y-4">
                              <div className="flex items-center gap-2">
                                <Brain className="h-5 w-5 text-blue-600" />
                                <h3 className="text-lg font-semibold text-gray-800">
                                  Choose Detection Model
                                </h3>
                              </div>
                              
                              <Select value={selectedModel?.id} onValueChange={(value) => {
                                const model = DETECTION_MODELS.find(m => m.id === value);
                                if (model) setSelectedModel(model);
                              }}>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select a model">
                                    {selectedModel && (
                                      <div className="flex items-center gap-2">
                                        <span>{selectedModel.name}</span>
                                        <Badge variant="outline" className="text-xs">
                                          {selectedModel.description}
                                        </Badge>
                                        {selectedModel.isPremium && (
                                          <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900 text-xs">
                                            <Crown className="w-3 h-3 mr-1" />
                                            Pro
                                          </Badge>
                                        )}
                                      </div>
                                    )}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  {DETECTION_MODELS.map((model) => (
                                    <SelectItem key={model.id} value={model.id}>
                                      <div className="flex items-center gap-2">
                                        <span>{model.name}</span>
                                        <Badge variant="outline" className="text-xs">
                                          {model.description}
                                        </Badge>
                                        {model.isPremium && (
                                          <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900 text-xs">
                                            <Crown className="w-3 h-3 mr-1" />
                                            Pro
                                          </Badge>
                                        )}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            {/* Action Button */}
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.2 }}
                              className="pt-4"
                            >
                              <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <Button 
                                  onClick={startDetection}
                                  disabled={!selectedModel}
                                  className="w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-lg py-4 h-auto shadow-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                  size="lg"
                                >
                                  <Brain className="h-5 w-5 mr-2" />
                                  Start {selectedModel?.name || 'AI'} Detection
                                </Button>
                              </motion.div>
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