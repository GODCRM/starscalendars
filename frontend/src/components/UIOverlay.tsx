/**
 * HTML/CSS UI Overlay System for StarsCalendars
 * Implements performance-optimized overlay strategy over Babylon.js 3D scene
 * 
 * ✅ CORRECT Pattern: HTML/CSS overlay >> Babylon.js GUI for performance
 * ✅ 10-Language Support
 * ✅ Zero-allocation updates for 60fps compatibility
 */

import React, { useCallback, useMemo, useState } from 'react';
import { useLanguage, type SupportedLanguage } from '../i18n/LanguageManager';
import type { AstronomicalState } from '../wasm/init';
import './UIOverlay.css';

// ✅ CORRECT - Import time display data from BabylonScene
import type { TimeDisplayData } from '../scene/BabylonScene';

// ✅ CORRECT - Strict interface for overlay props
interface UIOverlayProps {
  readonly astronomicalData: AstronomicalState | null;
  readonly isInitialized: boolean;
  readonly frameCount: number;
  readonly currentJulianDay: number;
  readonly wasmVersion?: string;
  readonly timeData?: TimeDisplayData; // ✅ Данные времени из референсной сцены
}

// ✅ CORRECT - Performance timer for UI operations
class UIPerformanceTimer {
  private readonly operationName: string;
  private readonly startTime: number;

  constructor(operationName: string) {
    this.operationName = operationName;
    this.startTime = performance.now();
  }

  public mark(checkpoint: string): void {
    const currentTime = performance.now();
    const duration = currentTime - this.startTime;
    if (duration > 5) { // Only log if operation takes >5ms
      console.log(`🎨 UI: ${this.operationName} - ${checkpoint} at ${duration.toFixed(3)}ms`);
    }
  }
}

