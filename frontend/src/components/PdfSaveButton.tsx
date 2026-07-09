import React from 'react';
import { JopFitResult } from '../types/jopfit';

interface PdfSaveButtonProps {
  result: JopFitResult;
}

const escapeHtml = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

export const PdfSaveButton: React.FC<PdfSaveButtonProps> = ({ result }) => {
  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=1200');
    if (!printWindow) {
      alert('팝업이 차단되었습니다. 팝업 허용 후 다시 시도해 주세요.');
      return;
    }

    const currentDate = new Date().toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const strongFits = result.fit_gap_analysis.strong_fits || [];
    const partialFits = result.fit_gap_analysis.partial_fits || [];
    const gaps = result.fit_gap_analysis.gaps || [];
    const allFits = [...strongFits, ...partialFits, ...gaps];

    // Build Fit-Gap table rows
    const tableRows = allFits
      .map(
        (item) => `
      <tr>
        <td style="font-weight: bold;">${escapeHtml(item.requirement)}</td>
        <td>${escapeHtml(item.user_experience || '경험 정보가 존재하지 않습니다.')}</td>
        <td>${escapeHtml(item.status)}</td>
        <td>${escapeHtml(item.action_item)}</td>
      </tr>
    `
      )
      .join('');

    // Build weekly plan rows
    const weeklyPlanList = (result.roadmap.weekly_plan || [])
      .map(
        (plan) => `
      <div style="display: flex; gap: 12px; border-bottom: 1px solid #f2f4f7; padding-bottom: 6px; margin-bottom: 8px;">
        <span style="font-weight: bold; font-size: 12px; min-width: 50px;">${escapeHtml(plan.week)}주차</span>
        <div>
          <strong style="font-size: 12px; color: #1f2937;">${escapeHtml(plan.goal)}</strong>
          <p class="text" style="color: #4b5563; margin: 2px 0 0 0;">${escapeHtml(plan.detail)}</p>
        </div>
      </div>
    `
      )
      .join('');

    // Build outputs & reflections
    const portfolioOutputs = (result.roadmap.portfolio_outputs || [])
      .map((out) => `<li>${escapeHtml(out)}</li>`)
      .join('');

    const resumeReflections = (result.roadmap.resume_reflection_points || [])
      .map((pt) => `<li>${escapeHtml(pt)}</li>`)
      .join('');

    const interviewQuestions = (result.roadmap.interview_questions || [])
      .map((q) => `<li><strong>${escapeHtml(q)}</strong></li>`)
      .join('');

    // Build risk check lists
    let riskChecksHtml = '';
    if (result.risk_checks.risks && result.risk_checks.risks.length > 0) {
      riskChecksHtml = result.risk_checks.risks
        .map(
          (risk) => `
        <div style="border: 1px solid #fecdca; background: #fef3f2; padding: 10px; border-radius: 6px; margin-bottom: 8px;">
          <strong style="font-size: 12px;">[${escapeHtml(risk.category)}] 심각도: ${escapeHtml(risk.severity)}</strong>
          <p class="text" style="margin: 2px 0 0 0;">${escapeHtml(risk.description)}</p>
          <p class="text" style="margin: 4px 0 0 0; font-weight: bold;">조치 가이드: ${escapeHtml(risk.remedy)}</p>
        </div>
      `
        )
        .join('');
    } else {
      riskChecksHtml = `
      <div class="text" style="color: #027a48; font-weight: bold;">
        감지된 정보 노출이나 미실행 계획 완료 오인 표현 등의 위험 요소가 없습니다.
      </div>
    `;
    }

    // Build references
    const referencedDocs = (result.referenced_rag_documents || [])
      .map(
        (doc) => `
      <div style="border: 1px solid #e4e7ec; padding: 10px; border-radius: 6px; margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between;">
          <strong style="font-size: 12px;">${escapeHtml(doc.title)}</strong>
          <span style="font-size: 11px;">매칭도: ${Math.round(doc.score * 100)}%</span>
        </div>
        <div style="font-size: 11px; color: #667085; font-family: monospace;">경로: ${escapeHtml(doc.path)}</div>
        <p class="text" style="margin: 4px 0 0 0; font-size: 11px; color: #475569;">${escapeHtml(doc.snippet)}</p>
      </div>
    `
      )
      .join('');

    printWindow.document.open();
    printWindow.document.write(`
      <!doctype html>
      <html lang="ko">
        <head>
          <meta charset="utf-8" />
          <title>JobFit 분석 리포트</title>
          <style>
            @page {
              size: A4;
              margin: 14mm 12mm;
            }

            * {
              box-sizing: border-box;
            }

            body {
              margin: 0;
              font-family: Pretendard, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
              color: #111827;
              background: #ffffff;
            }

            .page {
              width: 100%;
              padding: 0;
            }

            .report-title {
              font-size: 22px;
              font-weight: 800;
              margin: 0 0 6px;
            }

            .report-meta {
              font-size: 11px;
              color: #667085;
              margin-bottom: 18px;
            }

            .section {
              margin-bottom: 18px;
              break-inside: avoid;
              page-break-inside: avoid;
            }

            .section-title {
              font-size: 15px;
              font-weight: 800;
              margin: 0 0 8px;
              padding-bottom: 6px;
              border-bottom: 1px solid #d0d5dd;
            }

            .card {
              border: 1px solid #d0d5dd;
              border-radius: 8px;
              padding: 12px 14px;
              margin-bottom: 10px;
            }

            .label {
              font-size: 11px;
              color: #667085;
              font-weight: 700;
              margin-bottom: 4px;
            }

            .text {
              font-size: 12px;
              line-height: 1.6;
              white-space: pre-wrap;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 10.5px;
            }

            th, td {
              border: 1px solid #d0d5dd;
              padding: 7px;
              vertical-align: top;
              line-height: 1.45;
            }

            th {
              background: #f2f4f7;
              font-weight: 800;
            }

            ul {
              margin: 6px 0 0 18px;
              padding: 0;
            }

            li {
              font-size: 12px;
              line-height: 1.55;
              margin-bottom: 4px;
            }

            @media print {
              body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <main class="page">
            <div class="section">
              <h1 class="report-title">JobFit 분석 리포트</h1>
              <div class="report-meta">
                지원 직무: ${escapeHtml(result.job_summary.split(' ')[0] || '지정 직무')} | 분석 일시: ${escapeHtml(currentDate)}
              </div>
            </div>

            <div class="section card">
              <div class="label">한 줄 결론</div>
              <div class="text">${escapeHtml(result.fit_gap_analysis.summary)}</div>
            </div>

            <div class="section card">
              <div class="label">직무 및 지원자 경험 요약</div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div>
                  <strong style="font-size: 11px;">공고 핵심 요약</strong>
                  <p class="text" style="margin-top: 4px;">${escapeHtml(result.job_summary)}</p>
                </div>
                <div>
                  <strong style="font-size: 11px;">지원자 경험 요약</strong>
                  <p class="text" style="margin-top: 4px;">${escapeHtml(result.user_summary)}</p>
                </div>
              </div>
            </div>

            <div class="section card">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong style="font-size: 12px;">공고 근거 반영률</strong>
                <span style="font-family: monospace; font-weight: bold; font-size: 13px;">
                  ${Math.round(result.evidence_coverage_rate * 100)}%
                </span>
              </div>
            </div>

            <div class="section">
              <h2 class="section-title">공고 요건별 매칭 현황</h2>
              <table>
                <thead>
                  <tr>
                    <th style="width: 25%;">요구사항</th>
                    <th style="width: 35%;">보유 경험</th>
                    <th style="width: 15%;">적합도</th>
                    <th style="width: 25%;">보완 계획</th>
                  </tr>
                </thead>
                <tbody>
                  ${tableRows}
                </tbody>
              </table>
            </div>

            <div class="section card" style="page-break-before: always;">
              <h2 class="section-title" style="border: none; padding: 0; margin-bottom: 12px;">추천 프로젝트 및 주차별 로드맵</h2>
              <div style="background: #f9fafb; border: 1px solid #d0d5dd; padding: 10px; border-radius: 6px; margin-bottom: 12px;">
                <strong style="font-size: 12px;">추천 프로젝트: ${escapeHtml(result.roadmap.recommended_project_title)}</strong>
                <p class="text" style="margin-top: 4px; color: #475569;">${escapeHtml(result.roadmap.project_summary)}</p>
                <p class="text" style="margin-top: 4px; font-weight: bold; color: #2563eb;">
                  추천 사유: ${escapeHtml(result.roadmap.reason_for_recommendation)}
                </p>
                <p class="text" style="margin-top: 2px; font-size: 11px; color: #667085;">
                  진행 기간: ${escapeHtml(result.roadmap.duration_weeks)}주 | 난이도: ${escapeHtml(result.roadmap.difficulty)}
                </p>
              </div>
              <div style="margin-top: 12px;">
                ${weeklyPlanList}
              </div>
            </div>

            <div class="section" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div class="card" style="margin-bottom: 0;">
                <div class="label" style="font-size: 12px; color: #111827;">최종 포트폴리오 산출물</div>
                <ul>
                  ${portfolioOutputs}
                </ul>
              </div>
              <div class="card" style="margin-bottom: 0;">
                <div class="label" style="font-size: 12px; color: #111827;">자기소개서 반영 포인트</div>
                <ul>
                  ${resumeReflections}
                </ul>
              </div>
            </div>

            <div class="section card">
              <div class="label" style="font-size: 12px; color: #111827;">예상 면접 질문</div>
              <ul>
                ${interviewQuestions}
              </ul>
            </div>

            <div class="section card">
              <h2 class="section-title" style="border: none; padding: 0;">제출 전 확인할 부분</h2>
              <div style="margin-bottom: 8px;">
                <strong>종합 진단 결과: ${escapeHtml(result.risk_checks.overall_risk_level)}</strong>
              </div>
              <div>
                ${riskChecksHtml}
              </div>
              <div style="margin-top: 10px; border-top: 1px solid #d0d5dd; padding-top: 8px; font-size: 11px; color: #667085;">
                <strong>작성 가이드라인:</strong> ${escapeHtml(result.risk_checks.safe_usage_note)}
              </div>
            </div>

            ${referencedDocs ? `
              <div class="section">
                <h2 class="section-title">참고한 기준</h2>
                <div>
                  ${referencedDocs}
                </div>
              </div>
            ` : ''}

            ${result.final_note ? `
              <div class="section card" style="border: 1px solid #a7f3d0; background: #ecfdf3;">
                <div class="label" style="color: #027a48; font-size: 12px;">종합 권고 사항</div>
                <div class="text" style="color: #027a48; font-weight: bold;">${escapeHtml(result.final_note)}</div>
              </div>
            ` : ''}
          </main>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 250);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <button onClick={handlePrint} className="download-btn no-print" style={{ marginLeft: '12px' }}>
      PDF로 저장
    </button>
  );
};
