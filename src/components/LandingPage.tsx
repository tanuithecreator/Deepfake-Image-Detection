import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Shield, Upload, Lock, Github, Twitter, Linkedin, Zap, Brain } from 'lucide-react';
import { motion } from 'motion/react';

interface LandingPageProps {
  navigate: (page: string) => void;
  isAuthenticated: boolean;
  errorMessage?: string | null;
}

export function LandingPage({ navigate, isAuthenticated, errorMessage }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-semibold text-blue-600">
                DeepDetect
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <Button onClick={() => navigate('dashboard')}>Dashboard</Button>
              ) : (
                <>
                  {errorMessage ? (
                    <span className="text-sm text-red-600 mr-4">{errorMessage}</span>
                  ) : null}
                  <Button 
                    variant="ghost" 
                    onClick={() => navigate('auth')}
                  >
                    Login
                  </Button>
                  <Button 
                    onClick={() => navigate('auth')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Sign Up
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-teal-50">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-blue-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Detect Deepfakes
              </span>
              <br />
              <span className="text-gray-800">using AI </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed">
              Advanced artificial intelligence to identify manipulated media and protect against deepfake content. 
              <br className="hidden md:block" />
              Upload your content for instant, accurate analysis.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button 
                size="lg" 
                className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-4"
                onClick={() => isAuthenticated ? navigate('upload') : navigate('auth')}
              >
                <Zap className="mr-2 h-5 w-5" />
                Try Now - Free
              </Button>
            </div>

            {/* Quote */}
            <Card className="border-0 bg-white/80 shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z" clipRule="evenodd" />
                  </svg>
                </div>
                <blockquote className="text-lg md:text-xl text-gray-700 italic mb-6 leading-relaxed">
                  "In a world where seeing is no longer believing, verification becomes our most valuable tool. 
                  The rise of deepfake technology has made it clear that we need robust detection systems to protect truth in the digital age."
                </blockquote>
                <div className="text-sm text-gray-500">
                  — AI Ethics & Digital Media Research
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-800">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience cutting-edge AI technology that protects you from deepfake deception in four simple steps
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Upload,
                title: "Upload",
                description: "Drag and drop or select your image or video file"
              },
              {
                icon: Brain,
                title: "AI Analysis",
                description: "Advanced neural networks scan for manipulation patterns"
              },
              {
                icon: Shield,
                title: "Results",
                description: "Get detailed authenticity scores with visual indicators"
              },
              {
                icon: Lock,
                title: "Security",
                description: "Military-grade encryption protects your data throughout"
              }
            ].map((feature, index) => (
              <Card key={index} className="text-center shadow-lg">
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <feature.icon className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-800">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand Section */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="h-10 w-10 text-blue-400" />
                <h3 className="text-2xl font-bold text-white">
                  DeepDetect
                </h3>
              </div>
              <p className="text-gray-300 leading-relaxed mb-6 max-w-md">
                Protecting digital truth with advanced AI technology. Our deepfake detection system helps secure media integrity in an age of synthetic content.
              </p>
              
              {/* Contact Info */}
              <div className="space-y-2 mb-6">
                <div className="text-gray-400 text-sm">
                  📧 juliankipkoskei@gmail.com
                </div>
                <div className="text-gray-400 text-sm">
                  🌐 Available worldwide
                </div>
                <div className="text-gray-400 text-sm">
                  ⚡ 24/7 AI Detection Service
                </div>
              </div>
              
              {/* Social Links */}
              <div className="flex items-center gap-4">
                <a 
                  href="https://twitter.com/deepdetect" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors p-2 bg-gray-800 rounded-lg hover:bg-gray-700"
                >
                  <Twitter className="h-5 w-5" />
                </a>
                <a 
                  href="https://github.com/deepdetect" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors p-2 bg-gray-800 rounded-lg hover:bg-gray-700"
                >
                  <Github className="h-5 w-5" />
                </a>
                <a 
                  href="https://linkedin.com/company/deepdetect" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors p-2 bg-gray-800 rounded-lg hover:bg-gray-700"
                >
                  <Linkedin className="h-5 w-5" />
                </a>
              </div>
            </div>

            {/* Product Links */}
            <div>
              <h4 className="font-semibold mb-4 text-white">Product</h4>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    Security
                  </a>
                </li>
              </ul>
            </div>

            {/* Support & Legal */}
            <div>
              <h4 className="font-semibold mb-4 text-white">Support & Legal</h4>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="mailto:contact@deepdetect.com" className="text-gray-400 hover:text-white transition-colors">
                    Contact Us
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white transition-colors">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2025 DeepDetect. All rights reserved.
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('admin-auth')}
                className="text-gray-400 hover:text-white transition-colors text-sm bg-gray-800 px-4 py-2 rounded-md hover:bg-gray-700 border border-gray-600"
              >
                🔐 Admin Portal
              </button>
              <div className="text-gray-400 text-sm flex items-center gap-1">
                🔒 <span className="hidden sm:inline">End-to-end encryption</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}