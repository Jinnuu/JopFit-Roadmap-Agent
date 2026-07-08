import React from 'react';
import { ReferencedRagDocument } from '../types/jopfit';

interface RagReferencesProps {
  documents: ReferencedRagDocument[];
}

export const RagReferences: React.FC<RagReferencesProps> = ({ documents = [] }) => {
  if (documents.length === 0) {
    return null;
  }

  return (
    <div className="dashboard-card">
      <div className="card-title">참고한 기준</div>
      <div className="rag-cards-grid">
        {documents.map((doc, idx) => (
          <div className="rag-card" key={idx}>
            <div className="rag-card-header">
              <span className="rag-card-title">{doc.title}</span>
              <span className="rag-card-score">매칭도: {Math.round(doc.score * 100)}%</span>
            </div>
            <div className="rag-card-path">문서: {doc.path}</div>
            <div className="rag-card-snippet">{doc.snippet}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
