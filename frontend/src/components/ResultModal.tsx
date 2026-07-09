import React, { useEffect } from 'react';
import { JopFitResult } from '../types/jopfit';
import { ResultDashboard } from './ResultDashboard';

interface ResultModalProps {
  result: JopFitResult | null;
  open: boolean;
  onClose: () => void;
}

export const ResultModal: React.FC<ResultModalProps> = ({ result, open, onClose }) => {
  // Body scroll lock effect
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (open) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open || !result) {
    return null;
  }

  return (
    <div className="modal-overlay result-modal-overlay" onClick={onClose}>
      <div className="modal-panel result-modal-panel print-report-area" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header no-print">
          <div className="modal-title-section">
            <span className="modal-title">분석 결과</span>
            <span className="modal-subtitle">
              공고와 현재 경험을 기준으로 정리한 강점, 보완점, 준비 계획입니다.
            </span>
          </div>
          <button className="modal-close-btn no-print" onClick={onClose}>
            닫기
          </button>
        </header>
        
        <div className="modal-body no-print">
          <ResultDashboard result={result} isLoading={false} error={null} />
        </div>
      </div>
    </div>
  );
};
