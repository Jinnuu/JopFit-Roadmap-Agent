import React from 'react';
import { JopFitResult } from '../types/jopfit';
import { FitGapTable } from './FitGapTable';
import { RoadmapTimeline } from './RoadmapTimeline';
import { RiskPanel } from './RiskPanel';
import { RagReferences } from './RagReferences';
import { JsonDownloadButton } from './JsonDownloadButton';
import { PdfSaveButton } from './PdfSaveButton';

interface ResultDashboardProps {
  result: JopFitResult | null;
  isLoading: boolean;
  error: string | null;
}

export const ResultDashboard: React.FC<ResultDashboardProps> = ({
  result,
  isLoading,
  error,
}) => {
  if (isLoading) {
    return (
      <div className="dashboard-card" style={{ display: 'block' }}>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <h3>정보를 분석하는 중입니다</h3>
          <p style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>
            입력된 내용을 바탕으로 빈틈을 확인하고 계획을 정리하고 있습니다. 잠시만 기다려 주십시오.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-card">
        <div className="error-container">
          <div className="error-title">분석을 진행하는 중 오류가 발생하였습니다</div>
          <div className="error-desc">{error}</div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="dashboard-empty">
        <div className="dashboard-empty-icon">?</div>
        <h2>아직 분석 결과가 없습니다</h2>
        <p>왼쪽에 공고와 현재 경험을 입력하면, 강점과 보완할 부분을 정리해드립니다.</p>
        
        <div className="empty-guide-grid">
          <div className="empty-guide-card">
            <div className="empty-guide-num">01</div>
            <div className="empty-guide-title">강점 확인</div>
            <div className="empty-guide-desc">공고의 핵심 요건과 보유한 강점 매칭 결과를 분석합니다.</div>
          </div>
          <div className="empty-guide-card">
            <div className="empty-guide-num">02</div>
            <div className="empty-guide-title">보완할 역량 정리</div>
            <div className="empty-guide-desc">준비 기간 동안 채워야 할 기술적 격차를 선별합니다.</div>
          </div>
          <div className="empty-guide-card">
            <div className="empty-guide-num">03</div>
            <div className="empty-guide-title">실행 계획 제안</div>
            <div className="empty-guide-desc">희망 기간과 가용 시간에 맞춘 주간 단위 프로젝트 계획을 설계합니다.</div>
          </div>
        </div>
      </div>
    );
  }

  const coveragePct = Math.round(result.evidence_coverage_rate * 100);

  // Derive contents for the 3-column summary cards
  const strongFitNames = result.fit_gap_analysis.strong_fits.map(item => item.requirement);
  const gapNames = [...result.fit_gap_analysis.gaps, ...result.fit_gap_analysis.partial_fits].map(item => item.requirement);
  const topPriorities = result.fit_gap_analysis.top_priorities || [];

  return (
    <div className="result-dashboard">
      {/* 1. Top Summary Card */}
      <div className="dashboard-card">
        <div className="card-title">한 줄 결론</div>
        <div className="card-content" style={{ color: 'var(--text-subtle)', fontSize: '14px', fontWeight: '500' }}>
          {result.fit_gap_analysis.summary}
        </div>
      </div>

      {/* 2. 3-column Summary Cards */}
      <div className="three-col-summary">
        <div className="three-col-card">
          <h4>현재 강점</h4>
          {strongFitNames.length > 0 ? (
            <ul>
              {strongFitNames.slice(0, 3).map((name, i) => <li key={i} style={{ marginBottom: '0.25rem' }}>{name}</li>)}
            </ul>
          ) : (
            <p>보유 강점이 특별히 정의되지 않았습니다.</p>
          )}
        </div>
        
        <div className="three-col-card">
          <h4>보완 필요</h4>
          {gapNames.length > 0 ? (
            <ul>
              {gapNames.slice(0, 3).map((name, i) => <li key={i} style={{ marginBottom: '0.25rem' }}>{name}</li>)}
            </ul>
          ) : (
            <p>보완할 주요 격차가 없습니다.</p>
          )}
        </div>

        <div className="three-col-card">
          <h4>먼저 할 일</h4>
          {topPriorities.length > 0 ? (
            <ul>
              {topPriorities.slice(0, 3).map((item, i) => <li key={i} style={{ marginBottom: '0.25rem' }}>{item}</li>)}
            </ul>
          ) : (
            <p>우선순위가 정의되지 않았습니다.</p>
          )}
        </div>
      </div>

      {/* Overview Block */}
      <div className="dashboard-card">
        <div className="card-title">직무 및 지원자 프로필 요약</div>
        <div className="summaries-grid">
          <div className="summary-block">
            <h3>공고 핵심 요약</h3>
            <p>{result.job_summary}</p>
          </div>
          <div className="summary-block">
            <h3>지원자 경험 요약</h3>
            <p>{result.user_summary}</p>
          </div>
        </div>
      </div>

      {/* Extracted requirements & experiences */}
      <div className="summaries-grid">
        <div className="dashboard-card">
          <div className="card-title">채용공고 요구사항</div>
          <ul className="outputs-list">
            {result.extracted_requirements.map((req, idx) => (
              <li key={idx}>
                <strong>{req.requirement}</strong>{' '}
                <span className={`badge ${req.importance === '상' ? 'badge-imp-high' : req.importance === '중' ? 'badge-imp-med' : 'badge-imp-low'}`}>
                  중요도: {req.importance}
                </span>
                {req.evidence && (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    * 근거 문구: "{req.evidence}"
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="dashboard-card">
          <div className="card-title">지원자 보유 매칭 경험</div>
          <ul className="outputs-list">
            {result.matched_experiences.map((exp, idx) => (
              <li key={idx}>{exp}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* 3. Evidence coverage progress bar */}
      <div className="dashboard-card">
        <div className="coverage-wrapper">
          <div className="coverage-label-row">
            <span className="coverage-title">공고 근거 반영률</span>
            <span className="coverage-value">{coveragePct}%</span>
          </div>
          <div className="coverage-bar-bg">
            <div className="coverage-bar-fill" style={{ width: `${coveragePct}%` }}></div>
          </div>
        </div>
      </div>

      {/* 4. Fit Gap Table Card */}
      <div className="dashboard-card">
        <div className="card-title">공고 요건별 매칭 현황</div>
        <FitGapTable
          strongFits={result.fit_gap_analysis.strong_fits}
          partialFits={result.fit_gap_analysis.partial_fits}
          gaps={result.fit_gap_analysis.gaps}
        />
      </div>

      {/* 5. Roadmap & Timeline */}
      <div className="dashboard-card">
        <div className="card-title">추천 프로젝트 및 주차별 계획</div>
        <div style={{ backgroundColor: 'var(--surface-subtle)', border: '1px solid var(--border)', padding: '1.25rem', borderRadius: '10px', marginBottom: '1.5rem' }}>
          <h4 style={{ color: 'var(--text)', marginBottom: '0.5rem', fontSize: '15px', fontWeight: 800 }}>
            추천 프로젝트: {result.roadmap.recommended_project_title}
          </h4>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {result.roadmap.project_summary}
          </p>
          <p style={{ fontSize: '13px', color: 'var(--primary)', marginTop: '0.75rem', fontWeight: 700 }}>
            추천 사유: {result.roadmap.reason_for_recommendation}
          </p>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            진행 기간: {result.roadmap.duration_weeks}주 | 난이도: {result.roadmap.difficulty}
          </p>
        </div>
        <RoadmapTimeline plans={result.roadmap.weekly_plan} />
      </div>

      {/* Deliverables & Reflections */}
      <div className="summaries-grid">
        <div className="dashboard-card">
          <div className="card-title">최종 포트폴리오 산출물</div>
          <ul className="outputs-list">
            {result.roadmap.portfolio_outputs.map((out, idx) => (
              <li key={idx}>{out}</li>
            ))}
          </ul>
        </div>

        <div className="dashboard-card">
          <div className="card-title">자기소개서 반영 포인트</div>
          <ul className="reflection-list">
            {result.roadmap.resume_reflection_points.map((pt, idx) => (
              <li key={idx}>{pt}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Interview questions */}
      <div className="dashboard-card">
        <div className="card-title">예상 면접 질문</div>
        <ul className="qa-list">
          {result.roadmap.interview_questions.map((q, idx) => (
            <li key={idx}><strong>{q}</strong></li>
          ))}
        </ul>
      </div>

      {/* 6. 제출 전 체크 (RiskPanel) */}
      <RiskPanel riskResult={result.risk_checks} />

      {/* 7. 참고한 기준 (RagReferences) */}
      <RagReferences documents={result.referenced_rag_documents} />

      {/* Final Note */}
      {result.final_note && (
        <div className="dashboard-card" style={{ border: '1px solid var(--success-border)', backgroundColor: 'var(--success-bg)' }}>
          <div className="card-title" style={{ color: 'var(--success-text)', borderBottom: '1px solid var(--success-border)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
            종합 권고 사항
          </div>
          <div className="card-content" style={{ color: 'var(--success-text)', fontWeight: 700 }}>{result.final_note}</div>
        </div>
      )}

      {/* Action Buttons side-by-side */}
      <div className="download-section no-print" style={{ flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <PdfSaveButton result={result} />
          <JsonDownloadButton result={result} />
        </div>
        <span className="submit-disclaimer no-print" style={{ marginTop: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
          PDF 저장 시 인쇄 설정에서 “머리글과 바닥글” 옵션을 끄면 더 깔끔하게 저장됩니다.
        </span>
      </div>
    </div>
  );
};
