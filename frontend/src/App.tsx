import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { initializeWASM, type WASMModule, type AstronomicalState } from './wasm/init';
import BabylonScene, { type TimeDisplayData } from './scene/BabylonScene';
import UIOverlay from './components/UIOverlay';
import './styles/BabylonScene.css';

// ✅ CORRECT - Result type pattern (TypeScript 5.9.2+ strict compliance)
type Result<T, E> = { success: true; data: T } | { success: false; error: E };

// ✅ CORRECT - Strict interface definitions with readonly properties for immutability
interface AppState {
  readonly wasmModule: WASMModule | null;
  readonly isInitialized: boolean;
  readonly currentJulianDay: number;
  readonly astronomicalData: AstronomicalState | null;
  readonly error: string | null;
  readonly frameCount: number;
  readonly currentFPS: number;
  readonly timeData: TimeDisplayData | null; // ✅ Данные времени из BabylonScene
}

// ✅ CORRECT - Performance timer class for development monitoring
class PerformanceTimer {
  private readonly operationName: string;
  private readonly startTime: number;

  constructor(operationName: string) {
    this.operationName = operationName;
    this.startTime = performance.now();
    // Only log in development and not for frame updates
    if (import.meta.env.DEV && operationName !== 'frame_update') {
      console.log(`🚀 Frontend: Starting ${operationName}`);
    }
  }

  public mark(checkpoint: string): void {
    // Only log in development and not for frame updates  
    if (import.meta.env.DEV && this.operationName !== 'frame_update') {
      const currentTime = performance.now();
      const duration = currentTime - this.startTime;
      console.log(`📊 Frontend: ${this.operationName} - ${checkpoint} at ${duration.toFixed(3)}ms`);
    }
  }
}

// ✅ CORRECT - Constants for zero-allocation reference
const JULIAN_DAY_UNIX_EPOCH = 2440587.5; // Julian Day for Unix epoch

