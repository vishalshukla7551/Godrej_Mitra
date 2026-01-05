'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Award, Download, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import SECHeader from '@/app/SEC/SECHeader';
import SECFooter from '@/app/SEC/SECFooter';

interface Certificate {
  id: string;
  certificateNo: string;
  testName: string;
  score: number;
  issuedAt: string;
  passed: boolean;
}

// Mock certificates for now - will be replaced with real data later
const MOCK_CERTIFICATES: Certificate[] = [
  { id: '1', certificateNo: 'CERT-1702656000000-ABC123', testName: 'Samsung Protect Max Certification', score: 80, issuedAt: '2024-12-15', passed: true },
  { id: '2', certificateNo: 'CERT-1702569600000-DEF456', testName: 'Coverage & Benefits Quiz', score: 90, issuedAt: '2024-12-14', passed: true },
];

// Animated Score Counter Component
const AnimatedScore = ({ finalScore, delay = 0 }: { finalScore: number; delay?: number }) => {
  const [displayScore, setDisplayScore] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(true);
      let start = 0;
      const increment = finalScore / 50; // Animation duration control
      const interval = setInterval(() => {
        start += increment;
        if (start >= finalScore) {
          setDisplayScore(finalScore);
          clearInterval(interval);
          setIsAnimating(false);
        } else {
          setDisplayScore(Math.floor(start));
        }
      }, 20);
    }, delay);

    return () => clearTimeout(timer);
  }, [finalScore, delay]);

  return (
    <motion.div
      className="text-2xl font-bold text-green-600"
      animate={isAnimating ? {} : { scale: [1, 1.1, 1] }}
      transition={{ duration: 0.3, delay: delay / 1000 + 1 }}
    >
      {displayScore}%
    </motion.div>
  );
};

