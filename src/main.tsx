import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { useAppStore } from './store';

function AppInitializer() {
  const initializeWithMockData = useAppStore((state) => state.initializeWithMockData);
  const isInitialized = useAppStore((state) => state.isInitialized);

  useEffect(() => {
    if (!isInitialized) {
      initializeWithMockData();
    }
  }, [isInitialized, initializeWithMockData]);

  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppInitializer />
  </StrictMode>,
);
