'use client';

import { useState, useEffect } from 'react';
import Snowfall from 'react-snowfall';

export default function ChristmasSuccessModal({ 
  isOpen, 
  earnedIncentive, 
  onClose 
}) {
  const [showSnow, setShowSnow] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowSnow(true);
      // Stop snowfall after 4 seconds
      const timer = setTimeout(() => {
        setShowSnow(false);
      }, 4000);
      return () => clearTimeout(timer);
    } else {
      setShowSnow(false);
    }
  }, [isOpen]);

  const handleButtonClick = () => {
    setShowSnow(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      {/* Snowfall Animation */}
      {showSnow && (
        <Snowfall
          snowflakeCount={150}
          radius={[0.5, 2.5]}
          speed={[0.5, 2]}
          wind={[-0.5, 1]}
          color="white"
          style={{
            position: 'fixed',
            width: '100vw',
            height: '100vh',
            zIndex: 51,
          }}
        />
      )}

      {/* Modal Card */}
      <div 
        className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-sm w-full relative overflow-hidden"
        style={{
          animation: 'christmasModalIn 0.4s ease-out',
          boxShadow: '0 0 40px rgba(220, 38, 38, 0.2), 0 0 80px rgba(34, 197, 94, 0.1)',
        }}
      >
        {/* Decorative top border */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-500 via-green-500 to-red-500" />
        
        {/* Santa Illustration */}
        <div className="mb-4 relative">
          <div 
            className="text-7xl"
            style={{ animation: 'santaBounce 1s ease-in-out infinite' }}
          >
            🎅
          </div>
          {/* Decorative snowflakes around Santa */}
          <span className="absolute top-0 left-8 text-2xl opacity-70" style={{ animation: 'twinkle 1.5s ease-in-out infinite' }}>❄️</span>
          <span className="absolute top-2 right-8 text-xl opacity-60" style={{ animation: 'twinkle 2s ease-in-out infinite 0.5s' }}>❄️</span>
        </div>

        {/* Christmas Tree Emoji */}
        <div className="flex justify-center gap-2 mb-3">
          <span className="text-2xl">🎄</span>
          <span className="text-2xl">🎁</span>
          <span className="text-2xl">🎄</span>
        </div>

        {/* Heading with gradient */}
        <h2 
          className="text-2xl font-bold mb-3"
          style={{
            background: 'linear-gradient(135deg, #dc2626 0%, #16a34a 50%, #dc2626 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          🎄 Congratulations! 🎄
        </h2>

        {/* Subtext */}
        <p className="text-gray-600 text-base mb-2">
          Ho Ho Ho! You've earned
        </p>
        
        {/* Amount */}
        <p 
          className="text-4xl font-bold mb-2"
          style={{
            background: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          ₹{earnedIncentive}
        </p>
        
        <p className="text-gray-600 text-sm mb-6">
          incentive! 🎅✨
        </p>

        {/* Festive decorations */}
        <div className="flex justify-center gap-3 mb-6 text-xl">
          <span style={{ animation: 'twinkle 1.2s ease-in-out infinite' }}>🎁</span>
          <span style={{ animation: 'twinkle 1.5s ease-in-out infinite 0.3s' }}>❄️</span>
          <span style={{ animation: 'twinkle 1.8s ease-in-out infinite 0.6s' }}>🎄</span>
          <span style={{ animation: 'twinkle 1.5s ease-in-out infinite 0.9s' }}>❄️</span>
          <span style={{ animation: 'twinkle 1.2s ease-in-out infinite 1.2s' }}>🎁</span>
        </div>

        {/* Button */}
        <button
          onClick={handleButtonClick}
          className="w-full py-3.5 rounded-full font-semibold text-white transition-all hover:scale-105 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
            boxShadow: '0 4px 15px rgba(220, 38, 38, 0.4)',
          }}
        >
          View My Report 🎄
        </button>

        {/* Bottom decorative border */}
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-green-500 via-red-500 to-green-500" />
      </div>

      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes christmasModalIn {
          0% {
            opacity: 0;
            transform: scale(0.8);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes santaBounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes twinkle {
          0%, 100% {
            opacity: 0.4;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
      `}</style>
    </div>
  );
}
