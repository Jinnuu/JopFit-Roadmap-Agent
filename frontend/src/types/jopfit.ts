export interface AnalyzeRequest {
  position: string;
  job_posting: string;
  company_values: string;
  resume_draft: string;
  project_description: string;
  tech_stack: string;
  desired_duration: number;
  weekly_hours: number;
  goal: string;
  use_mock: boolean;
  api_key?: string;
}

export interface JobRequirement {
  requirement: string;
  importance: string;
  evidence: string;
}

export interface FitGapItem {
  requirement: string;
  user_experience: string;
  status: string; // "Strong Fit", "Partial Fit", "Gap"
  action_item: string;
}

export interface FitGapAnalysis {
  summary: string;
  strong_fits: FitGapItem[];
  partial_fits: FitGapItem[];
  gaps: FitGapItem[];
  top_priorities: string[];
}

export interface WeeklyPlan {
  week: number;
  goal: string;
  detail: string;
}

export interface Roadmap {
  recommended_project_title: string;
  project_summary: string;
  duration_weeks: number;
  difficulty: string; // "상", "중", "하"
  reason_for_recommendation: string;
  weekly_plan: WeeklyPlan[];
  portfolio_outputs: string[];
  resume_reflection_points: string[];
  interview_questions: string[];
}

export interface RiskItem {
  category: string;
  description: string;
  severity: string; // "상", "중", "하"
  remedy: string;
}

export interface RiskCheckResult {
  overall_risk_level: string; // "안전", "주의", "위험"
  risks: RiskItem[];
  safe_usage_note: string;
}

export interface ReferencedRagDocument {
  title: string;
  path: string;
  snippet: string;
  score: number;
}

export interface JopFitResult {
  job_summary: string;
  user_summary: string;
  extracted_requirements: JobRequirement[];
  matched_experiences: string[];
  fit_gap_analysis: FitGapAnalysis;
  roadmap: Roadmap;
  risk_checks: RiskCheckResult;
  evidence_coverage_rate: number;
  final_note: string;
  referenced_rag_documents: ReferencedRagDocument[];
}
export interface AnalyzeErrorResponse {
  error: string;
  details: string;
}
