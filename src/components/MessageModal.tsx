import React from 'react';
import { Check, TriangleAlert, X } from 'lucide-react';

interface MessageModalProps {
  isOpen: boolean;
  title: string;
  body: string;
  type: 'success' | 'warning' | 'error';
  onClose: () => void;
}

export function MessageModal({ isOpen, title, body, type, onClose }: MessageModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-stone-900 w-full max-w-sm rounded-3xl border border-amber-500/40 p-6 text-center space-y-4 shadow-2xl">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto text-2xl ${
            type === 'success'
              ? 'bg-emerald-500/20 text-emerald-400'
              : type === 'warning'
              ? 'bg-amber-500/20 text-amber-400'
              : 'bg-red-500/20 text-red-400'
          }`}
        >
          {type === 'success' && <Check size={32} />}
          {type === 'warning' && <TriangleAlert size={32} />}
          {type === 'error' && <X size={32} />}
        </div>
        <h4 className="text-lg font-bold text-white">{title}</h4>
        <p className="text-sm text-stone-300 whitespace-pre-wrap">{body}</p>
        <button
          onClick={onClose}
          className="w-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold py-2.5 rounded-xl transition-all"
        >
          確定
        </button>
      </div>
    </div>
  );
}
