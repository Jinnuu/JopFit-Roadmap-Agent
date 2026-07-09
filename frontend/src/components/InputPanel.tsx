import React, { useState } from 'react';
import { AnalyzeRequest } from '../types/jopfit';

interface InputPanelProps {
  onSubmit: (request: AnalyzeRequest) => void;
  isLoading: boolean;
}

const enableLlmMode = import.meta.env.VITE_ENABLE_LLM_MODE === 'true';

export const InputPanel: React.FC<InputPanelProps> = ({ onSubmit, isLoading }) => {
  // Setup demo default states
  const [position, setPosition] = useState('AI 서비스 백엔드 인턴');
  const [jobPosting, setJobPosting] = useState(
    `- Python 기반 API 개발 경험\n- LLM API 활용 경험 우대\n- RAG 또는 Vector DB 경험 우대\n- Docker 기반 배포 경험 우대\n- 사용자 로그 기반 서비스 개선 경험 우대`
  );
  const [companyValues, setCompanyValues] = useState(
    `문제를 구조화하고 빠르게 실험하는 사람, 협업과 문서화를 중시하는 사람`
  );
  const [resumeDraft, setResumeDraft] = useState(
    `안녕하세요. Python 백엔드 개발자 지망생입니다. Django 기반 웹서비스 개발 프로젝트를 주로 진행해 왔습니다.`
  );
  const [projectDescription, setProjectDescription] = useState(
    `Django와 MySQL 기반 식단·재고·발주 관리 웹서비스를 개발했습니다.\n식수 예측 모델을 연동했고 Docker를 활용해 배포했습니다.`
  );
  const [techStack, setTechStack] = useState('Python, Django, MySQL, Docker');
  const [desiredDuration, setDesiredDuration] = useState<number>(6);
  const [weeklyHours, setWeeklyHours] = useState<number>(15);
  const [goal, setGoal] = useState('포트폴리오 제작');

  // Developer specific states
  const [useRealLlm, setUseRealLlm] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!position.trim() || !jobPosting.trim() || !techStack.trim()) {
      alert('준비 중인 직무, 공고 내용, 현재 사용할 수 있는 기술은 필수 입력 항목입니다.');
      return;
    }
    
    onSubmit({
      position,
      job_posting: jobPosting,
      company_values: companyValues,
      resume_draft: resumeDraft,
      project_description: projectDescription,
      tech_stack: techStack,
      desired_duration: desiredDuration,
      weekly_hours: weeklyHours,
      goal,
      use_mock: enableLlmMode ? !useRealLlm : true,
      api_key: (enableLlmMode && useRealLlm) ? apiKey : '',
    });
  };

  return (
    <div className="input-form-card">
      <h2 className="input-section-title">분석할 정보</h2>
      <p className="input-section-desc" style={{ marginBottom: '28px' }}>
        공고와 현재 경험을 입력하시면 강점, 보완할 부분, 실천 준비 계획을 정리해드립니다.
      </p>
      
      <form onSubmit={handleSubmit}>
        {/* 섹션 1: 공고 정보 */}
        <div className="form-section">
          <h3 className="form-section-title">공고 정보</h3>
          <p className="form-section-desc">지원하려는 채용 공고의 자격 요건과 기업 성향을 입력합니다.</p>
          
          <div className="form-grid grid-2">
            <div className="form-group">
              <label htmlFor="position">준비 중인 직무 *</label>
              <span className="form-hint">목표 직무명을 기재합니다.</span>
              <input
                id="position"
                type="text"
                className="form-input"
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="company_values">회사가 강조하는 태도</label>
              <span className="form-hint">인재상 등 주요 가치관을 입력합니다.</span>
              <input
                id="company_values"
                type="text"
                className="form-input"
                value={companyValues}
                onChange={(e) => setCompanyValues(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '16px' }}>
            <label htmlFor="job_posting">공고에서 중요해 보이는 내용 *</label>
            <span className="form-hint">주요 자격 조건이나 우대 사항 리스트를 입력합니다.</span>
            <textarea
              id="job_posting"
              className="form-textarea"
              value={jobPosting}
              onChange={(e) => setJobPosting(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
        </div>

        {/* 섹션 2: 내 경험 */}
        <div className="form-section">
          <h3 className="form-section-title">내 경험</h3>
          <p className="form-section-desc">현재 보유하고 있는 자소서 문구와 프로젝트 경험을 입력합니다.</p>
          
          <div className="form-group">
            <label htmlFor="tech_stack">현재 사용할 수 있는 기술 *</label>
            <span className="form-hint">보유한 기술 스택을 쉼표(,)로 구분하여 입력하십시오.</span>
            <input
              id="tech_stack"
              type="text"
              className="form-input"
              value={techStack}
              onChange={(e) => setTechStack(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          <div className="form-group" style={{ marginTop: '16px' }}>
            <label htmlFor="resume_draft">지금까지 정리한 자기소개서 문장</label>
            <span className="form-hint">자소서 초안 등 강점 매칭의 근거가 되는 내용을 기재합니다.</span>
            <textarea
              id="resume_draft"
              className="form-textarea"
              value={resumeDraft}
              onChange={(e) => setResumeDraft(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="form-group" style={{ marginTop: '16px' }}>
            <label htmlFor="project_description">이미 해본 프로젝트</label>
            <span className="form-hint">프로젝트에서 개발한 기능이나 아키텍처를 기재합니다.</span>
            <textarea
              id="project_description"
              className="form-textarea"
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* 섹션 3: 준비 조건 */}
        <div className="form-section">
          <h3 className="form-section-title">준비 조건</h3>
          <p className="form-section-desc">프로젝트 로드맵의 주차별 학습 범위를 설계하기 위한 제약 조건을 입력합니다.</p>
          
          <div className="form-grid grid-3">
            <div className="form-group">
              <label htmlFor="desired_duration">준비 기간</label>
              <select
                id="desired_duration"
                className="form-select"
                value={desiredDuration}
                onChange={(e) => setDesiredDuration(Number(e.target.value))}
                disabled={isLoading}
              >
                <option value={4}>4주</option>
                <option value={6}>6주</option>
                <option value={8}>8주</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="weekly_hours">주당 투자 가능 시간</label>
              <input
                id="weekly_hours"
                type="number"
                min={1}
                max={168}
                className="form-input"
                value={weeklyHours}
                onChange={(e) => setWeeklyHours(Number(e.target.value))}
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="goal">이번 분석의 목적</label>
              <select
                id="goal"
                className="form-select"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                disabled={isLoading}
              >
                <option value="포트폴리오 제작">포트폴리오 제작</option>
                <option value="서류 보완">서류 보완</option>
                <option value="면접 대비">면접 대비</option>
              </select>
            </div>
          </div>
        </div>

        {/* 개발자 설정 섹션 */}
        {enableLlmMode && (
          <div className="form-section dev-settings-section" style={{ marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
            <h3 className="form-section-title" style={{ color: 'var(--danger-text)' }}>개발자 설정</h3>
            <p className="form-section-desc" style={{ color: 'var(--text-muted)' }}>이 옵션은 로컬 개발 테스트용입니다. API Key는 저장하지 않고 요청 시에만 사용합니다.</p>
            
            <div className="toggle-group" style={{ marginBottom: '16px' }}>
              <input
                type="checkbox"
                id="use_real_llm"
                checked={useRealLlm}
                onChange={(e) => setUseRealLlm(e.target.checked)}
                disabled={isLoading}
              />
              <label htmlFor="use_real_llm" className="toggle-label">
                실제 LLM 분석 사용
              </label>
            </div>

            {useRealLlm && (
              <div className="form-group" style={{ marginTop: '12px' }}>
                <label htmlFor="dev_api_key">OpenAI API Key</label>
                <input
                  id="dev_api_key"
                  type="password"
                  className="form-input"
                  placeholder="sk-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            )}
          </div>
        )}

        <button type="submit" className="submit-btn" disabled={isLoading}>
          {isLoading ? '정리하는 중...' : '빈틈 찾기'}
        </button>
        
        <span className="submit-disclaimer">
          입력한 내용은 분석 요청에만 사용되며 저장하지 않습니다.
        </span>
      </form>
    </div>
  );
};
