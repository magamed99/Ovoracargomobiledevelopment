import React from 'react';
import { Sun, CloudRain, Cloud, CloudSnow, Wind, CloudDrizzle } from 'lucide-react';

interface WeatherAnimationProps {
  condition: 'clear' | 'rain' | 'cloudy' | 'snow' | 'drizzle' | 'fog' | 'unknown';
  size?: number;
  isDark?: boolean;
}

export function WeatherAnimation({ condition, size = 20, isDark }: WeatherAnimationProps) {
  // Анимация солнца (вращение)
  if (condition === 'clear') {
    return (
      <div className="relative" style={{ width: size, height: size }}>
        <Sun 
          size={size} 
          className="text-amber-400 animate-spin-slow" 
          style={{ animationDuration: '8s' }} 
        />
        <style>{`
          @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .animate-spin-slow {
            animation: spin-slow 8s linear infinite;
          }
        `}</style>
      </div>
    );
  }

  // Анимация дождя (падающие капли)
  if (condition === 'rain') {
    return (
      <div className="relative" style={{ width: size, height: size }}>
        <CloudRain 
          size={size} 
          className="text-blue-400 animate-bounce-rain" 
        />
        <style>{`
          @keyframes bounce-rain {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(${size * 0.15}px); }
          }
          .animate-bounce-rain {
            animation: bounce-rain 1s ease-in-out infinite;
          }
        `}</style>
      </div>
    );
  }

  // Анимация моросящего дождя (пульсация)
  if (condition === 'drizzle') {
    return (
      <div className="relative" style={{ width: size, height: size }}>
        <CloudDrizzle 
          size={size} 
          className="text-blue-300 animate-pulse-custom" 
        />
        <style>{`
          @keyframes pulse-custom {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
          }
          .animate-pulse-custom {
            animation: pulse-custom 2s ease-in-out infinite;
          }
        `}</style>
      </div>
    );
  }

  // Анимация снега (плавающие снежинки)
  if (condition === 'snow') {
    return (
      <div className="relative" style={{ width: size, height: size }}>
        <CloudSnow 
          size={size} 
          className="text-blue-200 animate-snow" 
        />
        <style>{`
          @keyframes snow {
            0%, 100% { 
              transform: translateY(0) rotate(0deg); 
            }
            50% { 
              transform: translateY(${size * 0.1}px) rotate(5deg); 
            }
          }
          .animate-snow {
            animation: snow 2s ease-in-out infinite;
          }
        `}</style>
      </div>
    );
  }

  // Анимация тумана (движение)
  if (condition === 'fog') {
    return (
      <div className="relative" style={{ width: size, height: size }}>
        <Wind 
          size={size} 
          className="text-gray-400 animate-fog" 
        />
        <style>{`
          @keyframes fog {
            0%, 100% { 
              opacity: 0.6; 
              transform: translateX(0); 
            }
            50% { 
              opacity: 1; 
              transform: translateX(${size * 0.1}px); 
            }
          }
          .animate-fog {
            animation: fog 3s ease-in-out infinite;
          }
        `}</style>
      </div>
    );
  }

  // Анимация облачности (плавание)
  if (condition === 'cloudy') {
    return (
      <div className="relative" style={{ width: size, height: size }}>
        <Cloud 
          size={size} 
          className={`${isDark ? 'text-gray-100 drop-shadow-lg' : 'text-gray-600 drop-shadow-md'} animate-float`}
          strokeWidth={2.5}
        />
        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-${size * 0.15}px); }
          }
          .animate-float {
            animation: float 3s ease-in-out infinite;
          }
        `}</style>
      </div>
    );
  }

  // По умолчанию - статичное облако
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <Cloud 
        size={size} 
        className={isDark ? 'text-gray-300' : 'text-gray-400'} 
      />
    </div>
  );
}
