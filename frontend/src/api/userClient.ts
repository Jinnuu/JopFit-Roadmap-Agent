const DEFAULT_API_BASE_URL = 'http://localhost:8000';

function getBaseUrl() {
  return (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '');
}

export function getToken(): string | null {
  return localStorage.getItem('jobfit_access_token');
}

export function setToken(token: string) {
  localStorage.setItem('jobfit_access_token', token);
}

export function removeToken() {
  localStorage.removeItem('jobfit_access_token');
}

// Request helper to handle authorization headers and 401 redirection automatically
async function request(path: string, options: RequestInit = {}): Promise<any> {
  const url = `${getBaseUrl()}${path}`;
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    removeToken();
    // Dispatch a custom event to notify App.tsx to redirect to login
    window.dispatchEvent(new Event('auth-unauthorized'));
    throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
  }

  if (response.status === 204) {
    return null;
  }

  if (!response.ok) {
    let errorMsg = `서버 오류 (상태 코드: ${response.status})`;
    try {
      const errData = await response.json();
      if (errData.detail) {
        errorMsg = errData.detail;
      }
    } catch {
      // Ignored
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

// Auth API
export const authApi = {
  register: (body: any) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: any) => request('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  getMe: () => request('/api/auth/me', { method: 'GET' }),
};

// Experience API
export const experienceApi = {
  list: () => request('/api/experiences'),
  get: (id: string) => request(`/api/experiences/${id}`),
  create: (body: any) => request('/api/experiences', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: any) => request(`/api/experiences/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id: string) => request(`/api/experiences/${id}`, { method: 'DELETE' }),
};

// Project API
export const projectApi = {
  list: () => request('/api/projects'),
  get: (id: string) => request(`/api/projects/${id}`),
  create: (body: any) => request('/api/projects', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: any) => request(`/api/projects/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id: string) => request(`/api/projects/${id}`, { method: 'DELETE' }),
};

// ResumeDraft API
export const resumeDraftApi = {
  list: () => request('/api/resume-drafts'),
  get: (id: string) => request(`/api/resume-drafts/${id}`),
  create: (body: any) => request('/api/resume-drafts', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: any) => request(`/api/resume-drafts/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id: string) => request(`/api/resume-drafts/${id}`, { method: 'DELETE' }),
};

// Preferences API
export const preferenceApi = {
  listCompanies: () => request('/api/preferences/companies'),
  createCompany: (body: any) => request('/api/preferences/companies', { method: 'POST', body: JSON.stringify(body) }),
  deleteCompany: (id: string) => request(`/api/preferences/companies/${id}`, { method: 'DELETE' }),
  
  listRoles: () => request('/api/preferences/roles'),
  createRole: (body: any) => request('/api/preferences/roles', { method: 'POST', body: JSON.stringify(body) }),
  deleteRole: (id: string) => request(`/api/preferences/roles/${id}`, { method: 'DELETE' }),

  listJobPostings: () => request('/api/preferences/job-postings'),
  createJobPosting: (body: any) => request('/api/preferences/job-postings', { method: 'POST', body: JSON.stringify(body) }),
  deleteJobPosting: (id: string) => request(`/api/preferences/job-postings/${id}`, { method: 'DELETE' }),
};

// Analyses API
export const analysisApi = {
  list: () => request('/api/analyses'),
  get: (id: string) => request(`/api/analyses/${id}`),
  create: (body: any) => request('/api/analyses', { method: 'POST', body: JSON.stringify(body) }),
  delete: (id: string) => request(`/api/analyses/${id}`, { method: 'DELETE' }),
};

// Roadmap API
export const roadmapApi = {
  list: () => request('/api/roadmaps'),
  get: (id: string) => request(`/api/roadmaps/${id}`),
  createFromAnalysis: (analysisId: string, body: { start_date: string }) => request(`/api/roadmaps/from-analysis/${analysisId}`, { method: 'POST', body: JSON.stringify(body) }),
  updateTaskStatus: (roadmapId: string, taskId: string, body: { status: string }) => request(`/api/roadmaps/${roadmapId}/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (roadmapId: string) => request(`/api/roadmaps/${roadmapId}`, { method: 'DELETE' }),
};

// Notification API
export const notificationApi = {
  list: () => request('/api/notifications'),
  read: (id: string) => request(`/api/notifications/${id}/read`, { method: 'PATCH' }),
};

// Recommendation API
export const recommendationApi = {
  roles: () => request('/api/recommend/roles', { method: 'POST' }),
  companies: () => request('/api/recommend/companies', { method: 'POST' }),
  nextRoadmap: () => request('/api/recommend/next-roadmap', { method: 'POST' }),
};

// RAG API
export const ragApi = {
  list: () => request('/api/rag/sources'),
  create: (body: any) => request('/api/rag/sources', { method: 'POST', body: JSON.stringify(body) }),
  delete: (id: string) => request(`/api/rag/sources/${id}`, { method: 'DELETE' }),
};