export default function CertificatesPage() {
  const router = useRouter();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [secUserName, setSecUserName] = useState<string>('SEC User');
  const [loading, setLoading] = useState(true);
  const confettiTriggered = useRef(false);

  // Get SEC user name from localStorage
  const getSecUserName = () => {
    try {
      const authUser = localStorage.getItem('authUser');
      if (authUser) {
        const userData = JSON.parse(authUser);
        // Priority: fullName > name > phone > default
        return userData.fullName || userData.name || userData.phone || 'SEC User';
      }
    } catch (error) {
      console.error('Error reading authUser from localStorage:', error);
    }
    return 'SEC User';
  };

  // Handle viewing certificate
  const handleViewCertificate = (cert: Certificate) => {
    // Create a new window/tab to show the certificate
    const certificateWindow = window.open('', '_blank', 'width=800,height=600');
    if (certificateWindow) {
      certificateWindow.document.write(generateCertificateHTML(cert));
      certificateWindow.document.close();
    }
  };

  // Handle downloading certificate
  const handleDownloadCertificate = (cert: Certificate) => {
    // For now, open the certificate view
    // In the future, this could generate a PDF
    handleViewCertificate(cert);
  };

  // Generate certificate HTML
  const generateCertificateHTML = (cert: Certificate) => {
    const secName = secUserName;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Certificate - ${cert.testName}</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .certificate {
            background: white;
            border: 8px solid #FFD700;
            border-radius: 20px;
            padding: 60px;
            max-width: 800px;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            position: relative;
          }
          .certificate::before {
            content: '';
            position: absolute;
            top: 20px;
            left: 20px;
            right: 20px;
            bottom: 20px;
            border: 2px solid #FFD700;
            border-radius: 12px;
          }
          .header {
            margin-bottom: 40px;
          }
          .title {
            font-size: 48px;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
          }
          .subtitle {
            font-size: 18px;
            color: #666;
            margin-bottom: 40px;
          }
          .recipient {
            font-size: 36px;
            color: #2563eb;
            font-weight: bold;
            margin: 30px 0;
          }
          .achievement {
            font-size: 18px;
            color: #333;
            margin: 30px 0;
          }
          .score {
            font-size: 72px;
            color: #2563eb;
            font-weight: bold;
            margin: 30px 0;
          }
          .details {
            font-size: 16px;
            color: #666;
            margin: 20px 0;
          }
          .footer {
            margin-top: 50px;
            font-style: italic;
            color: #666;
          }
          .logo {
            position: absolute;
            top: 30px;
            right: 40px;
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
          }
          @media print {
            body { background: white; padding: 0; }
            .certificate { border: 8px solid #FFD700; box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="certificate">
          <div class="logo">Zopper</div>
          <div class="header">
            <div class="title">Certificate of Achievement</div>
            <div class="subtitle">Presented by Zopper</div>
          </div>
          
          <div>This is proudly awarded to</div>
          <div class="recipient">${secName}</div>
          
          <div class="achievement">
            for successfully completing the <strong>${cert.testName}</strong>
          </div>
          
          <div class="score">${cert.score}%</div>
          <div class="details">Score achieved on ${new Date(cert.issuedAt).toLocaleDateString()}</div>
          
          <div class="details">
            <strong>Test:</strong> ${cert.testName}<br>
            <strong>Certificate No:</strong> ${cert.certificateNo}<br>
            <strong>Issued on:</strong> ${new Date(cert.issuedAt).toLocaleDateString()}
          </div>
          
          <div class="footer">
            "Best wishes for your bright future ahead with Zopper ⭐"
          </div>
        </div>
      </body>
      </html>
    `;
  };

  // Confetti celebration effect
  const triggerConfetti = () => {
    if (confettiTriggered.current) return;
    confettiTriggered.current = true;

    const duration = 2500;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#FFA500', '#FF6347', '#32CD32', '#1E90FF']
      });

      confetti({
        particleCount: 3,
        spread: 50,
        origin: { x: 0.1, y: 0.6 },
        colors: ['#FFD700', '#FFA500']
      });

      confetti({
        particleCount: 3,
        spread: 50,
        origin: { x: 0.9, y: 0.6 },
        colors: ['#FFD700', '#FFA500']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  };

  useEffect(() => {
    // Get SEC user name from localStorage
    const userName = getSecUserName();
    setSecUserName(userName);

    // Set mock certificates for now
    setCertificates(MOCK_CERTIFICATES);
    setLoading(false);

    // Trigger confetti after certificates load
    setTimeout(() => {
      if (MOCK_CERTIFICATES.length > 0) {
        triggerConfetti();
      }
    }, 800);
  }, []);

  return (
    <div className="h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col overflow-hidden">
      <SECHeader />
      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-32">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            onClick={() => router.push('/SEC/training')}
            className="flex items-center gap-2 text-blue-600 mb-4 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" /> Back to Training
          </motion.button>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex items-center gap-3 mb-6"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <Award className="w-8 h-8 text-yellow-500" />
            </motion.div>
            <h1 className="text-2xl font-bold text-gray-900">My Certificates</h1>
          </motion.div>

          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-center py-12"
            >
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </motion.div>
          ) : certificates.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-2xl shadow-lg p-8 text-center"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              </motion.div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">No Certificates Yet</h2>
              <p className="text-gray-600 mb-4">Complete tests to earn certificates</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/SEC/training')}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                Go to Training
              </motion.button>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {certificates.map((cert, index) => (
                  <motion.div
                    key={cert.id}
                    initial={{ opacity: 0, scale: 0.95, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{
                      duration: 0.5,
                      ease: "easeOut",
                      delay: index * 0.1
                    }}
                    className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-yellow-400 hover:shadow-xl transition-shadow duration-300"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <motion.h3
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 + 0.2 }}
                          className="font-bold text-gray-900 text-lg"
                        >
                          {cert.testName}
                        </motion.h3>
                        <motion.p
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 + 0.3 }}
                          className="text-sm text-gray-500 mt-1"
                        >
                          Certificate No: {cert.certificateNo}
                        </motion.p>
                        <motion.p
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 + 0.4 }}
                          className="text-sm text-gray-500"
                        >
                          Issued: {new Date(cert.issuedAt).toLocaleDateString()}
                        </motion.p>
                      </div>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 + 0.5 }}
                        className="text-right"
                      >
                        <AnimatedScore finalScore={cert.score} delay={index * 100 + 600} />
                        <motion.span
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 + 0.8 }}
                          className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full"
                        >
                          Passed
                        </motion.span>
                      </motion.div>
                    </div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 + 0.9 }}
                      className="flex gap-2 mt-4"
                    >
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleViewCertificate(cert)}
                        className="flex-1 py-2 bg-green-600 text-white rounded-lg flex items-center justify-center gap-2 text-sm hover:bg-green-700 transition-colors"
                      >
                        <Award className="w-4 h-4" /> View Certificate
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleDownloadCertificate(cert)}
                        className="flex-1 py-2 bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2 text-sm hover:bg-blue-700 transition-colors"
                      >
                        <Download className="w-4 h-4" /> Download
                      </motion.button>
                    </motion.div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>
      <SECFooter />
    </div>
  );
}
