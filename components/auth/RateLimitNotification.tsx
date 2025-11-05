import React, { useState, useEffect } from 'react';
import { AlertCircle, Clock } from 'lucide-react';

const RateLimitNotification = () => {
  const [isBlocked, setIsBlocked] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    const handleRateLimit = (error: any) => {
      if (error?.response?.status === 429 || error?.isRateLimitBlock) {
        setIsBlocked(true);
        setTimeRemaining(120); 
      }
    };

    window.addEventListener('rateLimitError', handleRateLimit);

    return () => {
      window.removeEventListener('rateLimitError', handleRateLimit);
    };
  }, []);

  useEffect(() => {
    if (!isBlocked || timeRemaining <= 0) {
      setIsBlocked(false);
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsBlocked(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isBlocked, timeRemaining]);

  if (!isBlocked) return null;

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
      <div className="bg-red-50 border-l-4 border-red-500 rounded-lg shadow-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <AlertCircle className="h-6 w-6 text-red-500" />
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-semibold text-red-800">
              Rate Limit Exceeded
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>Too many requests detected. All API calls are temporarily blocked.</p>
              <div className="mt-3 flex items-center gap-2 text-red-900 font-medium">
                <Clock className="h-4 w-4" />
                <span>
                  Time remaining: {minutes}:{seconds.toString().padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RateLimitNotification;