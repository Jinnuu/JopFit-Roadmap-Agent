import re
from typing import List
from src.schemas import RiskCheckResult, RiskItem, WeeklyPlan, UserInput

def scan_for_risks(user_input: UserInput, weekly_plans: List[WeeklyPlan]) -> RiskCheckResult:
    """
    Scans user inputs and roadmap for compliance risks:
    - Email address detection
    - Phone number detection
    - Resident registration number (RRN) detection
    - Improper completed-tense verbs used in future roadmap plans
    """
    risks = []
    
    # 1. Text to scan for personal information (only user-supplied profile fields, not company details)
    user_profile_text = f"{user_input.resume_draft}\n{user_input.project_description}\n{user_input.tech_stack}"
    
    # 1.1 Detect Email
    email_pattern = re.compile(r'[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+')
    emails = email_pattern.findall(user_profile_text)
    if emails:
        risks.append(RiskItem(
            category="개인정보 노출 위험",
            description=f"이메일 주소 패턴이 감지되었습니다: {', '.join(set(emails))}",
            severity="중",
            remedy="자기소개서나 공개 포트폴리오 제출 시 구체적인 개인 이메일은 OOO@OOO.com 등으로 마스킹 처리하십시오."
        ))
        
    # 1.2 Detect Phone Number
    phone_pattern = re.compile(r'\b(01[016789])[-. ]?(\d{3,4})[-. ]?(\d{4})\b')
    phones = phone_pattern.findall(user_profile_text)
    if phones:
        phone_strs = [f"{p[0]}-{p[1]}-{p[2]}" for p in phones]
        risks.append(RiskItem(
            category="개인정보 노출 위험",
            description=f"전화번호 패턴이 감지되었습니다: {', '.join(set(phone_strs))}",
            severity="상",
            remedy="자기소개서나 공개 이력서에 연락처 기재 시 010-XXXX-XXXX 형식으로 마스킹 처리할 것을 권장합니다."
        ))
        
    # 1.3 Detect Resident Registration Number (RRN)
    rrn_pattern = re.compile(r'\b\d{6}[- ]?[1-4]\d{6}\b')
    rrns = rrn_pattern.findall(user_profile_text)
    if rrns:
        risks.append(RiskItem(
            category="개인정보 노출 위험 (심각)",
            description="주민등록번호 형식의 일련번호가 감지되었습니다. 이는 심각한 개인정보 노출에 해당합니다.",
            severity="상",
            remedy="이력서나 자기소개서에 주민등록번호는 절대 기입해서는 안 되며 즉시 삭제해주십시오."
        ))
        
    # 2. Detect roadmap completion wording (presenting future plans as completed experience)
    completed_keywords = ["완료", "성공", "해결했음", "구현했음", "개발완료", "구현완료", "완성", "완료함"]
    roadmap_completion_issues = []
    for plan in weekly_plans:
        for kw in completed_keywords:
            if kw in plan.goal or kw in plan.detail:
                roadmap_completion_issues.append(f"{plan.week}주차 ({kw})")
                break
                
    if roadmap_completion_issues:
        risks.append(RiskItem(
            category="미실행 계획의 완료 오인 위험",
            description=f"로드맵 주차별 수행 계획 내에 완료 표현이 탐지되었습니다: {', '.join(roadmap_completion_issues)}. 로드맵은 미래 수행 예정 사항입니다.",
            severity="상",
            remedy="자기소개서에 이 내용을 옮겨 적을 때는 '진행 예정인 로드맵'으로 정직하게 표현하고, 이미 마친 프로젝트 성과인 것처럼 과장하지 마십시오."
        ))
        
    # Determine overall risk level
    overall_level = "안전"
    if any(r.severity == "상" for r in risks):
        overall_level = "위험"
    elif any(r.severity == "중" for r in risks):
        overall_level = "주의"
        
    safe_usage_note = (
        "자기소개서 및 이력서는 개인정보 노출에 매우 민감하므로 제출 전 마스킹 상태를 철저히 점검하십시오. "
        "또한 본 로드맵은 미래의 성장을 위한 실행 계획서이므로, 포트폴리오 기술 시 완료 계획임을 명시하여 신뢰성을 확보하시길 권장합니다."
    )
    
    return RiskCheckResult(
        overall_risk_level=overall_level,
        risks=risks,
        safe_usage_note=safe_usage_note
    )
