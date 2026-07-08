import React from 'react';
import { FitGapItem } from '../types/jopfit';

interface FitGapTableProps {
  strongFits: FitGapItem[];
  partialFits: FitGapItem[];
  gaps: FitGapItem[];
}

export const FitGapTable: React.FC<FitGapTableProps> = ({
  strongFits = [],
  partialFits = [],
  gaps = [],
}) => {
  const allItems = [...strongFits, ...partialFits, ...gaps];

  if (allItems.length === 0) {
    return <p style={{ color: 'var(--text-light)', fontSize: '0.875rem' }}>분석 데이터가 존재하지 않습니다.</p>;
  }

  const getStatusBadge = (status: string) => {
    if (status === 'Strong Fit') {
      return <span className="badge badge-strong">Strong Fit</span>;
    } else if (status === 'Partial Fit') {
      return <span className="badge badge-partial">Partial Fit</span>;
    } else {
      return <span className="badge badge-gap">Gap</span>;
    }
  };

  return (
    <div className="fitgap-table-container">
      <table className="fitgap-table">
        <thead>
          <tr>
            <th style={{ width: '25%' }}>요구사항</th>
            <th style={{ width: '35%' }}>보유 경험</th>
            <th style={{ width: '15%' }}>적합도</th>
            <th style={{ width: '25%' }}>보완 계획</th>
          </tr>
        </thead>
        <tbody>
          {allItems.map((item, idx) => (
            <tr key={idx}>
              <td style={{ fontWeight: 600, color: 'var(--text)' }}>{item.requirement}</td>
              <td>{item.user_experience || '경험 정보가 존재하지 않습니다.'}</td>
              <td>{getStatusBadge(item.status)}</td>
              <td>{item.action_item}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