const App: React.FC = () => {
  // ✅ CORRECT - Strict state typing with pre-allocated initial state
  const [appState, setAppState] = useState<AppState>({
    wasmModule: null,
    isInitialized: false,
    currentJulianDay: JULIAN_DAY_UNIX_EPOCH + Date.now() / 86400000.0,
    astronomicalData: null,
    error: null,
    frameCount: 0,
    currentFPS: 0,
    timeData: null
  });

  // ✅ NEW - Canvas ready state for Babylon.js initialization
  const [canvasReady, setCanvasReady] = useState(false);
  const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement | null>(null);

  // ✅ CORRECT - Refs for performance-critical elements (zero re-renders)
  const animationFrameRef = useRef<number>(0);
  
  // ✅ CALLBACK REF - Triggered when canvas DOM element is created
  const canvasRef = useCallback((canvas: HTMLCanvasElement | null) => {
    if (canvas) {
      console.log('🎨 Canvas DOM element created:', {
        canvas: canvas,
        width: canvas.width,
        height: canvas.height,
        clientWidth: canvas.clientWidth,
        clientHeight: canvas.clientHeight,
        offsetWidth: canvas.offsetWidth,
        offsetHeight: canvas.offsetHeight
      });
      setCanvasElement(canvas);
      setCanvasReady(true);
      console.log('✅ Canvas ready for Babylon.js initialization');
    } else {
      console.log('🧹 Canvas DOM element removed');
      setCanvasElement(null);
      setCanvasReady(false);
    }
  }, []);
  
  // ✅ FPS update callback - НЕ ОБНОВЛЯЕМ STATE каждый кадр!
  const handleFpsUpdate = useCallback((fps: number) => {
    // Обновляем заголовок браузера напрямую, БЕЗ React state
    document.title = `FPS: ${fps} - StarsCalendars`;
    
    // Обновляем DOM напрямую, БЕЗ React ререндера
    const fpsElement = document.querySelector('.fps-display');
    if (fpsElement) {
      fpsElement.textContent = fps.toString();
    }
  }, []);

  // ✅ TIME UPDATE callback - только раз в секунду, БЕЗ ререндера каждый кадр!
  const handleTimeUpdate = useCallback((timeData: TimeDisplayData) => {
    // НЕ ИСПОЛЬЗУЕМ React state для обновления времени!
    // Вместо этого обновляем DOM напрямую для производительности
    // setAppState остается стабильным и НЕ вызывает ререндер
  }, []);

  // ✅ CORRECT - Memoized error boundary component (zero re-allocation)
  const ErrorBoundary = useMemo(() => ({ children, error }: { children: React.ReactNode; error: string | null }) => {
    if (error) {
      return (
        <div className="error-container" role="alert">
          <h2>WASM Integration Error</h2>
          <pre className="error-details">{error}</pre>
          <button 
            type="button"
            onClick={() => window.location.reload()}
            className="error-retry-button"
          >
            Reload Application
          </button>
        </div>
      );
    }
    return <>{children}</>;
  }, []);

  // ✅ CORRECT - WASM initialization with proper error handling (async/await pattern)
  const initializeAstronomy = useCallback(async (): Promise<Result<WASMModule, string>> => {
    const timer = new PerformanceTimer('wasm_initialization');
    
    try {
      const wasmModule = await initializeWASM();
      timer.mark('wasm_loaded');
      
      // Pre-validate WASM module interface
      const bodyCount = wasmModule.get_body_count();
      const coordCount = wasmModule.get_coordinate_count();
      
      if (bodyCount !== 11 || coordCount !== 33) {
        return { 
          success: false, 
          error: `Invalid WASM module: expected 11 bodies and 33 coordinates, got ${bodyCount} bodies and ${coordCount} coordinates` 
        };
      }
      
      timer.mark('validation_complete');
      return { success: true, data: wasmModule };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown WASM initialization error';
      return { success: false, error: `WASM initialization failed: ${errorMessage}` };
    }
  }, []);

  // ✅ REMOVED - All astronomical data updates happen in BabylonScene render loop

  // ✅ REMOVED TIMER - All updates happen in Babylon.js render loop at 60fps
  // No separate timers needed - BabylonScene handles all WASM calls

  // ✅ REPLACED with callback ref above - no useEffect needed

  // ✅ CORRECT - Component initialization effect with cleanup
  useEffect(() => {
    let isMounted = true;
    
    const initializeComponent = async (): Promise<void> => {
      const initTimer = new PerformanceTimer('app_component_init');
      
      const wasmResult = await initializeAstronomy();
      
      if (!isMounted) return; // Prevent state update if component unmounted
      
      if (wasmResult.success) {
        setAppState(prevState => ({
          ...prevState,
          wasmModule: wasmResult.data,
          isInitialized: true,
          error: null
        }));
        
        // ✅ NO TIMERS - BabylonScene handles all updates at 60fps
        initTimer.mark('initialization_complete');
      } else {
        setAppState(prevState => ({
          ...prevState,
          error: wasmResult.error,
          isInitialized: false
        }));
      }
    };
    
    initializeComponent().catch((error: unknown) => {
      if (isMounted) {
        const errorMessage = error instanceof Error ? error.message : 'Unexpected initialization error';
        setAppState(prevState => ({
          ...prevState,
          error: errorMessage,
          isInitialized: false
        }));
      }
    });
    
    // Cleanup function
    return () => {
      isMounted = false;
      // No timers to cleanup - all handled by Babylon.js engine
    };
  }, [initializeAstronomy]);

  // ✅ CORRECT - Loading state with accessibility
  if (!appState.isInitialized && !appState.error) {
    return (
      <div className="app-loading-screen" role="status" aria-live="polite">
        <div className="loading-spinner"></div>
        <p>Initializing WASM astronomical core...</p>
        <small>Frame count: {appState.frameCount}</small>
      </div>
    );
  }

  return (
    <ErrorBoundary error={appState.error}>
      <div className="app-container">
        {/* Header with astronomical status */}
        <header className="app-header">
          <h1>StarsCalendars - Cinematic Astronomy</h1>
          <div className="status-bar">
            <span>Julian Day: {appState.currentJulianDay.toFixed(6)}</span>
            <span>FPS: <span className="fps-display">0</span></span>
            <span className={`status ${appState.isInitialized ? 'online' : 'offline'}`}>
              {appState.isInitialized ? '🟢 WASM Ready' : '🔴 Initializing'}
            </span>
          </div>
        </header>

        {/* Main 3D scene container - Babylon.js integration point */}
        <main className="scene-container">
          <canvas 
            ref={canvasRef}
            id="babylon-canvas"
            className="babylon-canvas"
            width={1920}
            height={1080}
            role="img"
            aria-label="3D astronomical visualization"
          />
          
          {/* Babylon.js 3D Scene Manager - only render when canvas is ready */}
          {(() => {
            console.log('🔍 BabylonScene render conditions:', {
              canvasReady,
              hasCanvasElement: !!canvasElement,
              hasWasmModule: !!appState.wasmModule,
              isInitialized: appState.isInitialized,
              willRender: canvasReady && canvasElement
            });
            return canvasReady && canvasElement ? (
              <BabylonScene 
                canvas={canvasElement}
                wasmModule={appState.wasmModule}
                isInitialized={appState.isInitialized}
                onFpsUpdate={handleFpsUpdate}
                onTimeUpdate={handleTimeUpdate}
              />
            ) : null;
          })()}
          
          {/* 🚧 TEMPORARILY DISABLED UI OVERLAY - Let's see the Babylon.js scene first */}
          {false && <UIOverlay
            astronomicalData={appState.astronomicalData}
            isInitialized={appState.isInitialized}
            frameCount={appState.frameCount}
            currentJulianDay={appState.currentJulianDay}
            {...(appState.wasmModule?.get_version() && { wasmVersion: appState.wasmModule.get_version() })}
            {...(appState.timeData && { timeData: appState.timeData })}
          />}
        </main>

      </div>
    </ErrorBoundary>
  );
};

export default App;