'use client';

import React from 'react';
import type { Place } from '@/types';

interface SpotDetailViewProps {
  spot: Place;
  onBack: () => void;
  onEdit: () => void;
  onAddSuggestion: () => void;
  onResolveSuggestion: () => void;
}

const SpotDetailView: React.FC<SpotDetailViewProps> = ({ spot, onBack }) => {
  return (
    <div className="p-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-indigo-600 mb-4 hover:text-indigo-700"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        뒤로
      </button>
      <h2 className="text-xl font-bold text-gray-800 mb-2">{spot.place_name}</h2>
      {spot.region && <p className="text-sm text-gray-500">📍 {spot.region}</p>}
    </div>
  );
};

export default SpotDetailView;
