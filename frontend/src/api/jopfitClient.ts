import { AnalyzeRequest, JopFitResult } from '../types/jopfit';

const DEFAULT_API_BASE_URL = 'http://localhost:8000';

export async function analyzeJopfit(request: AnalyzeRequest): Promise<JopFitResult> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;
  const url = `${baseUrl.replace(/\/$/, '')}/api/analyze`;

  // Print debug logs in the browser console depending on the actual mode
  const mode = request.use_mock ? 'mock' : 'llm';
  console.log("[JobFit API] mode", mode);
  console.log("[JobFit API] POST", url);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      let errorMsg = `서버 응답 오류 (상태 코드: ${response.status})`;
      try {
        const errorJson = await response.json();
        if (errorJson.detail) {
          errorMsg = errorJson.detail;
        } else if (errorJson.details) {
          errorMsg = errorJson.details;
        } else if (errorJson.error) {
          errorMsg = `${errorJson.error}: ${errorJson.details || ''}`;
        }
      } catch {
        // Fallback if parsing fails
      }
      throw new Error(errorMsg);
    }

    const data: JopFitResult = await response.json();
    return data;
  } catch (err: any) {
    // If the network call failed with TypeError (Failed to fetch)
    if (err instanceof TypeError || err.message === 'Failed to fetch' || err.message.includes('network')) {
      throw new Error(
        "백엔드 서버에 연결하지 못했습니다. 터미널에서 `uvicorn backend.main:app --port 8000`을 실행한 뒤 `http://127.0.0.1:8000/api/health`가 열리는지 확인해 주세요."
      );
    }
    throw new Error(err.message || '네트워크 오류가 발생하였거나 API 서버가 가동 상태가 아닙니다.');
  }
}
