import React from 'react';
import { JopFitResult } from '../types/jopfit';

interface JsonDownloadButtonProps {
  result: JopFitResult;
}

export const JsonDownloadButton: React.FC<JsonDownloadButtonProps> = ({ result }) => {
  const handleDownload = () => {
    try {
      const dataStr = JSON.stringify(result, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const downloadUrl = URL.createObjectURL(dataBlob);
      const tempLink = document.createElement('a');
      tempLink.href = downloadUrl;
      tempLink.download = 'jobfit_roadmap_result.json';
      document.body.appendChild(tempLink);
      tempLink.click();
      document.body.removeChild(tempLink);
      URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Download error:', err);
      alert('다운로드 중 오류가 발생하였습니다.');
    }
  };

  return (
    <button onClick={handleDownload} className="download-btn no-print">
      JSON으로 저장
    </button>
  );
};
