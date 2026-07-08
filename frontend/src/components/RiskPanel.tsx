import React from 'react';
import { RiskCheckResult } from '../types/jopfit';

interface RiskPanelProps {
  riskResult: RiskCheckResult;
}

export const RiskPanel: React.FC<RiskPanelProps> = ({ riskResult }) => {
  const getRiskClass = (level: string) => {
    if (level === '위험') {
      return 'danger';
    } else if (level === '주의') {
      return 'warn';
    } else {
      return 'safe';
    }
  };

  const getRiskItemClass = (severity: string) => {
    return `risk-item severity-${severity}`;
  };

  return (
    <div className="dashboard-card">
      <div className="card-title">제출 전 확인할 부분</div>
      
      <div className="risk-header-row">
        <div className="risk-level-display">
          <span>종합 진단 결과:</span>
          <span className={`risk-overall-badge ${getRiskClass(riskResult.overall_risk_level)}`}>
            {riskResult.overall_risk_level}
          </span>
        </div>
      </div>

      {riskResult.risks && riskResult.risks.length > 0 ? (
        riskResult.risks.map((risk, idx) => (
          <div className={getRiskItemClass(risk.severity)} key={idx}>
            <div className="risk-item-title">
              <span className="risk-category">[{risk.category}]</span>
              <span className={`badge ${risk.severity === '상' ? 'badge-imp-high' : risk.severity === '중' ? 'badge-imp-med' : 'badge-imp-low'}`}>
                심각도: {risk.severity}
              </span>
            </div>
            <div className="risk-desc">{risk.description}</div>
            <div className="risk-remedy">
              <strong>조치 가이드:</strong> {risk.remedy}
            </div>
          </div>
        ))
      ) : (
        <div className="risk-success-card">
          감지된 정보 노출이나 미실행 계획 완료 오인 표현 등의 위험 요소가 없습니다.
        </div>
      )}

      {riskResult.safe_usage_note && (
        <div className="risk-note">
          <strong>작성 가이드라인:</strong> {riskResult.safe_usage_note}
        </div>
      )}
    </div>
  );
};
