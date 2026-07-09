import { useState } from 'react';
import { Layout } from './components/Layout';
import { InputPanel } from './components/InputPanel';
import { ResultModal } from './components/ResultModal';
import { AnalyzeRequest, JopFitResult } from './types/jopfit';
import { analyzeJopfit } from './api/jopfitClient';

const enableLlmMode = import.meta.env.VITE_ENABLE_LLM_MODE === 'true';

function App() {
  const [result, setResult] = useState<JopFitResult | null>(null);
  const [isResultOpen, setIsResultOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeMock, setActiveMock] = useState<boolean>(true);

  const handleAnalyzeSubmit = async (requestData: AnalyzeRequest) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setIsResultOpen(false);

    // If developer LLM mode is enabled, respect user's developer choices. Otherwise, lock to mock mode.
    const requestPayload: AnalyzeRequest = enableLlmMode
      ? requestData
      : {
          ...requestData,
          use_mock: true,
          api_key: '',
        };

    // Update Layout's status pill in real-time
    setActiveMock(!!requestPayload.use_mock);

    try {
      const apiResult = await analyzeJopfit(requestPayload);
      setResult(apiResult);
      setIsResultOpen(true);
    } catch (err: any) {
      setError(err.message || '분석을 진행하는 중 오류가 발생하였습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout useMock={activeMock}>
      <InputPanel 
        onSubmit={handleAnalyzeSubmit} 
        isLoading={isLoading} 
      />
      
      {error && (
        <div className="inline-alert" style={{ maxWidth: '860px', margin: '18px auto 0 auto', width: '100%' }}>
          <strong>오류가 발생하였습니다:</strong> {error}
        </div>
      )}

      <ResultModal 
        result={result} 
        open={isResultOpen} 
        onClose={() => setIsResultOpen(false)} 
      />
    </Layout>
  );
}

export default App;
