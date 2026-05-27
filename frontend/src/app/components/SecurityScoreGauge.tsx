'use client';

import React from 'react';

interface SecurityScoreGaugeProps {
  score: number;
}

export default function SecurityScoreGauge({ score }: SecurityScoreGaugeProps) {
  // Normalize score between 0 and 100
  const normalizedScore = Math.max(0, Math.min(100, score));
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  let scoreColorClass = 'stroke-red-500';
  if (normalizedScore >= 80) {
    scoreColorClass = 'stroke-emerald-500';
  } else if (normalizedScore >= 50) {
    scoreColorClass = 'stroke-yellow-500';
  }

  return (
    <div className="bg-slate-900/30 border border-slate-850 p-6 rounded-3xl backdrop-blur-sm flex items-center space-x-6 w-full">
      {/* Circular Gauge */}
      <div className="relative flex items-center justify-center shrink-0" data-testid="gauge-container">
        <svg height="100" width="100" className="transform -rotate-90">
          <circle
            stroke="rgb(30, 41, 59)"
            fill="transparent"
            strokeWidth="8"
            r={radius}
            cx="50"
            cy="50"
          />
          <circle
            className={`transition-all duration-1000 ease-out ${scoreColorClass}`}
            fill="transparent"
            strokeWidth="8"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={strokeDashoffset}
            r={radius}
            cx="50"
            cy="50"
            data-testid="gauge-progress-circle"
          />
        </svg>
        <span className="absolute text-xl font-extrabold text-white" data-testid="gauge-score-value">
          {normalizedScore}
        </span>
      </div>

      <div>
        <h4 className="text-sm font-bold text-white">Scan Safety Score</h4>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          Code scored <span className="font-bold text-white">{normalizedScore}/100</span> based on vulnerability severity deductions.
        </p>
      </div>
    </div>
  );
}
