'use client';

import React from 'react';
import Link from 'next/link';

interface LoginModalProps {
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ onClose }) => {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-sm w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-gray-800 mb-3">로그인이 필요합니다</h2>
        <p className="text-gray-600 mb-5">이 기능을 사용하려면 로그인이 필요합니다.</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
          >
            취소
          </button>
          <Link
            href="/auth"
            className="flex-1 py-2 bg-indigo-600 text-white rounded-lg font-medium text-center hover:bg-indigo-700"
          >
            로그인
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
