import os
import re
import json
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

load_dotenv()

def get_llm() -> ChatOpenAI:
    """
    Returns ChatOpenAI instance initialized with environment variables.
    """
    api_key = os.getenv("OPENAI_API_KEY", "")
    model_name = os.getenv("MODEL_NAME", "gpt-4o-mini")
    
    if not api_key:
        raise RuntimeError("OpenAI API Key가 설정되지 않았습니다.")
        
    return ChatOpenAI(
        api_key=api_key,
        model=model_name,
        temperature=0.0
    )

def extract_json_from_response(text: str) -> str:
    """
    Extracts the first JSON block found in a text response.
    Supports markdown blocks or raw JSON.
    """
    # Look for ```json ... ``` or ``` ... ```
    json_block = re.search(r'```(?:json)?\s*(.*?)\s*```', text, re.DOTALL)
    if json_block:
        return json_block.group(1).strip()
    
    # Try finding everything from first { to last }
    first_brace = text.find('{')
    last_brace = text.rfind('}')
    if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
        return text[first_brace:last_brace+1].strip()
        
    return text.strip()

def call_llm_json(prompt: str) -> dict:
    """
    Calls OpenAI API, extracts JSON, and retries once with format correction on JSON failure.
    """
    api_key = os.getenv("OPENAI_API_KEY", "")
    if not api_key:
        raise RuntimeError("OpenAI API Key가 설정되지 않았습니다. .env에 설정하거나 UI에서 입력하세요.")
        
    llm = get_llm()
    
    try:
        response = llm.invoke(prompt)
        text = response.content
        json_str = extract_json_from_response(text)
        try:
            return json.loads(json_str)
        except json.JSONDecodeError as e:
            # Self-correction prompt for retry
            correction_prompt = f"""
이전 요청에 대한 AI 응답이 유효한 JSON 형식으로 파싱되지 않았습니다.
오류 내용: {str(e)}
이전 응답 결과:
{text}

위 결과에서 오직 JSON 데이터 구조체(다른 설명, 주석, 마크다운 없이)만 다시 출력해 주십시오.
"""
            retry_response = llm.invoke(correction_prompt)
            retry_json_str = extract_json_from_response(retry_response.content)
            return json.loads(retry_json_str)
    except Exception as ex:
        # Avoid raising error for parsing issues; return error info dict as requested
        return {"error": "LLM JSON API 호출 실패", "details": str(ex)}
