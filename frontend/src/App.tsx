import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { ResultDashboard } from './components/ResultDashboard';
import { JopFitResult } from './types/jopfit';
import {
  getToken,
  setToken,
  removeToken,
  authApi,
  experienceApi,
  projectApi,
  resumeDraftApi,
  preferenceApi,
  analysisApi,
  roadmapApi,
  notificationApi,
  recommendationApi
} from './api/userClient';
import { analyzeJopfit } from './api/jopfitClient';

function App() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!getToken());
  const [user, setUser] = useState<any>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  // Layout State
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [sidebarStats, setSidebarStats] = useState({
    unreadNotifications: 0
  });

  // Global UI State
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Business Data States
  const [dashboardData, setDashboardData] = useState<any>({
    roadmapsCount: 0,
    weeklyTasks: [],
    recentAnalyses: [],
    experiencesCount: 0,
    projectsCount: 0,
    recommendations: []
  });
  const [experiences, setExperiences] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [resumes, setResumes] = useState<any[]>([]);
  const [preferences, setPreferences] = useState<{ companies: any[], roles: any[], postings: any[] }>({
    companies: [],
    roles: [],
    postings: []
  });
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [roadmaps, setRoadmaps] = useState<any[]>([]);
  const [selectedRoadmap, setSelectedRoadmap] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<{ roles: any[], companies: any[], nextRoadmaps: any[] }>({
    roles: [],
    companies: [],
    nextRoadmaps: []
  });

  // New Analysis Form State
  const [analysisForm, setAnalysisForm] = useState({
    company_name: '',
    position: '',
    job_description: '',
    company_values: '',
    mode: 'mock', // mock or llm
    desired_duration: 4,
    weekly_hours: 10,
    goal: '',
    api_key: ''
  });
  const [analysisResult, setAnalysisResult] = useState<JopFitResult | null>(null);
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(null);

  // CRUD Item Edit State (modals)
  const [editingItem, setEditingItem] = useState<{ type: 'experience' | 'project' | 'resume', data: any } | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedResultHistory, setSelectedResultHistory] = useState<JopFitResult | null>(null);

  // 1. Listen for unauthorized events to force log out
  useEffect(() => {
    const handleUnauthorized = () => {
      setIsAuthenticated(false);
      setUser(null);
    };
    window.addEventListener('auth-unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth-unauthorized', handleUnauthorized);
    };
  }, []);

  // 2. Load User Profile on authentication
  useEffect(() => {
    if (isAuthenticated) {
      loadUserProfile();
      loadNotificationCount();
      // Load initial dashboard tab data
      if (activeTab === 'dashboard') {
        loadDashboardData();
      }
    }
  }, [isAuthenticated, activeTab]);

  const loadUserProfile = async () => {
    try {
      const data = await authApi.getMe();
      setUser(data);
    } catch (err) {
      // Ignored: Token is already removed by userClient
    }
  };

  const loadNotificationCount = async () => {
    try {
      const notifs = await notificationApi.list();
      const unread = notifs.filter((n: any) => !n.is_read).length;
      setSidebarStats({ unreadNotifications: unread });
    } catch (err) {
      // Ignored
    }
  };

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [roadmapsList, notifs, historyList, expsList, projsList, recRoles] = await Promise.all([
        roadmapApi.list(),
        notificationApi.list(),
        analysisApi.list(),
        experienceApi.list(),
        projectApi.list(),
        recommendationApi.roles().catch(() => ({ recommendations: [] }))
      ]);

      // Collect all tasks from active roadmaps that are due
      let activeTasks: any[] = [];
      const activeRoadmaps = roadmapsList.filter((r: any) => r.status === 'active');
      for (const r of activeRoadmaps) {
        try {
          const detail = await roadmapApi.get(r.id);
          if (detail && detail.tasks) {
            activeTasks.push(...detail.tasks.map((t: any) => ({ ...t, roadmapTitle: r.title })));
          }
        } catch (e) {
          // Ignored
        }
      }

      setDashboardData({
        roadmapsCount: activeRoadmaps.length,
        weeklyTasks: activeTasks.filter((t: any) => t.status === 'todo' || t.status === 'doing'),
        recentAnalyses: historyList.slice(0, 3),
        experiencesCount: expsList.length,
        projectsCount: projsList.length,
        recommendations: recRoles.recommendations || []
      });
      setSidebarStats({ unreadNotifications: notifs.filter((n: any) => !n.is_read).length });
    } catch (err: any) {
      setError(err.message || '대시보드 데이터를 로드하는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Load Tab specific data
  useEffect(() => {
    if (!isAuthenticated) return;
    setError(null);
    setInfoMessage(null);

    const loadTab = async () => {
      setIsLoading(true);
      try {
        switch (activeTab) {
          case 'experiences':
            const exps = await experienceApi.list();
            setExperiences(exps);
            break;
          case 'projects':
            const projs = await projectApi.list();
            setProjects(projs);
            break;
          case 'resumes':
            const res = await resumeDraftApi.list();
            setResumes(res);
            break;
          case 'preferences':
            const [companies, roles, postings] = await Promise.all([
              preferenceApi.listCompanies(),
              preferenceApi.listRoles(),
              preferenceApi.listJobPostings()
            ]);
            setPreferences({ companies, roles, postings });
            break;
          case 'analysis_histories':
            const list = await analysisApi.list();
            setAnalyses(list);
            break;
          case 'roadmaps':
            const rds = await roadmapApi.list();
            setRoadmaps(rds);
            if (rds.length > 0) {
              // Load the first roadmap by default
              handleViewRoadmap(rds[0].id);
            } else {
              setSelectedRoadmap(null);
            }
            break;
          case 'recommendations':
            const [rolesRec, compsRec, roadRec] = await Promise.all([
              recommendationApi.roles().catch(() => ({ recommendations: [] })),
              recommendationApi.companies().catch(() => ({ recommendations: [] })),
              recommendationApi.nextRoadmap().catch(() => ({ recommendations: [] }))
            ]);
            setRecommendations({
              roles: rolesRec.recommendations || [],
              companies: compsRec.recommendations || [],
              nextRoadmaps: roadRec.recommendations || []
            });
            break;
          case 'notifications':
            const notifs = await notificationApi.list();
            setNotifications(notifs);
            setSidebarStats({ unreadNotifications: notifs.filter((n: any) => !n.is_read).length });
            break;
        }
      } catch (err: any) {
        setError(err.message || '데이터를 가져오는 도중 서버 에러가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadTab();
  }, [activeTab, isAuthenticated]);

  // Auth Actions
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsLoading(true);

    try {
      if (authMode === 'login') {
        const data = await authApi.login({ email, password });
        setToken(data.access_token);
        setIsAuthenticated(true);
        setActiveTab('dashboard');
      } else {
        await authApi.register({ email, password, name });
        setInfoMessage('회원가입이 완료되었습니다. 로그인 해주세요.');
        setAuthMode('login');
      }
    } catch (err: any) {
      setAuthError(err.message || '인증 처리에 실패하였습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    removeToken();
    setIsAuthenticated(false);
    setUser(null);
    setAnalysisResult(null);
  };

  // CRUD Actions - Create & Update
  const handleOpenCreateModal = (type: 'experience' | 'project' | 'resume') => {
    const defaultData = type === 'experience'
      ? { title: '', category: 'activity', start_date: '', end_date: '', description: '', skills_gained: [] }
      : type === 'project'
      ? { title: '', role: '', tech_stack: [], description: '', contribution: '', outcomes: '', project_url: '' }
      : { title: '', question: '', answer: '', target_company: '' };
    
    setEditingItem({ type, data: defaultData });
    setIsEditModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setIsLoading(true);
    setError(null);

    const { type, data } = editingItem;
    try {
      if (type === 'experience') {
        // Parse skills comma separated list
        const processed = {
          ...data,
          skills_gained: typeof data.skills_gained === 'string'
            ? (data.skills_gained as string).split(',').map(s => s.trim()).filter(Boolean)
            : data.skills_gained
        };
        if (data.id) {
          await experienceApi.update(data.id, processed);
        } else {
          await experienceApi.create(processed);
        }
        const updatedList = await experienceApi.list();
        setExperiences(updatedList);
      } else if (type === 'project') {
        const processed = {
          ...data,
          tech_stack: typeof data.tech_stack === 'string'
            ? (data.tech_stack as string).split(',').map(s => s.trim()).filter(Boolean)
            : data.tech_stack
        };
        if (data.id) {
          await projectApi.update(data.id, processed);
        } else {
          await projectApi.create(processed);
        }
        const updatedList = await projectApi.list();
        setProjects(updatedList);
      } else if (type === 'resume') {
        if (data.id) {
          await resumeDraftApi.update(data.id, data);
        } else {
          await resumeDraftApi.create(data);
        }
        const updatedList = await resumeDraftApi.list();
        setResumes(updatedList);
      }
      setIsEditModalOpen(false);
      setEditingItem(null);
    } catch (err: any) {
      setError(err.message || '저장하는 데 실패하였습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditItem = (type: 'experience' | 'project' | 'resume', item: any) => {
    const processed = { ...item };
    if (type === 'experience' && Array.isArray(item.skills_gained)) {
      processed.skills_gained = item.skills_gained.join(', ');
    }
    if (type === 'project' && Array.isArray(item.tech_stack)) {
      processed.tech_stack = item.tech_stack.join(', ');
    }
    setEditingItem({ type, data: processed });
    setIsEditModalOpen(true);
  };

  const handleDeleteItem = async (type: 'experience' | 'project' | 'resume', id: string) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    setIsLoading(true);
    try {
      if (type === 'experience') {
        await experienceApi.delete(id);
        setExperiences(experiences.filter(e => e.id !== id));
      } else if (type === 'project') {
        await projectApi.delete(id);
        setProjects(projects.filter(p => p.id !== id));
      } else if (type === 'resume') {
        await resumeDraftApi.delete(id);
        setResumes(resumes.filter(r => r.id !== id));
      }
    } catch (err: any) {
      setError(err.message || '삭제에 실패하였습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // Preference Handlers
  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const company_name = (form.elements.namedItem('company_name') as HTMLInputElement).value;
    const industry = (form.elements.namedItem('industry') as HTMLInputElement).value;
    const memo = (form.elements.namedItem('memo') as HTMLTextAreaElement).value;

    if (!company_name.trim()) return;
    setIsLoading(true);
    try {
      await preferenceApi.createCompany({ company_name, industry, memo });
      const companies = await preferenceApi.listCompanies();
      setPreferences(prev => ({ ...prev, companies }));
      form.reset();
    } catch (err: any) {
      setError(err.message || '등록에 실패하였습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const role_name = (form.elements.namedItem('role_name') as HTMLInputElement).value;
    const priority = parseInt((form.elements.namedItem('priority') as HTMLSelectElement).value);

    if (!role_name.trim()) return;
    setIsLoading(true);
    try {
      await preferenceApi.createRole({ role_name, priority });
      const roles = await preferenceApi.listRoles();
      setPreferences(prev => ({ ...prev, roles }));
      form.reset();
    } catch (err: any) {
      setError(err.message || '등록에 실패하였습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddJobPosting = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const company_name = (form.elements.namedItem('company_name') as HTMLInputElement).value;
    const position_title = (form.elements.namedItem('position_title') as HTMLInputElement).value;
    const job_url = (form.elements.namedItem('job_url') as HTMLInputElement).value;
    const raw_text = (form.elements.namedItem('raw_text') as HTMLTextAreaElement).value;

    if (!company_name.trim() || !position_title.trim() || !raw_text.trim()) return;
    setIsLoading(true);
    try {
      await preferenceApi.createJobPosting({ company_name, position_title, job_url, raw_text });
      const postings = await preferenceApi.listJobPostings();
      setPreferences(prev => ({ ...prev, postings }));
      form.reset();
    } catch (err: any) {
      setError(err.message || '등록에 실패하였습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // Analysis Trigger
  const handleRunAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    setCurrentAnalysisId(null);

    try {
      const data = await analysisApi.create(analysisForm);
      setAnalysisResult(data.result);
      setCurrentAnalysisId(data.analysis_id);
    } catch (err: any) {
      setError(err.message || '분석 중 에러가 발생하였습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // Activate Roadmap from Analysis
  const handleSaveRoadmap = async () => {
    if (!currentAnalysisId) return;
    setIsLoading(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      await roadmapApi.createFromAnalysis(currentAnalysisId, { start_date: todayStr });
      setInfoMessage('로드맵이 활성화되어 [내 로드맵]으로 이동 및 저장되었습니다.');
      setActiveTab('roadmaps');
    } catch (err: any) {
      setError(err.message || '로드맵 저장에 실패하였습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // Roadmap Operations
  const handleViewRoadmap = async (id: string) => {
    setIsLoading(true);
    try {
      const detail = await roadmapApi.get(id);
      setSelectedRoadmap(detail);
    } catch (err: any) {
      setError(err.message || '로드맵 상세 정보를 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    if (!selectedRoadmap) return;
    try {
      await roadmapApi.updateTaskStatus(selectedRoadmap.id, taskId, { status: newStatus });
      // Reload current roadmap details
      const detail = await roadmapApi.get(selectedRoadmap.id);
      setSelectedRoadmap(detail);
      loadNotificationCount();
    } catch (err: any) {
      setError(err.message || '태스크 상태 업데이트에 실패했습니다.');
    }
  };

  const handleDeleteRoadmap = async (id: string) => {
    if (!window.confirm('정말 이 로드맵을 삭제하시겠습니까?')) return;
    setIsLoading(true);
    try {
      await roadmapApi.delete(id);
      const rds = await roadmapApi.list();
      setRoadmaps(rds);
      if (rds.length > 0) {
        handleViewRoadmap(rds[0].id);
      } else {
        setSelectedRoadmap(null);
      }
    } catch (err: any) {
      setError(err.message || '로드맵 삭제에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // Notification Operations
  const handleReadNotification = async (id: string) => {
    try {
      await notificationApi.read(id);
      // Reload notifications list
      const notifs = await notificationApi.list();
      setNotifications(notifs);
      setSidebarStats({ unreadNotifications: notifs.filter((n: any) => !n.is_read).length });
    } catch (err: any) {
      // Ignored
    }
  };

  // View past analysis detailed result in modal
  const handleViewPastAnalysis = (hist: any) => {
    setSelectedResultHistory(hist.result_json);
  };

  const handleDeletePastAnalysis = async (id: string) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    setIsLoading(true);
    try {
      await analysisApi.delete(id);
      setAnalyses(analyses.filter(a => a.id !== id));
    } catch (err: any) {
      setError(err.message || '삭제에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // View Demo UI (if not logged in)
  const [showDemo, setShowDemo] = useState(false);
  const [demoResult, setDemoResult] = useState<JopFitResult | null>(null);
  const [demoIsLoading, setDemoIsLoading] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);

  const handleDemoSubmit = async (requestData: any) => {
    setDemoIsLoading(true);
    setDemoError(null);
    setDemoResult(null);
    try {
      const res = await analyzeJopfit({ ...requestData, use_mock: true });
      setDemoResult(res);
    } catch (err: any) {
      setDemoError(err.message || '데모 분석 실행 오류');
    } finally {
      setDemoIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      {/* Topbar Header */}
      <header className="topbar">
        <div className="brand">
          <strong>JobFit Roadmap</strong>
          <span>AI Agent 기반 맞춤형 취업 관리</span>
        </div>
        <div>
          {isAuthenticated ? (
            <button className="btn btn-outline" onClick={handleLogout} style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}>
              로그아웃
            </button>
          ) : (
            <button className="btn btn-outline" onClick={() => setShowDemo(!showDemo)} style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}>
              {showDemo ? '로그인 화면으로' : '체험용 데모 사용'}
            </button>
          )}
        </div>
      </header>

      {/* Global Alerts */}
      {error && (
        <div className="inline-alert" style={{ maxWidth: '1080px', margin: '0 auto 18px auto', width: '90%', border: '1px solid var(--danger-border)', backgroundColor: 'var(--danger-bg)', color: 'var(--danger-text)', padding: '12px 18px', borderRadius: '10px' }}>
          <strong>오류: </strong> {error}
          <button onClick={() => setError(null)} style={{ float: 'right', background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 'bold' }}>X</button>
        </div>
      )}
      {infoMessage && (
        <div className="inline-alert" style={{ maxWidth: '1080px', margin: '0 auto 18px auto', width: '90%', border: '1px solid var(--success-border)', backgroundColor: 'var(--success-bg)', color: 'var(--success-text)', padding: '12px 18px', borderRadius: '10px' }}>
          <strong>알림: </strong> {infoMessage}
          <button onClick={() => setInfoMessage(null)} style={{ float: 'right', background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 'bold' }}>X</button>
        </div>
      )}

      {/* 1. NOT AUTHENTICATED VIEW */}
      {!isAuthenticated ? (
        showDemo ? (
          <Layout useMock={true}>
            <div style={{ maxWidth: '1080px', margin: '0 auto', width: '100%' }}>
              <div className="section-header-row">
                <h2>무료 데모 분석 도구 (비로그인)</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                <div className="data-table-card">
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    handleDemoSubmit({
                      position: (form.elements.namedItem('pos') as HTMLInputElement).value,
                      job_posting: (form.elements.namedItem('posting') as HTMLTextAreaElement).value,
                      company_values: '',
                      resume_draft: (form.elements.namedItem('resume') as HTMLTextAreaElement).value,
                      project_description: '',
                      tech_stack: '',
                      desired_duration: 4,
                      weekly_hours: 10,
                      goal: ''
                    });
                  }}>
                    <div className="form-group">
                      <label>지원 직무명</label>
                      <input name="pos" className="form-control" defaultValue="Python 웹 백엔드 개발자" required />
                    </div>
                    <div className="form-group">
                      <label>채용공고 본문</label>
                      <textarea name="posting" className="form-control" style={{ height: '140px' }} defaultValue="자격요건: Python 실무 웹 서비스 개발 경력, Django/FastAPI 개발 경험. 우대사항: Docker 컨테이너화 및 클라우드 배포 경험" required />
                    </div>
                    <div className="form-group">
                      <label>보유 강점 요약</label>
                      <textarea name="resume" className="form-control" style={{ height: '100px' }} defaultValue="컴퓨터공학과 캡스톤 프로젝트로 Python 기반 API 서버를 설계하여 PostgreSQL과 연동하고 로컬 구동에 성공한 경험이 있습니다." required />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={demoIsLoading}>
                      {demoIsLoading ? '분석 중...' : '체험용 분석 시작 (Mock)'}
                    </button>
                  </form>
                </div>
                {demoError && <div className="error-container">{demoError}</div>}
                {demoResult && <ResultDashboard result={demoResult} isLoading={demoIsLoading} error={demoError} />}
              </div>
            </div>
          </Layout>
        ) : (
          <div className="auth-wrapper">
            <div className="auth-card">
              <h2 className="auth-title">
                {authMode === 'login' ? '로그인' : '회원가입'}
              </h2>
              <p className="auth-subtitle">
                {authMode === 'login'
                  ? 'JobFit Roadmap 취업 포트폴리오 관리를 시작합니다'
                  : '계정을 만들고 맞춤형 로드맵을 설계하세요'}
              </p>

              {authError && (
                <div style={{ color: 'var(--danger-text)', backgroundColor: 'var(--danger-bg)', padding: '10px', borderRadius: '6px', marginBottom: '12px', fontSize: '0.85rem' }}>
                  {authError}
                </div>
              )}

              <form onSubmit={handleAuthSubmit}>
                {authMode === 'register' && (
                  <div className="form-group">
                    <label>이름</label>
                    <input
                      type="text"
                      className="form-control"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                )}
                <div className="form-group">
                  <label>이메일 주소</label>
                  <input
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>비밀번호</label>
                  <input
                    type="password"
                    className="form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.75rem' }} disabled={isLoading}>
                  {isLoading ? '처리 중...' : authMode === 'login' ? '로그인' : '회원가입'}
                </button>
              </form>

              <div className="auth-toggle">
                {authMode === 'login' ? (
                  <>
                    처음이신가요?
                    <span onClick={() => { setAuthMode('register'); setAuthError(null); }}>회원가입 하기</span>
                  </>
                ) : (
                  <>
                    이미 계정이 있으신가요?
                    <span onClick={() => { setAuthMode('login'); setAuthError(null); }}>로그인 하기</span>
                  </>
                )}
              </div>
            </div>
          </div>
        )
      ) : (
        /* 2. AUTHENTICATED SYSTEM LAYOUT */
        <div className="dashboard-container">
          {/* Sidebar Menu */}
          <aside className="sidebar-panel">
            <div className="sidebar-menu">
              <button className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
                대시보드
              </button>
              <button className={`sidebar-item ${activeTab === 'new_analysis' ? 'active' : ''}`} onClick={() => { setActiveTab('new_analysis'); setAnalysisResult(null); }}>
                새 분석 실행
              </button>
              <button className={`sidebar-item ${activeTab === 'analysis_histories' ? 'active' : ''}`} onClick={() => setActiveTab('analysis_histories')}>
                분석 기록
              </button>
              <button className={`sidebar-item ${activeTab === 'roadmaps' ? 'active' : ''}`} onClick={() => setActiveTab('roadmaps')}>
                내 로드맵
              </button>
              <button className={`sidebar-item ${activeTab === 'experiences' ? 'active' : ''}`} onClick={() => setActiveTab('experiences')}>
                경험 관리
              </button>
              <button className={`sidebar-item ${activeTab === 'projects' ? 'active' : ''}`} onClick={() => setActiveTab('projects')}>
                프로젝트 관리
              </button>
              <button className={`sidebar-item ${activeTab === 'resumes' ? 'active' : ''}`} onClick={() => setActiveTab('resumes')}>
                자소서 관리
              </button>
              <button className={`sidebar-item ${activeTab === 'preferences' ? 'active' : ''}`} onClick={() => setActiveTab('preferences')}>
                관심 기업/직무
              </button>
              <button className={`sidebar-item ${activeTab === 'recommendations' ? 'active' : ''}`} onClick={() => setActiveTab('recommendations')}>
                추천 피드백
              </button>
              <button className={`sidebar-item ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>
                알림 내역
                {sidebarStats.unreadNotifications > 0 && (
                  <span className="sidebar-badge">{sidebarStats.unreadNotifications}</span>
                )}
              </button>
            </div>

            {user && (
              <div className="sidebar-user-card">
                <div className="sidebar-user-name">{user.name} 님</div>
                <div className="sidebar-user-email">{user.email}</div>
              </div>
            )}
          </aside>

          {/* Main Content Area */}
          <main style={{ minWidth: 0 }}>
            {isLoading && !isEditModalOpen && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                <div className="loading-spinner" style={{ width: '16px', height: '16px', border: '2px solid var(--border)', borderTopColor: 'var(--primary)', margin: 0 }}></div>
                <span>데이터를 로드하고 있습니다...</span>
              </div>
            )}

            {/* A. DASHBOARD TAB */}
            {activeTab === 'dashboard' && (
              <div>
                <div className="section-header-row">
                  <h2>메인 대시보드</h2>
                </div>

                <div className="dashboard-grid">
                  <div className="metric-card">
                    <div className="metric-title">활성 로드맵</div>
                    <div className="metric-value">{dashboardData.roadmapsCount}</div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-title">진행중 과제 (To-Do/Doing)</div>
                    <div className="metric-value">{dashboardData.weeklyTasks.length}</div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-title">경험 개수</div>
                    <div className="metric-value">{dashboardData.experiencesCount}</div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-title">프로젝트 개수</div>
                    <div className="metric-value">{dashboardData.projectsCount}</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
                  {/* Left: Active Tasks */}
                  <div className="data-table-card">
                    <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>이번 주 수행할 과제</h3>
                    {dashboardData.weeklyTasks.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {dashboardData.weeklyTasks.slice(0, 5).map((task: any) => (
                          <div key={task.id} style={{ border: '1px solid var(--border)', padding: '10px', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                              <strong style={{ fontSize: '0.9rem' }}>{task.title}</strong>
                              <span className={`badge-status badge-status-${task.status}`}>{task.status}</span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>로드맵: {task.roadmapTitle}</div>
                            {task.due_date && <div style={{ fontSize: '0.75rem', color: 'var(--danger-text)', marginTop: '4px' }}>마감: {task.due_date}</div>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: 'var(--text-muted)' }}>진행 중인 과제가 없습니다. 새 분석 실행 후 로드맵을 저장해 보세요.</p>
                    )}
                  </div>

                  {/* Right: Recommendations & Recent History */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="data-table-card">
                      <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>AI 추천 맞춤 직무</h3>
                      {dashboardData.recommendations.length > 0 ? (
                        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {dashboardData.recommendations.map((rec: any, idx: number) => (
                            <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: idx < 2 ? '1px solid var(--border)' : 'none' }}>
                              <span><strong>{rec.title}</strong></span>
                              <span className="recommend-score-badge">적합도 {rec.score}%</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p style={{ color: 'var(--text-muted)' }}>경험을 추가하면 맞춤 직무 적합도가 연산됩니다.</p>
                      )}
                    </div>

                    <div className="data-table-card">
                      <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>최근 분석 공고</h3>
                      {dashboardData.recentAnalyses.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {dashboardData.recentAnalyses.map((hist: any) => (
                            <div key={hist.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                              <span>{hist.title}</span>
                              <span style={{ color: 'var(--text-faint)', fontSize: '0.75rem' }}>{new Date(hist.created_at).toLocaleDateString()}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ color: 'var(--text-muted)' }}>최근 실행한 공고 분석 이력이 없습니다.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* B. NEW ANALYSIS TAB */}
            {activeTab === 'new_analysis' && (
              <div>
                <div className="section-header-row">
                  <h2>새로운 채용공고 분석</h2>
                </div>

                {!analysisResult ? (
                  <div className="data-table-card">
                    <form onSubmit={handleRunAnalysis}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="form-group">
                          <label>회사 이름</label>
                          <input
                            type="text"
                            className="form-control"
                            value={analysisForm.company_name}
                            onChange={(e) => setAnalysisForm({ ...analysisForm, company_name: e.target.value })}
                            placeholder="예: 한국서부발전"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>지원 직무명</label>
                          <input
                            type="text"
                            className="form-control"
                            value={analysisForm.position}
                            onChange={(e) => setAnalysisForm({ ...analysisForm, position: e.target.value })}
                            placeholder="예: IT기술지원"
                            required
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label>채용공고 본문 내용</label>
                        <textarea
                          className="form-control"
                          style={{ height: '160px' }}
                          value={analysisForm.job_description}
                          onChange={(e) => setAnalysisForm({ ...analysisForm, job_description: e.target.value })}
                          placeholder="채용 사이트의 자격요건, 우대사항 등을 복사해서 붙여넣으세요"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>기업 인재상 / 핵심 가치 (선택)</label>
                        <textarea
                          className="form-control"
                          style={{ height: '80px' }}
                          value={analysisForm.company_values}
                          onChange={(e) => setAnalysisForm({ ...analysisForm, company_values: e.target.value })}
                          placeholder="회사의 인재상이나 미션을 아는 경우 적어주세요"
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                        <div className="form-group">
                          <label>희망 준비 기간 (주 단위)</label>
                          <input
                            type="number"
                            min="1"
                            max="12"
                            className="form-control"
                            value={analysisForm.desired_duration}
                            onChange={(e) => setAnalysisForm({ ...analysisForm, desired_duration: parseInt(e.target.value) || 4 })}
                          />
                        </div>
                        <div className="form-group">
                          <label>주당 투자 시간</label>
                          <input
                            type="number"
                            min="1"
                            max="80"
                            className="form-control"
                            value={analysisForm.weekly_hours}
                            onChange={(e) => setAnalysisForm({ ...analysisForm, weekly_hours: parseInt(e.target.value) || 10 })}
                          />
                        </div>
                        <div className="form-group">
                          <label>목표 (선택)</label>
                          <input
                            type="text"
                            className="form-control"
                            value={analysisForm.goal}
                            onChange={(e) => setAnalysisForm({ ...analysisForm, goal: e.target.value })}
                            placeholder="예: 포트폴리오 완성"
                          />
                        </div>
                      </div>

                      <div className="form-group" style={{ display: 'flex', gap: '20px', alignItems: 'center', marginTop: '1rem' }}>
                        <label style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input
                            type="radio"
                            name="mode"
                            checked={analysisForm.mode === 'mock'}
                            onChange={() => setAnalysisForm({ ...analysisForm, mode: 'mock' })}
                          />
                          Mock 분석 (가상 결과 수령)
                        </label>
                        <label style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input
                            type="radio"
                            name="mode"
                            checked={analysisForm.mode === 'llm'}
                            onChange={() => setAnalysisForm({ ...analysisForm, mode: 'llm' })}
                          />
                          실제 AI 분석 (OpenAI API Key 필요)
                        </label>
                      </div>

                      {analysisForm.mode === 'llm' && (
                        <div className="form-group" style={{ border: '1px solid var(--warning-border)', backgroundColor: 'var(--warning-bg)', padding: '12px', borderRadius: '8px' }}>
                          <label style={{ color: 'var(--warning-text)' }}>OpenAI API Key 입력</label>
                          <input
                            type="password"
                            className="form-control"
                            value={analysisForm.api_key}
                            onChange={(e) => setAnalysisForm({ ...analysisForm, api_key: e.target.value })}
                            placeholder="sk-..."
                            required={analysisForm.mode === 'llm'}
                          />
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>* 입력하신 API 키는 브라우저 스토리지나 데이터베이스에 절대 저장되지 않으며 요청 처리에만 사용됩니다.</span>
                        </div>
                      )}

                      <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }} disabled={isLoading}>
                        {isLoading ? '분석을 생성하는 중...' : 'Fit-Gap 분석 시작'}
                      </button>
                    </form>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem' }}>
                      <button className="btn btn-outline" onClick={() => setAnalysisResult(null)}>
                        새로운 양식으로 작성하기
                      </button>
                      <button className="btn btn-primary" onClick={handleSaveRoadmap}>
                        이 결과를 내 로드맵으로 저장하고 관리하기
                      </button>
                    </div>
                    <ResultDashboard result={analysisResult} isLoading={isLoading} error={error} />
                  </div>
                )}
              </div>
            )}

            {/* C. ANALYSIS HISTORIES TAB */}
            {activeTab === 'analysis_histories' && (
              <div>
                <div className="section-header-row">
                  <h2>분석 이력 관리</h2>
                </div>

                <div className="data-table-card">
                  {analyses.length > 0 ? (
                    <table className="responsive-table">
                      <thead>
                        <tr>
                          <th>일시</th>
                          <th>회사</th>
                          <th>직무</th>
                          <th>모드</th>
                          <th>작업</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analyses.map((hist) => (
                          <tr key={hist.id}>
                            <td>{new Date(hist.created_at).toLocaleString()}</td>
                            <td><strong>{hist.company_name || '미정'}</strong></td>
                            <td>{hist.position}</td>
                            <td><span className="card-list-tag">{hist.mode}</span></td>
                            <td>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button className="btn btn-outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }} onClick={() => handleViewPastAnalysis(hist)}>
                                  결과 재정리 보기
                                </button>
                                <button className="btn btn-outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', color: 'var(--danger-text)' }} onClick={() => handleDeletePastAnalysis(hist.id)}>
                                  삭제
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p style={{ color: 'var(--text-muted)' }}>실행된 공고 분석 기록이 없습니다.</p>
                  )}
                </div>

                {/* Show detailed result of past analysis in overlay modal if selected */}
                {selectedResultHistory && (
                  <div className="modal-overlay" onClick={() => setSelectedResultHistory(null)}>
                    <div className="modal-content-box" style={{ maxWidth: '960px' }} onClick={(e) => e.stopPropagation()}>
                      <div className="section-header-row">
                        <h3>과거 분석 상세서</h3>
                        <button className="btn btn-outline" onClick={() => setSelectedResultHistory(null)}>닫기</button>
                      </div>
                      <ResultDashboard result={selectedResultHistory} isLoading={false} error={null} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* D. ROADMAPS TAB */}
            {activeTab === 'roadmaps' && (
              <div>
                <div className="section-header-row">
                  <h2>내 로드맵 & 일정 관리</h2>
                </div>

                {roadmaps.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '20px' }}>
                    {/* Left: Roadmaps list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {roadmaps.map((r) => (
                        <div
                          key={r.id}
                          className={`card-list-item ${selectedRoadmap && selectedRoadmap.id === r.id ? 'active' : ''}`}
                          style={{
                            cursor: 'pointer',
                            borderColor: selectedRoadmap && selectedRoadmap.id === r.id ? 'var(--primary)' : 'var(--border)',
                            backgroundColor: selectedRoadmap && selectedRoadmap.id === r.id ? 'var(--primary-soft)' : 'var(--surface)'
                          }}
                          onClick={() => handleViewRoadmap(r.id)}
                        >
                          <h4 style={{ fontSize: '0.95rem' }}>{r.title}</h4>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>시작: {r.start_date}</span>
                          <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className="card-list-tag">{r.status}</span>
                            <button
                              className="btn btn-outline"
                              style={{ padding: '0.1rem 0.35rem', fontSize: '0.7rem', color: 'var(--danger-text)' }}
                              onClick={(e) => { e.stopPropagation(); handleDeleteRoadmap(r.id); }}
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Right: Selected Roadmap Tasks */}
                    <div className="data-table-card">
                      {selectedRoadmap ? (
                        <div>
                          <div className="section-header-row">
                            <h3>{selectedRoadmap.title} 주차별 계획</h3>
                            <span className="card-list-tag" style={{ fontSize: '0.85rem' }}>준비 대상 직무: {selectedRoadmap.target_role}</span>
                          </div>
                          
                          {selectedRoadmap.tasks && selectedRoadmap.tasks.length > 0 ? (
                            <table className="responsive-table">
                              <thead>
                                <tr>
                                  <th>주차</th>
                                  <th>과제 목표</th>
                                  <th>상세 내역</th>
                                  <th>목표 기한</th>
                                  <th>진척 상태</th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedRoadmap.tasks.map((task: any) => (
                                  <tr key={task.id}>
                                    <td><strong>{task.week}주차</strong></td>
                                    <td><strong>{task.title}</strong></td>
                                    <td style={{ fontSize: '0.8rem', whiteSpace: 'pre-line' }}>{task.detail}</td>
                                    <td><span style={{ color: 'var(--text-muted)' }}>{task.due_date}</span></td>
                                    <td>
                                      <select
                                        className="form-control"
                                        style={{ width: '100px', padding: '0.3rem', fontSize: '0.8rem' }}
                                        value={task.status}
                                        onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value)}
                                      >
                                        <option value="todo">To-Do</option>
                                        <option value="doing">Doing</option>
                                        <option value="done">Done</option>
                                        <option value="skipped">Skipped</option>
                                      </select>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <p style={{ color: 'var(--text-muted)' }}>등록된 세부 과제가 존재하지 않습니다.</p>
                          )}
                        </div>
                      ) : (
                        <p style={{ color: 'var(--text-muted)' }}>선택된 로드맵이 없습니다.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="dashboard-card" style={{ padding: '2.5rem', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>저장 및 진행 중인 로드맵이 존재하지 않습니다.</p>
                    <button className="btn btn-primary" onClick={() => setActiveTab('new_analysis')}>새 분석 실행하러 가기</button>
                  </div>
                )}
              </div>
            )}

            {/* E. EXPERIENCES TAB */}
            {activeTab === 'experiences' && (
              <div>
                <div className="section-header-row">
                  <h2>보유한 경험 내역 관리</h2>
                  <button className="btn btn-primary" onClick={() => handleOpenCreateModal('experience')}>새 경험 추가</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {experiences.length > 0 ? (
                    experiences.map((exp) => (
                      <div key={exp.id} className="card-list-item">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <h4>{exp.title}</h4>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                              분류: <span className="card-list-tag">{exp.category}</span> | 기간: {exp.start_date || '미지정'} ~ {exp.end_date || '진행중'}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn btn-outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }} onClick={() => handleEditItem('experience', exp)}>수정</button>
                            <button className="btn btn-outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', color: 'var(--danger-text)' }} onClick={() => handleDeleteItem('experience', exp.id)}>삭제</button>
                          </div>
                        </div>
                        <p style={{ whiteSpace: 'pre-line', marginTop: '6px' }}>{exp.description}</p>
                        {exp.skills_gained && exp.skills_gained.length > 0 && (
                          <div className="card-list-tags">
                            {exp.skills_gained.map((skill: string, i: number) => (
                              <span key={i} className="card-list-tag">{skill}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p style={{ color: 'var(--text-muted)' }}>등록된 경험이 없습니다. 회원님의 대외활동, 동아리, 학업 등의 경험을 추가해 보세요.</p>
                  )}
                </div>
              </div>
            )}

            {/* F. PROJECTS TAB */}
            {activeTab === 'projects' && (
              <div>
                <div className="section-header-row">
                  <h2>수행한 프로젝트 관리</h2>
                  <button className="btn btn-primary" onClick={() => handleOpenCreateModal('project')}>새 프로젝트 추가</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {projects.length > 0 ? (
                    projects.map((proj) => (
                      <div key={proj.id} className="card-list-item">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <h4>{proj.title}</h4>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                              역할: <strong>{proj.role}</strong>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn btn-outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }} onClick={() => handleEditItem('project', proj)}>수정</button>
                            <button className="btn btn-outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', color: 'var(--danger-text)' }} onClick={() => handleDeleteItem('project', proj.id)}>삭제</button>
                          </div>
                        </div>
                        
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-subtle)', marginTop: '8px' }}>
                          <strong>프로젝트 설명:</strong>
                          <p style={{ whiteSpace: 'pre-line', marginTop: '2px', marginBottom: '8px' }}>{proj.description}</p>
                        </div>
                        
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-subtle)' }}>
                          <strong>나의 기여 부분:</strong>
                          <p style={{ whiteSpace: 'pre-line', marginTop: '2px', marginBottom: '8px' }}>{proj.contribution}</p>
                        </div>

                        {proj.outcomes && (
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-subtle)' }}>
                            <strong>성과:</strong>
                            <p style={{ whiteSpace: 'pre-line', marginTop: '2px', marginBottom: '8px' }}>{proj.outcomes}</p>
                          </div>
                        )}

                        {proj.project_url && (
                          <div style={{ fontSize: '0.8rem', marginBottom: '8px' }}>
                            링크: <a href={proj.project_url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>{proj.project_url}</a>
                          </div>
                        )}

                        {proj.tech_stack && proj.tech_stack.length > 0 && (
                          <div className="card-list-tags">
                            {proj.tech_stack.map((tech: string, i: number) => (
                              <span key={i} className="card-list-tag" style={{ backgroundColor: 'var(--primary-soft)', color: 'var(--primary)' }}>{tech}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p style={{ color: 'var(--text-muted)' }}>등록된 프로젝트가 없습니다. 본인이 주도했거나 참가한 포트폴리오 프로젝트를 등록하세요.</p>
                  )}
                </div>
              </div>
            )}

            {/* G. RESUMES TAB */}
            {activeTab === 'resumes' && (
              <div>
                <div className="section-header-row">
                  <h2>자기소개서 초안 관리</h2>
                  <button className="btn btn-primary" onClick={() => handleOpenCreateModal('resume')}>새 자소서 문항 추가</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {resumes.length > 0 ? (
                    resumes.map((res) => (
                      <div key={res.id} className="card-list-item">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <h4>{res.title}</h4>
                            {res.target_company && (
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                                제출 예정 기업: <strong>{res.target_company}</strong>
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn btn-outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }} onClick={() => handleEditItem('resume', res)}>수정</button>
                            <button className="btn btn-outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', color: 'var(--danger-text)' }} onClick={() => handleDeleteItem('resume', res.id)}>삭제</button>
                          </div>
                        </div>
                        <div style={{ borderLeft: '3px solid var(--border-strong)', paddingLeft: '10px', margin: '10px 0', fontSize: '0.85rem', color: 'var(--text-subtle)', fontStyle: 'italic' }}>
                          Q. {res.question}
                        </div>
                        <p style={{ whiteSpace: 'pre-line', fontSize: '0.9rem' }}>{res.answer}</p>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: 'var(--text-muted)' }}>등록된 자기소개서 초안이 없습니다. 문항별 답변을 저장해 두고 분석에 이용해 보세요.</p>
                  )}
                </div>
              </div>
            )}

            {/* H. PREFERENCES TAB */}
            {activeTab === 'preferences' && (
              <div>
                <div className="section-header-row">
                  <h2>관심 기업 및 직무 설정</h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                  {/* Left: Companies */}
                  <div className="data-table-card">
                    <h3 style={{ marginBottom: '1rem' }}>관심 기업 목록</h3>
                    <form onSubmit={handleAddCompany} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '1.5rem' }}>
                      <input name="company_name" className="form-control" placeholder="회사명 (예: Toss)" required />
                      <input name="industry" className="form-control" placeholder="산업군 (예: 핀테크)" />
                      <textarea name="memo" className="form-control" style={{ height: '60px' }} placeholder="관심 이유 메모" />
                      <button type="submit" className="btn btn-primary">추가</button>
                    </form>
                    {preferences.companies.length > 0 ? (
                      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {preferences.companies.map((c) => (
                          <li key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px' }}>
                            <div>
                              <strong>{c.company_name}</strong> {c.industry && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({c.industry})</span>}
                              {c.memo && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>{c.memo}</div>}
                            </div>
                            <button className="btn btn-outline" style={{ padding: '0.1rem 0.4rem', fontSize: '0.75rem', color: 'var(--danger-text)' }} onClick={() => {
                              preferenceApi.deleteCompany(c.id).then(() => preferenceApi.listCompanies().then(companies => setPreferences(prev => ({ ...prev, companies }))));
                            }}>X</button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p style={{ color: 'var(--text-muted)' }}>추가된 관심 기업이 없습니다.</p>
                    )}
                  </div>

                  {/* Right: Roles */}
                  <div className="data-table-card">
                    <h3 style={{ marginBottom: '1rem' }}>희망 직무 목록</h3>
                    <form onSubmit={handleAddRole} style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem' }}>
                      <input name="role_name" className="form-control" placeholder="직무명 (예: Python 백엔드)" required />
                      <select name="priority" className="form-control" style={{ width: '80px' }}>
                        <option value="1">1순위</option>
                        <option value="2">2순위</option>
                        <option value="3">3순위</option>
                      </select>
                      <button type="submit" className="btn btn-primary" style={{ flexShrink: 0 }}>추가</button>
                    </form>
                    {preferences.roles.length > 0 ? (
                      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {preferences.roles.map((r) => (
                          <li key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px' }}>
                            <span><strong>{r.priority}순위</strong>: {r.role_name}</span>
                            <button className="btn btn-outline" style={{ padding: '0.1rem 0.4rem', fontSize: '0.75rem', color: 'var(--danger-text)' }} onClick={() => {
                              preferenceApi.deleteRole(r.id).then(() => preferenceApi.listRoles().then(roles => setPreferences(prev => ({ ...prev, roles }))));
                            }}>X</button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p style={{ color: 'var(--text-muted)' }}>추가된 희망 직무가 없습니다.</p>
                    )}
                  </div>
                </div>

                {/* Bottom: Saved Job Postings */}
                <div className="data-table-card">
                  <h3 style={{ marginBottom: '1rem' }}>저장된 채용공고 원본 본문</h3>
                  <form onSubmit={handleAddJobPosting} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                      <input name="company_name" className="form-control" placeholder="회사명 (예: Toss)" required />
                      <input name="position_title" className="form-control" placeholder="직무명 (예: 백엔드 개발자)" required />
                      <input name="job_url" className="form-control" placeholder="공고 URL 링크 (선택)" />
                    </div>
                    <textarea name="raw_text" className="form-control" style={{ height: '80px' }} placeholder="공고 상세 텍스트 붙여넣기" required />
                    <button type="submit" className="btn btn-primary">공고 본문 저장</button>
                  </form>
                  {preferences.postings.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                      {preferences.postings.map((p) => (
                        <div key={p.id} style={{ border: '1px solid var(--border)', padding: '12px', borderRadius: '8px', textAlign: 'left' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <strong>{p.company_name}</strong>
                            <button className="btn btn-outline" style={{ padding: '0.1rem 0.3rem', fontSize: '0.7rem', color: 'var(--danger-text)' }} onClick={() => {
                              preferenceApi.deleteJobPosting(p.id).then(() => preferenceApi.listJobPostings().then(postings => setPreferences(prev => ({ ...prev, postings }))));
                            }}>삭제</button>
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-subtle)', marginTop: '4px' }}>직무: {p.position_title}</div>
                          {p.job_url && <a href={p.job_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>공고 링크 이동</a>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: 'var(--text-muted)' }}>추가된 공고 정보가 없습니다.</p>
                  )}
                </div>
              </div>
            )}

            {/* I. RECOMMENDATIONS TAB */}
            {activeTab === 'recommendations' && (
              <div>
                <div className="section-header-row">
                  <h2>AI 추천 에이전트 분석 결과</h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                  {/* Recommended Roles */}
                  <div className="data-table-card">
                    <h3 style={{ marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>1. 추천 맞춤 직무 트랙</h3>
                    {recommendations.roles.length > 0 ? (
                      recommendations.roles.map((r, i) => (
                        <div key={i} className="recommend-card">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <h4 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{r.title}</h4>
                            <span className="recommend-score-badge">연관 적합도 {r.score}%</span>
                          </div>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '10px' }}>{r.reason}</p>
                          <div style={{ fontSize: '0.85rem' }}>
                            <strong>보완할 격차 (Gaps):</strong>
                            <ul style={{ paddingLeft: '20px', marginTop: '4px', marginBottom: '8px' }}>
                              {r.gaps.map((g: string, idx: number) => <li key={idx}>{g}</li>)}
                            </ul>
                            <strong>추천 Action Item:</strong>
                            <ul style={{ paddingLeft: '20px', marginTop: '4px', color: 'var(--primary)' }}>
                              {r.next_actions.map((act: string, idx: number) => <li key={idx} style={{ fontWeight: 600 }}>{act}</li>)}
                            </ul>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p style={{ color: 'var(--text-muted)' }}>추천 데이터를 로드하지 못했거나 경험 정보가 부족합니다.</p>
                    )}
                  </div>

                  {/* Recommended Companies */}
                  <div className="data-table-card">
                    <h3 style={{ marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>2. 최적 적합 기업 유형 및 공략법</h3>
                    {recommendations.companies.length > 0 ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                        {recommendations.companies.map((c, i) => (
                          <div key={i} className="recommend-card" style={{ height: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{c.title}</h4>
                              <span className="recommend-score-badge" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success-text)' }}>적합도 {c.score}%</span>
                            </div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '10px' }}>{c.reason}</p>
                            <div style={{ fontSize: '0.8rem' }}>
                              <strong>필요 역량 격차:</strong>
                              <ul style={{ paddingLeft: '15px', marginTop: '2px', marginBottom: '6px' }}>
                                {c.gaps.map((g: string, idx: number) => <li key={idx}>{g}</li>)}
                              </ul>
                              <strong>합격 공략 준비 가이드:</strong>
                              <ul style={{ paddingLeft: '15px', marginTop: '2px', color: 'var(--success-text)' }}>
                                {c.next_actions.map((act: string, idx: number) => <li key={idx} style={{ fontWeight: 600 }}>{act}</li>)}
                              </ul>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ color: 'var(--text-muted)' }}>추천 기업 유형 데이터가 존재하지 않습니다.</p>
                    )}
                  </div>

                  {/* Recommended Next Roadmaps */}
                  <div className="data-table-card">
                    <h3 style={{ marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>3. 추천 후속 프로젝트 / 로드맵 방향</h3>
                    {recommendations.nextRoadmaps.length > 0 ? (
                      recommendations.nextRoadmaps.map((road, i) => (
                        <div key={i} className="recommend-card">
                          <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px' }}>{road.title}</h4>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '8px' }}>{road.reason}</p>
                          <div style={{ fontSize: '0.8rem' }}>
                            <strong>학습이 필요한 격차:</strong> {road.gaps.join(', ')}
                            <div style={{ marginTop: '4px', color: 'var(--primary)', fontWeight: 600 }}>
                              추천 행동: {road.next_actions.join(', ')}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p style={{ color: 'var(--text-muted)' }}>추천 로드맵 데이터가 비어있습니다.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* J. NOTIFICATIONS TAB */}
            {activeTab === 'notifications' && (
              <div>
                <div className="section-header-row">
                  <h2>알림 센터</h2>
                </div>

                <div className="data-table-card" style={{ padding: 0 }}>
                  {notifications.length > 0 ? (
                    <div>
                      {notifications.map((notif) => (
                        <div key={notif.id} className={`notif-item ${notif.is_read ? '' : 'unread'}`} style={{ cursor: notif.is_read ? 'default' : 'pointer' }} onClick={() => !notif.is_read && handleReadNotification(notif.id)}>
                          <div>
                            <div className="notif-title">{notif.title}</div>
                            <div className="notif-msg">{notif.message}</div>
                            <div className="notif-date">{new Date(notif.created_at).toLocaleString()}</div>
                          </div>
                          {!notif.is_read && (
                            <span className="badge-status badge-status-doing" style={{ fontSize: '0.7rem' }}>읽지않음</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ padding: '2rem', color: 'var(--text-muted)', textAlign: 'center' }}>알림 내역이 비어 있습니다.</p>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      )}

      {/* CRUD Creation/Editing overlay Modal */}
      {isEditModalOpen && editingItem && (
        <div className="modal-overlay">
          <div className="modal-content-box">
            <div className="section-header-row">
              <h3>
                {editingItem.data.id ? '항목 수정' : '새로운 항목 등록'}
                {` - ${editingItem.type === 'experience' ? '경험' : editingItem.type === 'project' ? '프로젝트' : '자기소개서 초안'}`}
              </h3>
              <button className="btn btn-outline" onClick={() => { setIsEditModalOpen(false); setEditingItem(null); }}>닫기</button>
            </div>
            
            <form onSubmit={handleSaveItem}>
              {editingItem.type === 'experience' && (
                <div>
                  <div className="form-group">
                    <label>활동명 / 교육과정명</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editingItem.data.title}
                      onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, title: e.target.value } })}
                      required
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label>카테고리</label>
                      <select
                        className="form-control"
                        value={editingItem.data.category}
                        onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, category: e.target.value } })}
                      >
                        <option value="activity">대외활동 / 동아리</option>
                        <option value="education">학습 / 교육 이수</option>
                        <option value="internship">인턴십 / 실무 경력</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>핵심 획득 기술 (쉼표로 구분)</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="예: React, Node.js, Git"
                        value={editingItem.data.skills_gained}
                        onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, skills_gained: e.target.value } })}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label>시작일</label>
                      <input
                        type="date"
                        className="form-control"
                        value={editingItem.data.start_date || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, start_date: e.target.value } })}
                      />
                    </div>
                    <div className="form-group">
                      <label>종료일</label>
                      <input
                        type="date"
                        className="form-control"
                        value={editingItem.data.end_date || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, end_date: e.target.value } })}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>활동 상세 내용</label>
                    <textarea
                      className="form-control"
                      style={{ height: '120px' }}
                      value={editingItem.data.description}
                      onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, description: e.target.value } })}
                      required
                    />
                  </div>
                </div>
              )}

              {editingItem.type === 'project' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label>프로젝트 명칭</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editingItem.data.title}
                        onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, title: e.target.value } })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>담당 역할</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="예: Backend Developer"
                        value={editingItem.data.role}
                        onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, role: e.target.value } })}
                        required
                      />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label>적용 기술 스택 (쉼표 구분)</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="예: FastAPI, PostgreSQL, Docker"
                        value={editingItem.data.tech_stack}
                        onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, tech_stack: e.target.value } })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>프로젝트 URL / Git 주소</label>
                      <input
                        type="url"
                        className="form-control"
                        placeholder="https://github.com/..."
                        value={editingItem.data.project_url || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, project_url: e.target.value } })}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>프로젝트 상세 설명</label>
                    <textarea
                      className="form-control"
                      style={{ height: '80px' }}
                      value={editingItem.data.description}
                      onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, description: e.target.value } })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>본인의 세부 기여도 및 개발 작업</label>
                    <textarea
                      className="form-control"
                      style={{ height: '80px' }}
                      value={editingItem.data.contribution}
                      onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, contribution: e.target.value } })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>정량적/정성적 성과 (선택)</label>
                    <textarea
                      className="form-control"
                      style={{ height: '60px' }}
                      value={editingItem.data.outcomes || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, outcomes: e.target.value } })}
                    />
                  </div>
                </div>
              )}

              {editingItem.type === 'resume' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label>문서 별칭</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="예: 2026 하반기 토스 지원서 문항 1"
                        value={editingItem.data.title}
                        onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, title: e.target.value } })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>제출 대상 기업명 (선택)</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="예: Toss"
                        value={editingItem.data.target_company || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, target_company: e.target.value } })}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>자기소개서 질문 문항</label>
                    <textarea
                      className="form-control"
                      style={{ height: '70px' }}
                      value={editingItem.data.question}
                      onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, question: e.target.value } })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>작성 답변 본문</label>
                    <textarea
                      className="form-control"
                      style={{ height: '160px' }}
                      value={editingItem.data.answer}
                      onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, answer: e.target.value } })}
                      required
                    />
                  </div>
                </div>
              )}

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={isLoading}>
                {isLoading ? '저장 중...' : '저장 완료'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