// ✅ CORRECT - Language selector component with cultural awareness
const LanguageSelector: React.FC = React.memo(() => {
  const { currentLanguage, setLanguage, supportedLanguages, t, isRTL } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageChange = useCallback(async (languageCode: SupportedLanguage) => {
    const timer = new UIPerformanceTimer('language_selector_change');
    
    await setLanguage(languageCode);
    setIsOpen(false);
    
    timer.mark('language_changed');
  }, [setLanguage]);

  // ✅ CORRECT - Pre-computed language list for zero-allocation rendering
  const languageOptions = useMemo(() => {
    return supportedLanguages.map(lang => {
      // Language display names with native script
      const displayNames: Record<SupportedLanguage, string> = {
        ru: '🇷🇺 Русский',
        en: '🇺🇸 English',
        zh: '🇨🇳 中文',
        es: '🇪🇸 Español', 
        hi: '🇮🇳 हिन्दी',
        pt: '🇵🇹 Português',
        de: '🇩🇪 Deutsch',
        fr: '🇫🇷 Français',
        ja: '🇯🇵 日本語',
        hy: '🇦🇲 Հայերեն'
      };
      
      return {
        code: lang,
        display: displayNames[lang]
      };
    });
  }, [supportedLanguages]);

  return (
    <div className={`language-selector ${isRTL ? 'rtl' : 'ltr'}`}>
      <button 
        type="button"
        className="language-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t('ui-language')}
        aria-expanded={isOpen}
      >
        🌍 {currentLanguage.toUpperCase()}
      </button>
      
      {isOpen && (
        <div className="language-dropdown">
          {languageOptions.map(({ code, display }) => (
            <button
              key={code}
              type="button"
              className={`language-option ${code === currentLanguage ? 'active' : ''}`}
              onClick={() => handleLanguageChange(code)}
            >
              {display}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

LanguageSelector.displayName = 'LanguageSelector';

// ✅ CORRECT - Celestial data display with cultural number formatting
const CelestialDataPanel: React.FC<{ 
  readonly data: AstronomicalState;
  readonly julianDay: number;
}> = React.memo(({ data, julianDay }) => {
  const { t, currentLanguage, culturalAdaptations } = useLanguage();

  // ✅ CORRECT - Cultural number formatting based on language
  const formatNumber = useCallback((value: number, precision: number = 6): string => {
    const formatOptions: Intl.NumberFormatOptions = {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision
    };

    // Apply cultural numeral system
    switch (culturalAdaptations.numeralSystem) {
      case 'arabic':
        return new Intl.NumberFormat('ar', formatOptions).format(value);
      case 'devanagari':
        return new Intl.NumberFormat('hi-IN-u-nu-deva', formatOptions).format(value);
      case 'chinese':
        return new Intl.NumberFormat('zh-CN', formatOptions).format(value);
      case 'japanese':
        return new Intl.NumberFormat('ja-JP', formatOptions).format(value);
      default:
        return new Intl.NumberFormat('en-US', formatOptions).format(value);
    }
  }, [culturalAdaptations.numeralSystem]);

  return (
    <div className="celestial-data-panel">
      <div className="celestial-body-card sun-card">
        <h3>{t('astronomical-sun-position')}</h3>
        <div className="coordinates">
          <p>X: {formatNumber(data.sun.x)} AU</p>
          <p>Y: {formatNumber(data.sun.y)} AU</p>
          <p>Z: {formatNumber(data.sun.z)} AU</p>
          <p>{t('astronomical-distance', { distance: formatNumber(data.sun.distance) })}</p>
        </div>
      </div>

      <div className="celestial-body-card earth-card">
        <h3>{t('astronomical-earth-position')}</h3>
        <p>{t('astronomical-geocentric-view')}</p>
        <div className="coordinates">
          <p>X: {formatNumber(0)} AU</p>
          <p>Y: {formatNumber(0)} AU</p>
          <p>Z: {formatNumber(0)} AU</p>
        </div>
      </div>

      <div className="celestial-body-card moon-card">
        <h3>{t('astronomical-moon-position')}</h3>
        <div className="coordinates">
          <p>X: {formatNumber(data.moon.x)} AU</p>
          <p>Y: {formatNumber(data.moon.y)} AU</p>
          <p>Z: {formatNumber(data.moon.z)} AU</p>
          <p>{t('astronomical-distance', { distance: formatNumber(data.moon.distance) })}</p>
        </div>
      </div>

      {/* ✅ REMOVED: Quantum resonance не нужен! */}

      <div className="time-info">
        <p>{t('astronomical-julian-day', { day: formatNumber(julianDay, 6) })}</p>
        <p>{t('astronomical-current-time', { 
          time: new Date().toLocaleString(currentLanguage)
        })}</p>
      </div>
    </div>
  );
});

CelestialDataPanel.displayName = 'CelestialDataPanel';

// ✅ CORRECT - Performance metrics with cultural formatting
const PerformancePanel: React.FC<{
  readonly frameCount: number;
  readonly wasmVersion?: string;
}> = React.memo(({ frameCount, wasmVersion }) => {
  const { t } = useLanguage();
  const [currentFPS, setCurrentFPS] = useState(60);

  // ✅ CORRECT - FPS calculation with minimal overhead
  React.useEffect(() => {
    let lastTime = performance.now();
    let frameCounter = 0;
    
    const updateFPS = () => {
      const currentTime = performance.now();
      frameCounter++;
      
      if (currentTime - lastTime >= 1000) { // Update every second
        setCurrentFPS(Math.round(frameCounter));
        frameCounter = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(updateFPS);
    };
    
    requestAnimationFrame(updateFPS);
  }, []);

  return (
    <div className="performance-panel">
      <h4>{t('ui-performance')}</h4>
      <div className="performance-metrics">
        <div className="metric">
          <span className="metric-label">{t('ui-frame-rate')}</span>
          <span className={`metric-value ${currentFPS >= 55 ? 'good' : currentFPS >= 30 ? 'ok' : 'poor'}`}>
            {currentFPS} FPS
          </span>
        </div>
        <div className="metric">
          <span className="metric-label">{t('perf-target-fps')}</span>
          <span className="metric-value">60 FPS</span>
        </div>
        <div className="metric">
          <span className="metric-label">Frames</span>
          <span className="metric-value">{frameCount.toLocaleString()}</span>
        </div>
        {wasmVersion && (
          <div className="metric">
            <span className="metric-label">{t('ui-wasm-version')}</span>
            <span className="metric-value">{wasmVersion}</span>
          </div>
        )}
      </div>
    </div>
  );
});

PerformancePanel.displayName = 'PerformancePanel';

// ✅ КРИТИЧЕСКИЙ КОМПОНЕНТ: Quantum Time Display из референсной сцены
const QuantumTimePanel: React.FC<{
  readonly timeData: TimeDisplayData;
}> = React.memo(({ timeData }) => {

  // ✅ Функции фаз Луны (из референса строки 1208-1227)
  const getMoonPhaseText = useCallback((phase: number): string => {
    switch (phase) {
      case 0: return 'новолуние';
      case 1: return 'растущий серп';
      case 2: return 'первая четверть';
      case 3: return 'растущая Луна';
      case 4: return 'полнолуние';
      case 5: return 'убывающая Луна';
      case 6: return 'последняя четверть';
      case 7: return 'убывающий серп';
      default: return 'неизвестно';
    }
  }, []);

  const getDayNumber = useCallback((dayNum: number): string => {
    const daysNum = ["первый","второй","третий","четвертый","пятый","шестой","седьмой","восьмой","девятый","десятый","одиннадцатый","двенадцатый","тринадцатый","четырнадцатый","пятнадцатый","шестнадцатый","семнадцатый","восемнадцатый","девятнадцатый","двадцатый"];
    return daysNum[dayNum] || `${dayNum + 1}-й`;
  }, []);

  return (
    <div className="quantum-time-panel">
      {/* ✅ КВАНТОВОЕ ВРЕМЯ - точно как в референсе */}
      <div className="quantum-time-display">
        <h3 className="quantum-title">Квантовое время</h3>
        <div className="quantum-value">{timeData.quantumTime}</div>
      </div>

      {/* ✅ ТЕКУЩЕЕ ВРЕМЯ - точно как в референсе (строки 1337-1345) */}
      <div className="current-time-display">
        <div className="current-time">{timeData.currentTime}</div>
      </div>

      {/* ✅ АСТРОНОМИЧЕСКАЯ ИНФОРМАЦИЯ - как в референсе */}
      <div className="astronomical-info">
        <div className="earth-info">
          <p>{timeData.earthDirection ? 'Восходящее' : 'Нисходящее'} движение активности природных сил.</p>
        </div>

        <div className="moon-info">
          <h4>Луна:</h4>
          <p>возраст {timeData.moonAge.toString()} д., {getMoonPhaseText(timeData.moonPhase)},</p>
          <p>{getDayNumber(timeData.moonDays)} день движения Луны {timeData.moonDirection ? 'к апогею.' : 'к перигею.'}</p>
        </div>
      </div>
    </div>
  );
});

QuantumTimePanel.displayName = 'QuantumTimePanel';

// ✅ CORRECT - Main UI Overlay component
const UIOverlay: React.FC<UIOverlayProps> = ({ 
  astronomicalData, 
  isInitialized, 
  frameCount, 
  currentJulianDay,
  wasmVersion,
  timeData 
}) => {
  const { t, isRTL } = useLanguage();
  const [showSettings, setShowSettings] = useState(false);

  // ✅ CORRECT - Loading state with spiritual context
  if (!isInitialized) {
    return (
      <div className={`ui-overlay loading ${isRTL ? 'rtl' : 'ltr'}`}>
        <div className="loading-container">
          <div className="cosmic-spinner">
            <div className="orbit orbit-1"></div>
            <div className="orbit orbit-2"></div>
            <div className="orbit orbit-3"></div>
            <div className="sun-center"></div>
          </div>
          <h2>{t('ui-initialization')}</h2>
          <p>{t('message-welcome')}</p>
          <div className="loading-progress">
            <div className="loading-steps">
              <span className="step active">🌌 {t('ui-loading')}</span>
              <span className="step">🚀 WASM Core</span>
              <span className="step">🎭 3D Scene</span>
              <span className="step">✨ {t('ui-ready')}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`ui-overlay operational ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Top Header Bar */}
      <header className="top-bar">
        <div className="app-title">
          <h1>✨ StarsCalendars</h1>
          <span className="subtitle">{t('message-alignment')}</span>
        </div>
        
        <div className="header-controls">
          <LanguageSelector />
          
          <button
            type="button"
            className="settings-toggle"
            onClick={() => setShowSettings(!showSettings)}
            aria-label={t('ui-settings')}
          >
            ⚙️
          </button>
        </div>
      </header>

      {/* Main Content Panels */}
      <div className="content-panels">
        {/* Left Panel - Celestial Data */}
        <aside className="left-panel">
          {astronomicalData && (
            <CelestialDataPanel 
              data={astronomicalData}
              julianDay={currentJulianDay}
            />
          )}
        </aside>

        {/* Center Panel - Quantum Time (из референсной сцены) */}
        {timeData && (
          <div className="center-panel">
            <QuantumTimePanel timeData={timeData} />
          </div>
        )}

        {/* Right Panel - Performance & Settings */}
        <aside className="right-panel">
          <PerformancePanel 
            frameCount={frameCount}
            {...(wasmVersion !== undefined && { wasmVersion })}
          />
          
          {showSettings && (
            <div className="settings-panel">
              <h4>{t('ui-settings')}</h4>
              <div className="setting-group">
                <label>{t('ui-quality')}</label>
                <select defaultValue="high">
                  <option value="low">Low (30 FPS)</option>
                  <option value="medium">Medium (45 FPS)</option>
                  <option value="high">High (60 FPS)</option>
                </select>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Bottom Status Bar */}
      <footer className="bottom-bar">
        <div className="status-indicators">
          <span className={`status-dot ${isInitialized ? 'online' : 'offline'}`}></span>
          <span className="status-text">
            {isInitialized ? t('ui-ready') : t('ui-loading')}
          </span>
        </div>
        
        <div className="cosmic-time">
          {astronomicalData && (
            <span>{t('astronomical-system-active')}</span>
          )}
        </div>
      </footer>
    </div>
  );
};

export default UIOverlay;