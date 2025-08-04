import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { initializeWASM, createPositionsView, extractCelestialPositions, type WASMModule, type AstronomicalState } from './wasm/init';
import BabylonScene from './scene/BabylonScene';
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
}

// ✅ CORRECT - Performance timer class for development monitoring
class PerformanceTimer {
  private readonly operationName: string;
  private readonly startTime: number;

  constructor(operationName: string) {
    this.operationName = operationName;
    this.startTime = performance.now();
    console.log(`🚀 Frontend: Starting ${operationName}`);
  }

  public mark(checkpoint: string): void {
    const currentTime = performance.now();
    const duration = currentTime - this.startTime;
    console.log(`📊 Frontend: ${this.operationName} - ${checkpoint} at ${duration.toFixed(3)}ms`);
  }
}

// ✅ CORRECT - Constants for zero-allocation reference (60fps optimization)
const FRAME_TARGET_MS = 16.67; // Exactly 60fps requirement
const JULIAN_DAY_UNIX_EPOCH = 2440587.5; // Julian Day for Unix epoch

const App: React.FC = () => {
  // ✅ CORRECT - Strict state typing with pre-allocated initial state
  const [appState, setAppState] = useState<AppState>({
    wasmModule: null,
    isInitialized: false,
    currentJulianDay: JULIAN_DAY_UNIX_EPOCH + Date.now() / 86400000.0,
    astronomicalData: null,
    error: null,
    frameCount: 0
  });

  // ✅ CORRECT - Refs for performance-critical elements (zero re-renders)
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);

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

  // ✅ CRITICAL: Exactly one WASM call per frame (O(1) performance requirement)
  const updateAstronomicalPositions = useCallback((wasmModule: WASMModule, currentTime: number): void => {
    const frameTimer = new PerformanceTimer('frame_update');
    
    // Convert milliseconds to Julian Day (zero-allocation calculation)
    const julianDay = JULIAN_DAY_UNIX_EPOCH + currentTime / 86400000.0;
    
    // ✅ CRITICAL: Exactly ONE compute_all() call per frame
    const positionsPtr = wasmModule.compute_all(julianDay);
    
    // Check for null pointer (calculation failure)
    if (positionsPtr === 0) {
      console.warn('⚠️ WASM calculation returned null pointer');
      return;
    }
    
    // Zero-copy access via Float64Array view to WASM memory
    const positionsResult = createPositionsView(wasmModule, positionsPtr);
    if (!positionsResult.success) {
      throw new Error(`Failed to create positions view: ${positionsResult.error.message}`);
    }
    
    // Extract all celestial positions using the dedicated function
    const astronomicalData = extractCelestialPositions(positionsResult.data, currentTime);
    
    // Update state with new astronomical data (single state update per frame)
    setAppState(prevState => ({
      ...prevState,
      currentJulianDay: julianDay,
      astronomicalData,
      frameCount: prevState.frameCount + 1
    }));
    
    frameTimer.mark('positions_updated');
  }, []);

  // ✅ CORRECT - 60fps animation loop with performance monitoring
  const startAnimationLoop = useCallback((wasmModule: WASMModule): void => {
    const animate = (currentTime: number): void => {
      // Frame rate limiting to exact 60fps
      if (currentTime - lastFrameTimeRef.current >= FRAME_TARGET_MS) {
        updateAstronomicalPositions(wasmModule, currentTime);
        lastFrameTimeRef.current = currentTime;
      }
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [updateAstronomicalPositions]);

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
        
        startAnimationLoop(wasmResult.data);
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
      if (animationFrameRef.current !== 0) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [initializeAstronomy, startAnimationLoop]);

  // ✅ CORRECT - Loading state with accessibility
  if (!appState.isInitialized && !appState.error) {
    return (
      <div className="loading-container" role="status" aria-live="polite">
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
            <span>Frames: {appState.frameCount}</span>
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
          
          {/* Babylon.js 3D Scene Manager */}
          <BabylonScene 
            canvas={canvasRef.current}
            astronomicalData={appState.astronomicalData}
            isInitialized={appState.isInitialized}
          />
          
          {/* HTML/CSS overlay for performance-critical GUI elements */}
          <div className="ui-overlay">
            {appState.astronomicalData && (
              <div className="celestial-info">
                <div className="celestial-body">
                  <h3>Sun (Geocentric)</h3>
                  <p>X: {appState.astronomicalData.sun.x.toFixed(6)} AU</p>
                  <p>Y: {appState.astronomicalData.sun.y.toFixed(6)} AU</p>
                  <p>Z: {appState.astronomicalData.sun.z.toFixed(6)} AU</p>
                  <p>Distance: {appState.astronomicalData.sun.distance.toFixed(6)} AU</p>
                </div>
                <div className="celestial-body">
                  <h3>Earth (Origin)</h3>
                  <p>Position: (0, 0, 0) - Geocentric Scene</p>
                </div>
                <div className="celestial-body">
                  <h3>Moon (Geocentric)</h3>
                  <p>X: {appState.astronomicalData.moon.x.toFixed(6)} AU</p>
                  <p>Y: {appState.astronomicalData.moon.y.toFixed(6)} AU</p>
                  <p>Z: {appState.astronomicalData.moon.z.toFixed(6)} AU</p>
                  <p>Distance: {appState.astronomicalData.moon.distance.toFixed(6)} AU</p>
                </div>
                <div className="quantum-resonance">
                  <h3>Quantum Resonance</h3>
                  <p>{appState.astronomicalData.quantumResonance.toFixed(4)}</p>
                  <div className="resonance-bar">
                    <div 
                      className="resonance-fill"
                      style={{ width: `${appState.astronomicalData.quantumResonance * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Footer with performance metrics */}
        <footer className="app-footer">
          <p>
            High-precision astronomical calculations powered by Rust WASM
          </p>
          <div className="performance-metrics">
            <span>Target: 60fps</span>
            <span>WASM Version: {appState.wasmModule?.get_version() ?? 'Loading...'}</span>
            <span>Bodies: {appState.wasmModule?.get_body_count() ?? 'N/A'}</span>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
};

export default App;