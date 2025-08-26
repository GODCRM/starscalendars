import {
  ArcRotateCamera,
  Color3,
  CubeTexture,
  Effect,
  Engine,
  Matrix,
  Mesh,
  MeshBuilder,
  PointLight,
  Quaternion,
  Scene,
  ShaderMaterial,
  StandardMaterial,
  Texture,
  Tools,
  Vector3,
  VertexData,
  VolumetricLightScatteringPostProcess
} from '@babylonjs/core';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { AdvancedDynamicTexture, Control, TextBlock } from '@babylonjs/gui';
import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { WASMModule } from '../wasm/init';
// zero-copy view will be created inline without helper
// Fire procedural texture (procedural flames for Sun surface)
import { FireProceduralTexture } from '@babylonjs/procedural-textures';

// ✅ CORRECT - Interface for 3D scene management (Babylon.js 8 — latest minor at runtime)
interface BabylonSceneProps {
  readonly wasmModule: WASMModule | null; // ✅ Direct WASM access for 60fps updates
  readonly isInitialized: boolean;
}

// ✅ CORRECT - Celestial body configuration for artistic proportions
type CelestialBodyConfig = {
  readonly name: string;
  readonly radius: number;          // Artistic size, not realistic
  readonly color: Color3;
  readonly emission: number;        // Self-illumination level
  readonly hasRings?: boolean;
};

// ✅ CORRECT - Pre-configured celestial bodies with MUCH LARGER sizes for visibility
const CELESTIAL_BODIES: Record<string, CelestialBodyConfig> = {
  sun: {
    name: 'Sun',
    radius: 40.0,                  // Match reference SUN_RADIUS (restored)
    color: new Color3(1.0, 0.8, 0.3),
    emission: 1.0                  // Full emission for light source
  },
  earth: {
    name: 'Earth',
    radius: 50.0,                  // Match reference PLANET_RADIUS
    color: new Color3(0.2, 0.6, 1.0),
    emission: 0.0
  },
  moon: {
    name: 'Moon',
    radius: 20.0,                  // Match reference MOON_RADIUS
    color: new Color3(0.8, 0.8, 0.7),
    emission: 0.0
  }
} as const;

// ✅ CONSTANTS for astronomical calculations
const JULIAN_DAY_UNIX_EPOCH = 2440587.5;
const SKYBOX_INTENSITY = 1.6; // brighten env background without touching scene exposure
// Visual moon orbit radius target (~mean distance), reference parity uses ~200
const MOON_ORBIT_RADIUS_UNITS = 200;
// Mean lunar distance in AU (~384400 km / 1 AU)
const MEAN_LUNAR_DISTANCE_AU = 0.00257;
// Scale factor so that mean lunar distance maps to ~200 units; preserves ellipse shape
const MOON_UNITS_PER_AU = MOON_ORBIT_RADIUS_UNITS / MEAN_LUNAR_DISTANCE_AU;

// ✅ КРИТИЧЕСКИЙ БЛОК 1: STAR DATA МАССИВ из референсной сцены (строки 710-739)
// Точные астрономические данные звезд для созвездий
const STAR_DATA = {
  rightAscension: [
    [[2, 31, 48.7], [17, 32, 12.9], [16, 45, 58.1], [15, 44, 3.5], [16, 17, 30.3], [15, 20, 43.7], [14, 50, 42.3]],
    [[6, 3, 55.2], [6, 11, 56.4], [6, 7, 34.3], [5, 54, 22.9], [6, 2, 23.0], [5, 55, 10.3], [5, 35, 8.3], [5, 25, 7.9], [5, 32, 0.4], [5, 14, 32.3], [5, 47, 45.4], [5, 40, 45.5], [4, 54, 53.8], [4, 50, 36.7], [4, 49, 50.4], [4, 51, 12.4], [4, 54, 15.1], [4, 58, 32.9], [5, 36, 12.8], [5, 35, 26.0], [5, 35, 24.0], [5, 35, 23.2], [5, 35, 12.0]],
    [[6, 45, 8.92]],
    [[7, 39, 18.1]],
    [[7, 45, 18.9]],
    [[5, 16, 41.4]],
    [[4, 35, 55.2]]
  ],
  declination: [
    [[89, 15, 51.0], [86, 35, 11.0], [82, 2, 14.0], [77, 47, 40.0], [75, 45, 19.0], [71, 50, 2.0], [74, 9, 20.0]],
    [[20, 8, 18.0], [14, 12, 32.0], [14, 46, 6.0], [20, 16, 34.0], [9, 38, 51.0], [7, 24, 25.0], [9, 56, 3.0], [6, 20, 59.0], [-0, 17, 57.0], [-8, 12, 6.0], [-9, 40, 11.0], [-1, 56, 34.0], [10, 9, 3.0], [8, 54, 1.0], [6, 57, 41.0], [5, 36, 18.0], [2, 26, 26.0], [1, 42, 51.0], [-1, 12, 7.0], [-5, 54, 36.0], [-5, 27, 0.0], [-4, 50, 18.0], [-4, 24, 0.0]],
    [[-16, 42, 58.02]],
    [[5, 13, 30.0]],
    [[28, 1, 34.0]],
    [[45, 59, 53.0]],
    [[16, 30, 33.0]]
  ],
  apparentMagnitude: [
    [2.02, 4.36, 4.23, 4.32, 4.95, 3.05, 2.08],
    [4.63, 4.48, 4.42, 4.41, 4.12, 0.5, 3.54, 1.64, 2.23, 0.12, 2.06, 2.05, 4.65, 4.36, 3.19, 3.69, 3.72, 4.47, 1.7, 2.77, 2.9, 4.59, 4.6],
    [-3.46],
    [0.38],
    [1.14],
    [0.08],
    [0.85]
  ],
  color: [
    [[1.0, 1.0, 0.8, 1.0], [1.0, 1.0, 1.0, 1.0], [0.0, 0.5, 1.0, 1.0], [1.0, 0.9, 0.6, 1.0], [1.0, 0.9, 0.6, 1.0], [0.9, 0.9, 1.0, 1.0], [1.0, 0.5, 0.0, 1.0]],
    [[1.0, 0.5, 0.5, 1.0], [0.7, 0.7, 1.0, 1.0], [0.6, 0.6, 1.0, 1.0], [1.0, 0.5, 0.2, 1.0], [0.3, 0.3, 1.0, 1.0], [1.0, 0.4, 0.0, 1.0], [0.1, 0.2, 1.0, 1.0], [0.2, 0.2, 1.0, 1.0], [0.15, 0.25, 1.0, 1.0], [0.1, 0.2, 1.0, 1.0], [0.2, 0.3, 1.0, 1.0], [0.0, 0.5, 1.0, 1.0], [1.0, 1.0, 0.98, 1.0], [1.0, 1.0, 0.9, 1.0], [1.0, 0.8, 0.4, 1.0], [0.7, 0.7, 1.0, 1.0], [0.7, 0.7, 1.0, 1.0], [1.0, 0.5, 0.0, 1.0], [0.5, 0.5, 1.0, 1.0], [0.7, 0.7, 1.0, 1.0], [1.0, 0.2, 0.2, 1.0], [0.6, 0.8, 1.0, 1.0], [0.5, 0.7, 1.0, 1.0]],
    [[0.8, 0.8, 1.0, 1.0]],
    [[1.0, 0.9, 0.7, 1.0]],
    [[1.0, 0.65, 0.13, 1.0]],
    [[1.0, 1.0, 0.5, 1.0]],
    [[1.0, 0.0, 0.0, 1.0]]
  ],
  asterismIndices: [
    [[0, 1, 2, 3, 4, 5, 6, 3]],
    [[7, 8, 9, 10], [8, 11, 12, 13, 14, 15, 16, 17, 18, 12], [12, 14, 21], [19, 20, 21, 22, 23, 24]]
  ]
} as const;

// ✅ STAR CONFIGURATION - точное соответствие референсу
const STAR_CONFIG = {
  starScale: 8.8,         // Размер звезд
  radius: 4990,           // Радиус звездной сферы
  ShowAsterisms: true,    // Показывать созвездия
  asterismColor: new Color3(0, 0, 0.6),  // Цвет линий созвездий
  twinkleStars: false,    // Мерцание звезд
  starNoise: false,       // Шум звезд
  showMilkyWay: false     // Показать Млечный Путь
} as const;

// ✅ КРИТИЧЕСКИЙ БЛОК 3: РУССКИЕ НАЗВАНИЯ для времени (строки 1294-1296)
const RUSSIAN_DATE_NAMES = {
  months: ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"],
  days: ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"],
  daysNum: ["первый", "второй", "третий", "четвертый", "пятый", "шестой", "седьмой", "восьмой", "девятый", "десятый", "одиннадцатый", "двенадцатый", "тринадцатый", "четырнадцатый", "пятнадцатый", "шестнадцатый", "семнадцатый", "восемнадцатый", "девятнадцатый", "двадцатый"]
} as const;

// ✅ ВРЕМЯ И ДАТА - интерфейс для форматированного времени
// (UI time is updated directly inside Babylon GUI; no cross-component payload needed)

// ✅ CORRECT - Enhanced scene state interface for React refs
interface SceneState {
  engine: Engine | null;
  scene: Scene | null;
  camera: ArcRotateCamera | null;
  celestialMeshes: Map<string, Mesh>;
  starMesh: Mesh | null;              // ✅ Звездное небо
  lastSecond?: number;                // ✅ Последняя секунда для обновления времени
  isReady: boolean;
  gui?: AdvancedDynamicTexture | null;
  tbNT?: TextBlock | null;
  tbTD?: TextBlock | null;
  earthShaderMaterial?: ShaderMaterial | null;
  cloudsShaderMaterial?: ShaderMaterial | null;
  zenithMarker?: Mesh | null;
  lunarZenithMarker?: Mesh | null;
  earthPivot?: TransformNode | null;
  moonPivot?: TransformNode | null;
  zenithRay?: Mesh | null;
  zenithRayPositions?: Float32Array | null;
  statsEl?: HTMLElement | null;
  tbSolstice?: TextBlock | null;
  lastSolsticeMinute?: number;
  isSolsticeComputing?: boolean;
  nextSolsticeJD?: number | null;
  // NT scheduling
  lastNTMinute?: number;
  isNTComputing?: boolean;
}

// ✅ FPS Counter interface for useRef
// Deprecated: custom FPS counter replaced by Tools.getFps()

// ✅ Performance timer for scene initialization tracking
class PerformanceTimer {
  private operationName: string;
  private startTime: number;

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

const BabylonScene: React.FC<BabylonSceneProps> = ({ wasmModule }) => {
  // Initialization guard to prevent re-init (StrictMode safe)
  const initializedRef = useRef(false);

  // ✅ CRITICAL - useRef for persistent scene state (TypeScript 5.9.2+ pattern)
  const sceneStateRef = useRef<SceneState>({
    engine: null,
    scene: null,
    camera: null,
    celestialMeshes: new Map(),
    starMesh: null,
    isReady: false
  });

  // ✅ Internal canvas ref (self-managed canvas)
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // ✅ Zero-allocation WASM view reuse in render loop
  const statePtrRef = useRef<number>(0);
  const stateViewRef = useRef<Float64Array | null>(null);
  const memBufferRef = useRef<ArrayBuffer | null>(null);

  // ✅ УБИРАЕМ React state - используем только рефы!
  // НЕ СОЗДАЕМ state который может вызвать ререндер!

  // FPS handled by BABYLON.Tools.GetFps() inside render loop

  // ✅ КРИТИЧЕСКИЙ БЛОК 4: QUANTUM TIME FUNCTIONS (строки 82-98, 107-144 из референса)

  // Переносим NT на WASM: форматируем метку из трёх компонентов [d_in_decade, decade, year]
  const getQuantumTimeFromWASM = useCallback((epochMs: number, wasm: WASMModule): string => {
    try {
      const tzMin = new Date(epochMs).getTimezoneOffset();
      const ptr = wasm.get_quantum_time_components(epochMs, tzMin);
      if (!ptr) return '00.00.00';
      const mem = wasm.memory.buffer;
      const view = new Float64Array(mem, ptr, 3);
      const dInDecade = (view[0]! | 0) as number;
      const decade = (view[1]! | 0) as number;
      const year = (view[2]! | 0) as number;
      const d2 = (n: number) => (n < 10 ? `0${n}` : `${n}`);
      return `${d2(dInDecade)}.${d2(decade)}.${d2(year % 100)}`;
    } catch {
      return '00.00.00';
    }
  }, []);

  /**
   * Форматирование текущего времени
   * Точный перенос из референсной сцены (строки 1337-1345)
   */
  const formatCurrentTime = useCallback((date: Date): string => {
    const tDn = RUSSIAN_DATE_NAMES.days[date.getDay()]!;
    const tD = date.getDate().toString();
    const tM = RUSSIAN_DATE_NAMES.months[date.getMonth()]!;
    const tH = `00${date.getHours().toString()}`;
    const tMm = `00${date.getMinutes().toString()}`;
    const tS = `00${date.getSeconds().toString()}`;

    return `${tH.substring(tH.length - 2)}:${tMm.substring(tMm.length - 2)}:${tS.substring(tS.length - 2)}, ${tDn}, ${tD} ${tM} ${date.getFullYear().toString()} г.`;
  }, []);

  // ✅ КРИТИЧЕСКИЙ БЛОК 5: CREATE SKY FUNCTION (строки 350-425 из референсной сцены)
  /**
   * Создание звездного неба с созвездиями
   * Точный перенос из референсной сцены (строки 350-425)
   */
  const createSky = useCallback((scene: Scene): Mesh => {
    console.log('⭐ Creating stellar sky with constellations...');

    const starMesh = new Mesh('starMesh', scene);
    starMesh.alphaIndex = 20;

    const starsCoordinates: number[] = [];
    const starsIndices: number[] = [];
    const starsColor: number[] = [];
    const starsUV: number[] = [];
    let vertexIndex = 0;

    // Создаем звезды по астрономическим данным
    for (let astLimitLoop = STAR_DATA.rightAscension.length, i = 0; i < astLimitLoop; i++) {
      for (let starLimitLoop = STAR_DATA.rightAscension[i]!.length, j = 0; j < starLimitLoop; j++) {
        // Прямое восхождение в часах -> градусах -> радианах
        const ra = (STAR_DATA.rightAscension[i]![j]![0]! + STAR_DATA.rightAscension[i]![j]![1]! / 60 + STAR_DATA.rightAscension[i]![j]![2]! / 3600) * 15;

        // Склонение в градусах -> радианах
        const decDegrees = STAR_DATA.declination[i]![j]![0]!;
        const decMinutes = STAR_DATA.declination[i]![j]![1]!;
        const decSeconds = STAR_DATA.declination[i]![j]![2]!;
        const dec = (decDegrees < 0 || Object.is(decDegrees, -0))
          ? -(Math.abs(decDegrees) + decMinutes / 60 + decSeconds / 3600)
          : decDegrees + decMinutes / 60 + decSeconds / 3600;

        const rightAscension = Tools.ToRadians(ra);
        const declination = Tools.ToRadians(dec);

        // Размер звезды в зависимости от видимой величины
        const scaleFactor = (10.8 - (STAR_DATA.apparentMagnitude[i]![j]! * 1.5)) * STAR_CONFIG.starScale;

        // Создаем треугольник для звезды (3 вершины)
        let vertex1 = new Vector3(0 * scaleFactor, 0.7 * scaleFactor, STAR_CONFIG.radius);
        let vertex2 = new Vector3(-0.5 * scaleFactor, -0.3 * scaleFactor, STAR_CONFIG.radius);
        let vertex3 = new Vector3(0.5 * scaleFactor, -0.3 * scaleFactor, STAR_CONFIG.radius);

        // Поворачиваем звезду по небесной сфере
        const transformMatrix = Matrix.RotationYawPitchRoll(-rightAscension, -declination, 0);
        vertex1 = Vector3.TransformCoordinates(vertex1, transformMatrix);
        vertex2 = Vector3.TransformCoordinates(vertex2, transformMatrix);
        vertex3 = Vector3.TransformCoordinates(vertex3, transformMatrix);

        // Добавляем координаты вершин
        starsCoordinates.push(vertex1.x, vertex1.y, vertex1.z, vertex2.x, vertex2.y, vertex2.z, vertex3.x, vertex3.y, vertex3.z);

        // Цвет звезды из данных
        const starColor = STAR_DATA.color[i]![j]!;
        starsColor.push(
          starColor[0]!, starColor[1]!, starColor[2]!, starColor[3]!,
          starColor[0]!, starColor[1]!, starColor[2]!, starColor[3]!,
          starColor[0]!, starColor[1]!, starColor[2]!, starColor[3]!
        );

        // UV координаты
        starsUV.push(0.5, 1, 0, 0, 1, 0);

        // Индексы треугольника
        starsIndices.push(vertexIndex, vertexIndex + 1, vertexIndex + 2);
        vertexIndex += 3;
      }
    }

    // Создаем mesh со звездами
    const vertexData = new VertexData();
    vertexData.positions = starsCoordinates;
    vertexData.indices = starsIndices;
    vertexData.colors = starsColor;
    vertexData.uvs = starsUV;
    vertexData.applyToMesh(starMesh);

    // Материал для звезд
    const starMaterial = new StandardMaterial('starMaterial', scene);
    starMaterial.disableLighting = true;
    starMaterial.emissiveColor = new Color3(1, 1, 1);

    // Попытка загрузить текстуру звезды (если доступна)
    try {
      const starTexture = new Texture('/textures/star.png', scene);
      starMaterial.opacityTexture = starTexture;
    } catch (error) {
      console.warn('Star texture not found, using solid stars');
    }

    starMesh.material = starMaterial;
    // Freeze static stars
    starMaterial.freeze();
    starMesh.freezeWorldMatrix();

    // ✅ СОЗВЕЗДИЯ - линии между звездами
    if (STAR_CONFIG.ShowAsterisms) {
      console.log('🌌 Creating constellation lines...');

      const createConstellationLine = (start: Vector3, end: Vector3): void => {
        const points = [start, end];
        const lines = MeshBuilder.CreateLines("constellationLine", { points }, scene);
        lines.color = STAR_CONFIG.asterismColor;
        lines.freezeWorldMatrix();
      };

      // Создаем линии созвездий по индексам
      for (let asr = 0; asr < STAR_DATA.asterismIndices.length; asr++) {
        for (let i = 0; i < STAR_DATA.asterismIndices[asr]!.length; i++) {
          const constellation = STAR_DATA.asterismIndices[asr]![i]!;
          for (let j = 0; j < constellation.length - 1; j++) {
            const startIdx = constellation[j]!;
            const endIdx = constellation[j + 1]!;

            // Получаем координаты звезд для линии (каждая звезда имеет 3 вершины * 3 координаты = 9 значений)
            const startCoordIdx = startIdx * 9; // Первая вершина звезды
            const endCoordIdx = endIdx * 9;

            if (startCoordIdx < starsCoordinates.length && endCoordIdx < starsCoordinates.length) {
              const start = new Vector3(
                starsCoordinates[startCoordIdx]!,
                starsCoordinates[startCoordIdx + 1]!,
                starsCoordinates[startCoordIdx + 2]!
              );
              const end = new Vector3(
                starsCoordinates[endCoordIdx]!,
                starsCoordinates[endCoordIdx + 1]!,
                starsCoordinates[endCoordIdx + 2]!
              );
              createConstellationLine(start, end);
            }
          }
        }
      }
    }

    console.log(`✅ Stellar sky created with ${starsCoordinates.length / 9} stars and constellation lines`);
    return starMesh;
  }, []);

  // ✅ CORRECT - Main scene initialization function (Babylon.js 8 patterns)
  const initializeBabylonScene = useCallback(async (canvas: HTMLCanvasElement): Promise<void> => {

    const timer = new PerformanceTimer('babylon_scene_initialization');

    try {
      console.log('🎬 Initializing Babylon.js Scene...');

      // ✅ CORRECT - Engine initialization with optimized settings for 60fps
      const engine = new Engine(canvas, true, {
        preserveDrawingBuffer: false,
        stencil: false,
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        failIfMajorPerformanceCaveat: false, // Allow fallback for compatibility
      });

      timer.mark('engine_created');

      // ✅ CORRECT - Scene creation with optimized settings
      const scene = new Scene(engine);

      timer.mark('scene_created');

      // Ensure canvas has correct size before content creation
      engine.resize();
      // DPR-aware scaling: crisp on desktop, adaptive on mobile for perf
      // High-res text/UI and light shapes, keep perf knobs dynamic
      const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 3));
      const isMobile = (navigator as any).userAgentData?.mobile || /Mobi|Android/i.test(navigator.userAgent);
      // Allow higher resolution on capable devices; cap minimal pixel ratio to avoid "квадратики"
      const scaling = isMobile ? 1 / Math.min(dpr, 2) : 1 / dpr;
      engine.setHardwareScalingLevel(scaling);

      // WebKit/Safari workaround: guard texParameteri when no texture is bound to avoid
      // noisy INVALID_OPERATION logs for cube textures during async loads.
      try {
        const gl: any = (engine as any)._gl;
        if (gl && typeof gl.texParameteri === 'function' && !gl.__sc_texParamGuard) {
          const original = gl.texParameteri.bind(gl);
          gl.texParameteri = function (target: number, pname: number, param: number) {
            try {
              let bindingEnum: number | null = null;
              if (target === gl.TEXTURE_CUBE_MAP) bindingEnum = gl.TEXTURE_BINDING_CUBE_MAP;
              else if (target === gl.TEXTURE_2D) bindingEnum = gl.TEXTURE_BINDING_2D;
              if (bindingEnum !== null) {
                const bound = gl.getParameter(bindingEnum);
                if (!bound) return; // skip to avoid INVALID_OPERATION when nothing is bound
              }
            } catch { }
            return original(target, pname, param);
          };
          gl.__sc_texParamGuard = true;
        }
      } catch { }

      // ✅ Create scene content (celestial bodies, lighting, camera)
      createSceneContent(scene, engine, timer);

      // ✅ Mark scene as ready
      sceneStateRef.current.isReady = true;

      timer.mark('scene_ready');

    } catch (error) {
      console.error('❌ Babylon.js Scene Initialization Failed:', error);
    }
  }, []);

  // ✅ CORRECT - Create scene content function (separated for clarity)
  const createSceneContent = useCallback((scene: Scene, engine: Engine, timer: PerformanceTimer): void => {
    console.log('🎭 Creating scene content...');

    // ✅ CAMERA ATTACHED TO EARTH - as requested!
    const earthDiameter = CELESTIAL_BODIES.earth!.radius; // In reference: value is actually DIAMETER
    const earthRadius = earthDiameter * 0.5;
    const earthPosition = new Vector3(15, 0, 0); // Initial Earth position - will be updated by WASM

    const camera = new ArcRotateCamera(
      "camera",
      -Math.PI / 2,      // Alpha (horizontal rotation)
      Math.PI / 2.5,     // Beta (vertical rotation)
      earthRadius * 4,   // Distance = 2 diameters from Earth center (4 * radius)
      earthPosition,     // Target Earth position (will be updated)
      scene
    );
    camera.minZ = 0.1;
    camera.maxZ = 200000;

    // Zoom limits per reference scene (Earth=50 DIAMETER → base ~50):
    // lower ≈ PLANET_RADIUS (DIAMETER), upper ≈ PLANET_RADIUS * 2
    camera.lowerRadiusLimit = CELESTIAL_BODIES.earth!.radius;        // ≈ 50
    camera.upperRadiusLimit = CELESTIAL_BODIES.earth!.radius * 2;    // ≈ 100

    // Enable smooth camera controls - ATTACHED TO EARTH
    const renderingCanvas = engine.getRenderingCanvas();
    if (renderingCanvas) {
      camera.attachControl(renderingCanvas, true);
    }

    // ✅ OPTIMAL CONTROLS following Babylon.js 8 best practices
    camera.wheelPrecision = 3.0;       // Standard wheel zoom precision
    camera.pinchPrecision = 12.0;      // Standard touch zoom precision
    camera.panningSensibility = 1000;  // Standard panning sensitivity
    camera.angularSensibilityX = 1000; // Standard horizontal rotation
    camera.angularSensibilityY = 1000; // Standard vertical rotation

    // ✅ Enable inertia for smooth camera movement
    camera.inertia = 0.9;              // Smooth camera inertia
    camera.panningInertia = 0.9;       // Smooth panning inertia
    camera.fov = 1.5;                  // Match reference FOV

    // ✅ ONLY SUN LIGHTING - as requested!

    // ✅ SUN AS MAIN LIGHT SOURCE AT CENTER (0,0,0) — exact ref parity
    const sunLight = new PointLight(
      "sunLight",
      Vector3.Zero(), // At Sun position (0,0,0)
      scene
    );
    // Boost intensity to improve lit coverage on planet limbs
    sunLight.diffuse = new Color3(1.0, 1.0, 1.0);
    sunLight.intensity = 1.6;
    // Other properties left as Babylon defaults to match reference

    timer.mark('lighting_configured');

    // ✅ Create Celestial Bodies with optimized meshes
    const sceneObjects = new Map<string, Mesh>();

    // ✅ SUN AT CENTER (0,0,0) - as requested!
    const sunConfig = CELESTIAL_BODIES.sun!;
    const sunMesh = MeshBuilder.CreateSphere("sun", {
      diameter: sunConfig.radius, // value is DIAMETER in reference
      segments: 15 // reference value
    }, scene);
    sunMesh.position = Vector3.Zero(); // ✅ SUN AT CENTER OF SCENE
    // Reference parity: make light the parent of the sun mesh
    sunMesh.parent = sunLight;

    // ✅ STANDARD: Let Babylon.js handle mesh optimizations automatically
    // Removed advanced optimizations that may not be needed for simple scene

    // ✅ Enhanced Sun material with emission
    const sunMaterial = new StandardMaterial("sunMaterial", scene);
    sunMaterial.diffuseColor = sunConfig.color;
    sunMaterial.emissiveColor = sunConfig.color;
    sunMaterial.specularColor = new Color3(0, 0, 0); // No specular highlights
    sunMaterial.disableLighting = true; // Sun is self-illuminated
    sunMaterial.freeze(); // ✅ Material optimization
    sunMesh.material = sunMaterial;
    // Freeze Sun transform: static at scene center
    sunMesh.freezeWorldMatrix();

    // 🔥 Procedural fire texture on Sun (exactly like reference)
    try {
      const fireTexture = new FireProceduralTexture('fire', 128, scene);
      fireTexture.fireColors = [
        new Color3(1.0, 0.7, 0.3),
        new Color3(1.0, 0.7, 0.3),
        new Color3(1.0, 0.5, 0.0),
        new Color3(1.0, 0.5, 0.0),
        new Color3(1.0, 1.0, 1.0),
        new Color3(1.0, 0.5, 0.0)
      ];
      (sunMaterial as StandardMaterial).emissiveTexture = fireTexture;
    } catch (e) {
      console.warn('⚠️ FireProceduralTexture not available; add @babylonjs/procedural-textures', e);
    }

    // 🌟 God Rays post-process (Volumetric Light Scattering) tuned like reference
    const godrays = new VolumetricLightScatteringPostProcess(
      'godrays',
      1.0,
      camera,
      sunMesh,
      100,
      Texture.BILINEAR_SAMPLINGMODE,
      engine,
      false
    );
    godrays.exposure = 0.95;
    godrays.decay = 0.96815;
    godrays.weight = 0.78767;
    godrays.density = 1.0;

    // Target Earth (planet) as in reference
    camera.setTarget(earthPosition);

    sceneObjects.set('sun', sunMesh);

    // ✅ Enhanced Earth with Babylon.js 8 optimizations
    const earthMesh = MeshBuilder.CreateSphere("earth", {
      diameter: earthDiameter, // value is DIAMETER in reference
      segments: 300 // PLANET_V (референс)
    }, scene);
    // ✅ Pivot hierarchy (reference parity): earthPivot → earth, moonPivot → moon
    const earthPivot = new TransformNode('earthPivot', scene);
    earthPivot.position = new Vector3(15, 0, 0); // Initial world position - will be updated by WASM
    earthMesh.parent = earthPivot;
    earthMesh.position.set(0, 0, 0);

    // Do NOT flip Earth mesh; reference flips only the clouds shell (see cloudsMesh.rotation.z = Math.PI)

    // ===== Earth day/night shader (exact port of reference) =====
    // Register shaders (Planet + Clouds) into Effect.ShadersStore
    Effect.ShadersStore.shPlanetVertexShader = `
      precision highp float;
      attribute vec3 position;
      attribute vec3 normal;
      attribute vec2 uv;
      uniform mat4 world;
      uniform mat4 worldViewProjection;
      varying vec2 vUV;
      varying vec3 vPositionW;
      varying vec3 vNormalW;
      void main(void) {
        vec4 outPosition = worldViewProjection * vec4(position, 1.0);
        gl_Position = outPosition;
        vPositionW = vec3(world * vec4(position, 1.0));
        vNormalW = normalize(vec3(world * vec4(normal, 0.0)));
        vUV = uv;
      }
    `;
    Effect.ShadersStore.shPlanetFragmentShader = `
      precision highp float;
      varying vec2 vUV;
      varying vec3 vPositionW;
      varying vec3 vNormalW;
      uniform vec3 lightPosition;
      uniform sampler2D diffuseTexture;
      uniform sampler2D nightTexture;
      void main(void) {
        vec3 direction = lightPosition - vPositionW;
        vec3 lightVectorW = normalize(direction);
        float lightDiffuse = max(0.1, dot(vNormalW, lightVectorW));
        vec4 nightColor = texture2D(nightTexture, vUV).rgba;
        vec3 diffuseColor = texture2D(diffuseTexture, vUV).rgb;
        vec3 color = diffuseColor * lightDiffuse + (nightColor.rgb * nightColor.a * pow((1.0 - lightDiffuse), 6.0));
        gl_FragColor = vec4(color, 1.0);
      }
    `;

    Effect.ShadersStore.shCloudsVertexShader = `
      precision highp float;
      attribute vec3 position;
      attribute vec3 normal;
      attribute vec2 uv;
      uniform mat4 world;
      uniform mat4 worldViewProjection;
      varying vec2 vUV;
      varying vec3 vPositionW;
      varying vec3 vNormalW;
      void main(void) {
        vec4 outPosition = worldViewProjection * vec4(position, 1.0);
        gl_Position = outPosition;
        vPositionW = vec3(world * vec4(position, 1.0));
        vNormalW = normalize(vec3(world * vec4(normal, 0.0)));
        vUV = uv;
      }
    `;
    Effect.ShadersStore.shCloudsFragmentShader = `
      precision highp float;
      varying vec3 vPositionW;
      varying vec3 vNormalW;
      varying vec2 vUV;
      uniform sampler2D cloudsTexture;
      uniform vec3 cameraPosition;
      uniform vec3 lightPosition;
      float computeFresnelTerm(vec3 viewDirection, vec3 normalW, float bias, float power) {
        float fresnelTerm = pow(bias + dot(viewDirection, normalW), power);
        return clamp(fresnelTerm, 0., 1.);
      }
      void main(void) {
        vec3 viewDirectionW = normalize(cameraPosition - vPositionW);
        vec3 direction = lightPosition - vPositionW;
        vec3 lightVectorW = normalize(direction);
        float lightCos = dot(vNormalW, lightVectorW);
        float lightDiffuse = max(0., lightCos);
        vec3 color = texture2D(cloudsTexture, vUV).rgb;
        float globalAlpha = clamp(color.r, 0.0, 1.0);
        float fresnelTerm = computeFresnelTerm(viewDirectionW, vNormalW, 0.72, 5.0);
        float resultAlpha;
        if (fresnelTerm < 0.95) {
          float envDiffuse = clamp(pow(fresnelTerm - 0.92, 1.0/2.0) * 2.0, 0.0, 1.0);
          resultAlpha = fresnelTerm * envDiffuse * lightCos;
          color = color / 2.0 + vec3(0.0, 0.5, 0.7);
        } else {
          resultAlpha = fresnelTerm * globalAlpha * lightDiffuse;
        }
        float backLightCos = dot(viewDirectionW, lightVectorW);
        float cosConst = 0.9;
        if (backLightCos < -cosConst) {
          float sunHighlight = pow(backLightCos + cosConst, 2.0);
          if (fresnelTerm < 0.9) {
            sunHighlight *= 65.0;
            float envDiffuse = clamp(pow(fresnelTerm - 0.92, 1.0/2.0) * 2.0, 0.0, 1.0);
            resultAlpha = sunHighlight;
            color *= lightDiffuse;
            color.r += sunHighlight;
            color.g += sunHighlight / 2.0;
            gl_FragColor = vec4(color, resultAlpha);
            return;
          } else {
            sunHighlight *= 95.0;
            sunHighlight *= 1.0 + lightCos;
            color = vec3(sunHighlight, sunHighlight / 2.0, 0.0);
            resultAlpha = sunHighlight;
            gl_FragColor = vec4(color, resultAlpha);
            return;
          }
        }
        gl_FragColor = vec4(color * lightDiffuse, resultAlpha);
      }
    `;

    const planetMaterial = new ShaderMaterial('planetMaterial', scene, 'shPlanet', {
      attributes: ['position', 'normal', 'uv'],
      uniforms: ['world', 'worldView', 'worldViewProjection', 'diffuseTexture', 'nightTexture', 'lightPosition']
    });
    // NPOT maps → disable mipmaps per WebGL1 rules
    const earthDiffuse = new Texture('/textures/earth-diffuse.jpg', scene);
    const earthNight = new Texture('/textures/earth-night-o2.png', scene);
    planetMaterial.setTexture('diffuseTexture', earthDiffuse);
    planetMaterial.setTexture('nightTexture', earthNight);
    planetMaterial.setVector3('lightPosition', sunLight.position);
    planetMaterial.backFaceCulling = false;
    earthMesh.material = planetMaterial;
    try {
      const applyDisp = () => {
        if (
          earthMesh.isVerticesDataPresent('position') &&
          earthMesh.isVerticesDataPresent('normal') &&
          earthMesh.isVerticesDataPresent('uv')
        ) {
          earthMesh.applyDisplacementMap('/textures/earth-height.png', 0, 1);
        } else {
          console.warn('skip applyDisplacementMap: mesh not complete');
        }
      };
      if (earthMesh.isReady(true)) {
        applyDisp();
      } else {
        scene.onBeforeRenderObservable.addOnce(applyDisp);
      }
    } catch { }

    sceneObjects.set('earth', earthMesh);

    // ✅ Enhanced Moon with Babylon.js 8 optimizations
    const moonConfig = CELESTIAL_BODIES.moon!;
    const moonMesh = MeshBuilder.CreateSphere("moon", {
      diameter: moonConfig.radius, // value is DIAMETER in reference
      segments: 25 // reference value
    }, scene);

    // ✅ MOON via dedicated independent pivot (NOT parented to earthPivot)
    const moonPivot = new TransformNode('moonPivot', scene);
    moonPivot.position.copyFrom(earthPivot.position);
    moonMesh.parent = moonPivot;
    moonMesh.position = new Vector3(16, 0, 0); // Initial local position - will be updated by WASM

    const moonMaterial = new StandardMaterial("moonMaterial", scene);
    moonMaterial.diffuseColor = moonConfig.color;
    moonMaterial.specularColor = new Color3(0.05, 0.05, 0.05);
    // Textures from public folder (no mipmaps)
    const moonDiff = new Texture('/textures/moon.jpg', scene);

    const moonBump = new Texture('/textures/moon_bump.jpg', scene);

    const moonSpec = new Texture('/textures/moon_spec.jpg', scene);

    moonMaterial.diffuseTexture = moonDiff;
    moonMaterial.bumpTexture = moonBump;
    moonMaterial.specularTexture = moonSpec;
    moonMaterial.freeze(); // ✅ Material optimization
    moonMesh.material = moonMaterial;

    sceneObjects.set('moon', moonMesh);

    timer.mark('celestial_bodies_created');

    // 🌥️ Cloud layer around Earth (slightly larger sphere with custom shader)
    const cloudsMaterial = new ShaderMaterial('cloudsMaterial', scene, 'shClouds', {
      attributes: ['position', 'normal', 'uv'],
      uniforms: ['world', 'worldView', 'worldViewProjection', 'cloudsTexture', 'lightPosition', 'cameraPosition'],
      needAlphaBlending: true
    });
    cloudsMaterial.alpha = 0.9; // чуть прозрачнее
    // Clouds (NPOT) without mipmaps
    const cloudsTex = new Texture('/textures/earth-c.jpg', scene, false, false, Texture.BILINEAR_SAMPLINGMODE);
    cloudsMaterial.setTexture('cloudsTexture', cloudsTex);
    const cloudsMesh = MeshBuilder.CreateSphere('clouds', {
      diameter: earthDiameter + 2, // ENV_H = 2, based on DIAMETER
      segments: 300 // повторяем PLANET_V для совпадения геометрии
    }, scene);
    cloudsMesh.material = cloudsMaterial;
    cloudsMesh.rotation.z = Math.PI;
    cloudsMesh.parent = earthMesh; // Follow Earth

    // ✅ Skybox – load from 6 JPG faces in /textures/universe with guard against premature GL texParameter
    const skybox = MeshBuilder.CreateBox('universe', { size: 10000 }, scene);
    const skyboxMaterial = new StandardMaterial('universe', scene);
    skyboxMaterial.backFaceCulling = false;
    const cube = CubeTexture.CreateFromImages([
      '/textures/universe/universe_px.jpg',
      '/textures/universe/universe_py.jpg',
      '/textures/universe/universe_pz.jpg',
      '/textures/universe/universe_nx.jpg',
      '/textures/universe/universe_ny.jpg',
      '/textures/universe/universe_nz.jpg',
    ], scene, /* noMipmap */ true);
    // Safari/WebGL: avoid early material binding before texture is ready
    skybox.isVisible = false;
    cube.onLoadObservable.addOnce(() => {
      cube.coordinatesMode = Texture.SKYBOX_MODE;
      skyboxMaterial.reflectionTexture = cube;
      // brighten the skybox only (not affecting PBR exposure)
      try { (skyboxMaterial as any).reflectionTextureLevel = SKYBOX_INTENSITY; } catch { }
      skyboxMaterial.markDirty();
      // Freeze only after reflection is bound
      skyboxMaterial.disableLighting = true;
      skybox.material = skyboxMaterial;
      skybox.position = Vector3.Zero();
      skyboxMaterial.freeze();
      skybox.freezeWorldMatrix();
      skybox.isVisible = true;
    });
    // Do not attach material before the cubemap is ready (Safari generateMipmap race)

    timer.mark('skybox_created');

    // ✨ Subtle glow for bright emissive objects (Sun)
    // const glow = new GlowLayer('glow', scene);
    // glow.intensity = 0.5; // only to soften stars/constellations like ref; not for sun

    // ✅ STELLAR SKY - создаем настоящие звезды и созвездия
    const starMesh = createSky(scene);
    timer.mark('stellar_sky_created');

    // Zenith marker (red sphere) on Earth's surface
    const zenithMarker = MeshBuilder.CreateSphere('zenithMarker', { diameter: 1.0, segments: 8 }, scene);
    const zenithMat = new StandardMaterial('zenithMat', scene);
    zenithMat.diffuseColor = new Color3(1, 0, 0);
    zenithMat.emissiveColor = new Color3(1, 0, 0);
    zenithMat.specularColor = new Color3(0, 0, 0);
    zenithMarker.material = zenithMat;
    zenithMarker.parent = earthMesh; // local to Earth

    // Debug ray: from Earth's center through zenith marker (local), length ~200 (preallocate positions buffer)
    const zenithRay = MeshBuilder.CreateLines('zenithRay', { points: [Vector3.Zero(), new Vector3(0, 0, 200)], updatable: true }, scene);
    zenithRay.color = new Color3(1, 0, 0);
    zenithRay.parent = earthMesh;
    const zenithRayPositions = zenithRay.getVerticesData("position") as Float32Array | null;

    // Lunar zenith (sublunar) marker (green)
    const lunarZenithMarker = MeshBuilder.CreateSphere('lunarZenithMarker', { diameter: 1.0, segments: 8 }, scene);
    const lunarZenithMat = new StandardMaterial('lunarZenithMat', scene);
    lunarZenithMat.diffuseColor = new Color3(0, 1, 0);
    lunarZenithMat.emissiveColor = new Color3(0, 1, 0);
    lunarZenithMat.specularColor = new Color3(0, 0, 0);
    lunarZenithMarker.material = lunarZenithMat;
    lunarZenithMarker.parent = earthMesh; // local to Earth

    // ✅ GUI (Babylon GUI) — current date and quantum date like reference
    const gui = AdvancedDynamicTexture.CreateFullscreenUI('UI', true, scene);
    gui.renderScale = 1.0;

    // Quantum Date (tbNT)
    const tbNT = new TextBlock('tbNT');
    tbNT.fontSizeInPixels = 34;
    tbNT.width = '200px';
    tbNT.height = '44px';
    tbNT.color = '#CCCDCE';
    tbNT.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    tbNT.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    tbNT.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    tbNT.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    tbNT.top = 40;
    gui.addControl(tbNT);

    // Current Date/Time (tbTD)
    const tbTD = new TextBlock('tbTD');
    tbTD.fontSizeInPixels = 15;
    tbTD.width = '320px';
    tbTD.height = '26px';
    tbTD.color = '#CCCDCE';
    tbTD.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    tbTD.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    tbTD.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    tbTD.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    tbTD.top = 80;
    gui.addControl(tbTD);

    // Winter solstice countdown (top-right)
    const tbSolstice = new TextBlock('tbSolstice');
    tbSolstice.fontSizeInPixels = 14;
    tbSolstice.width = '380px';
    tbSolstice.height = '20px';
    tbSolstice.color = '#CCCDCE';
    tbSolstice.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    tbSolstice.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    tbSolstice.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
    tbSolstice.top = 8;
    tbSolstice.left = -12;
    tbSolstice.text = 'До зимнего солнцестояния: —';
    gui.addControl(tbSolstice);

    // ✅ Update scene state ref
    sceneStateRef.current = {
      engine,
      scene,
      camera,
      celestialMeshes: sceneObjects,
      starMesh,
      isReady: true,
      gui,
      tbNT,
      tbTD,
      earthShaderMaterial: planetMaterial,
      cloudsShaderMaterial: cloudsMaterial,
      zenithMarker,
      lunarZenithMarker,
      earthPivot,
      moonPivot,
      zenithRay,
      zenithRayPositions,
      statsEl: typeof document !== 'undefined' ? document.getElementById('stats') : null,
      tbSolstice,
      lastSolsticeMinute: 0,
      isSolsticeComputing: false,
      // NT scheduling
      lastNTMinute: 0,
      isNTComputing: false,
    };

    // ✅ CRITICAL - 60FPS RENDER LOOP with FPS tracking (Babylon.js 8 pattern)
    console.log('🔁 Starting render loop...');
    engine.runRenderLoop(() => {
      // Use absolute UTC time for correct Julian Day
      const nowMs = Date.now();
      // Update FPS overlay using Engine API
      const stats = sceneStateRef.current.statsEl;
      if (stats) {
        // Babylon 8: prefer Engine.getFps() for reliable value
        const fps = scene.getEngine().getFps();
        stats.innerHTML = `FPS: <b>${fps.toFixed(0)}</b>`;
      }

      // ✅ Update celestial positions from WASM every frame (60fps smooth movement)
      if (wasmModule && sceneStateRef.current.isReady) {
        try {
          updateCelestialPositionsRealtime(wasmModule, nowMs);
        } catch (error) {
          // Log error but don't break render loop
          console.error('❌ WASM update failed:', error);
          // Fall back to basic positioning without WASM data
        }
      }

      // ✅ Update shader uniforms for Earth/Clouds every frame
      if (sceneStateRef.current.cloudsShaderMaterial) {
        sceneStateRef.current.cloudsShaderMaterial.setVector3('cameraPosition', scene.activeCamera!.position);
        sceneStateRef.current.cloudsShaderMaterial.setVector3('lightPosition', sunLight.position);
      }
      if (sceneStateRef.current.earthShaderMaterial) {
        sceneStateRef.current.earthShaderMaterial.setVector3('lightPosition', sunLight.position);
      }

      // ✅ TIME UPDATE - обновляем время каждую секунду (как в референсе строки 1331-1346)
      const nowEpochMs = Date.now();
      const currentSecond = Math.floor(nowEpochMs / 1000) % 60;
      const currentMinute = Math.floor(nowEpochMs / 60000);

      if (!sceneStateRef.current.lastSecond || sceneStateRef.current.lastSecond !== currentSecond) {
        sceneStateRef.current.lastSecond = currentSecond;
        const nowDate = new Date(nowEpochMs);
        if (sceneStateRef.current.tbTD) sceneStateRef.current.tbTD.text = formatCurrentTime(nowDate);
      }

      // ✅ QUANTUM TIME LABEL — обновляем раз в минуту, расчёт вне кадра (легковесный)
      if (sceneStateRef.current.tbNT && sceneStateRef.current.lastNTMinute !== currentMinute && !sceneStateRef.current.isNTComputing) {
        sceneStateRef.current.lastNTMinute = currentMinute;
        sceneStateRef.current.isNTComputing = true;
        const snapshot = nowEpochMs;
        const updateNT = () => {
          try {
            if (wasmModule && sceneStateRef.current.tbNT) {
              sceneStateRef.current.tbNT.text = getQuantumTimeFromWASM(snapshot, wasmModule);
            }
          } finally {
            sceneStateRef.current.isNTComputing = false;
          }
        };
        if ((window as any).requestIdleCallback) {
          (window as any).requestIdleCallback(updateNT);
        } else {
          setTimeout(updateNT, 0);
        }
      }

      // ✅ SOLSTICE COUNTDOWN (astronomical) — обновляем раз в минуту, расчёт вне кадра
      if (sceneStateRef.current.tbSolstice && sceneStateRef.current.lastSolsticeMinute !== currentMinute && !sceneStateRef.current.isSolsticeComputing) {
        sceneStateRef.current.lastSolsticeMinute = currentMinute;
        sceneStateRef.current.isSolsticeComputing = true;
        const snapshot = nowEpochMs;
        if ((window as any).requestIdleCallback) {
          (window as any).requestIdleCallback(() => computeSolsticeCountdown(snapshot, wasmModule!));
        } else {
          setTimeout(() => computeSolsticeCountdown(snapshot, wasmModule!), 0);
        }
      }

      // Debug: log sublunar coordinates once per minute to cross-check with external sources
      // if (sceneStateRef.current.lastSolsticeMinute === currentMinute && wasmModule) {
      //   const jdNow = JULIAN_DAY_UNIX_EPOCH + nowEpochMs / 86400000.0;
      //   const sub = computeSublunarLatLonDeg(jdNow, wasmModule);
      //   if (sub) {
      //     console.log(`🌙 Sublunar (deg): lat=${sub.latDeg.toFixed(3)} lonE=${sub.lonDegEast.toFixed(3)} (E+; W−)`);
      //     // Also log from marker local vector to verify mapping chain
      //     const sceneState = sceneStateRef.current;
      //     if (sceneState.lunarZenithMarker) {
      //       const local = sceneState.lunarZenithMarker.position;
      //       const subLocal = localVecToLatLonDeg(local);
      //       console.log(`🟢 MarkerLocal→LatLon: lat=${subLocal.latDeg.toFixed(3)} lonE=${subLocal.lonDegEast.toFixed(3)}`);
      //     }
      //   }
      // }

      // ✅ Render scene (automatically clears with dark space background)
      scene.render();
    });

    // ✅ Handle resize with proper engine resize
    const handleResize = () => {
      engine.resize();
    };
    window.addEventListener('resize', handleResize);

    timer.mark('initialization_complete');
    console.log('✅ Babylon.js Scene Initialized Successfully at 60fps');
  }, [wasmModule]);


  // ✅ CORRECT - Pre-allocated Vector3 objects for zero-allocation updates
  const moonPositionVector = useMemo(() => Vector3.Zero(), []);
  const earthPositionVector = useMemo(() => Vector3.Zero(), []);
  const zenithLocalVector = useMemo(() => Vector3.Zero(), []);
  const targetDirVector = useMemo(() => Vector3.Zero(), []);
  const crossAxisVector = useMemo(() => Vector3.Zero(), []);
  const pivotRotationQuat = useMemo(() => new Quaternion(), []);
  const rollRotationQuat = useMemo(() => new Quaternion(), []);
  const finalRotationQuat = useMemo(() => new Quaternion(), []);
  const eNorthLocalVec = useMemo(() => Vector3.Zero(), []);
  const eNorthWorldVec = useMemo(() => Vector3.Zero(), []);
  const uProjVec = useMemo(() => Vector3.Zero(), []);
  const rotMatrix = useMemo(() => Matrix.Identity(), []);

  // Compute sublunar lat/lon (deg) from current WASM buffer and JD using mean obliquity and apparent sidereal time
  const computeSublunarLatLonDeg = useCallback((jd: number, wasm: WASMModule): { latDeg: number; lonDegEast: number } | null => {
    if (!stateViewRef.current) return null;
    const s = stateViewRef.current;
    // Ecliptic Cartesian (geocentric): RH coords
    const mx = s[3]!; const my = s[4]!; const mz = s[5]!;
    const rXY = Math.hypot(mx, my);
    const lon = Math.atan2(my, mx);               // λ
    const lat = Math.atan2(mz, rXY);              // β
    // Mean obliquity ε (rad)
    const eps = typeof wasm.get_mean_obliquity === 'function' ? wasm.get_mean_obliquity(jd) : 0.4090928; // ~23.439° fallback
    const sinE = Math.sin(eps), cosE = Math.cos(eps);
    const sinL = Math.sin(lon), cosL = Math.cos(lon);
    const tanB = Math.tan(lat);
    // Equatorial RA/Dec (radians)
    const ra = Math.atan2(sinL * cosE - tanB * sinE, cosL);
    const dec = Math.asin(Math.sin(lat) * cosE + Math.cos(lat) * sinE * sinL);
    // Apparent sidereal time (radians)
    const ast = typeof wasm.get_apparent_sidereal_time === 'function' ? wasm.get_apparent_sidereal_time(jd) : 0;
    // Sub-lunar longitude east-positive: wrap to [-π, π]
    let lonE = ast - ra;
    lonE = ((lonE + Math.PI) % (2 * Math.PI)) - Math.PI;
    const toDeg = (x: number) => x * 180 / Math.PI;
    return { latDeg: toDeg(dec), lonDegEast: toDeg(lonE) };
  }, []);

  // Debug helper: derive lat/lon (east-positive) from an Earth-local direction vector
  // const localVecToLatLonDeg = useCallback((v: Vector3): { latDeg: number; lonDegEast: number } => {
  //   const r = Math.hypot(v.x, v.y, v.z) || 1;
  //   const x = v.x / r, y = v.y / r, z = v.z / r;
  //   const lat = Math.asin(y);
  //   const theta = Math.atan2(z, x); // theta = (-lon) + π
  //   let lonE = Math.PI - theta;     // lon = π − theta
  //   lonE = ((lonE + Math.PI) % (2 * Math.PI)) - Math.PI;
  //   const toDeg = (x: number) => x * 180 / Math.PI;
  //   return { latDeg: toDeg(lat), lonDegEast: toDeg(lonE) };
  // }, []);

  // ✅ REAL-TIME 60FPS: Update celestial positions directly from WASM every frame
  const updateCelestialPositionsRealtime = useCallback((wasmModule: WASMModule, currentTimeMs: number): void => {
    const sceneState = sceneStateRef.current;
    if (!sceneState.isReady || !sceneState.celestialMeshes) return;

    try {
      // ✅ Calculate current Julian Day based on absolute time
      const julianDay = JULIAN_DAY_UNIX_EPOCH + currentTimeMs / 86400000.0;

      // ✅ CRITICAL: Exactly ONE compute_*() call per frame — SEM only (no fallback)
      if (typeof wasmModule.compute_state !== 'function') {
        console.error('❌ WASM compute_state export is missing. Scene requires unified STATE path.');
        return;
      }
      const positionsPtr = wasmModule.compute_state(julianDay);

      // Add debug logging for first few frames
      if (!((window as any).__debugCallCount)) (window as any).__debugCallCount = 0;
      if ((window as any).__debugCallCount++ < 5) {
        console.log(`🌌 WASM Frame ${(window as any).__debugCallCount}: JD=${julianDay.toFixed(6)}, ptr=${positionsPtr}`);
      }

      if (positionsPtr === 0) {
        console.warn('⚠️ WASM calculation returned null pointer');
        return;
      }

      // ✅ Zero-copy access via Float64Array view to WASM memory (STATE: 11 f64)
      const mem = wasmModule.memory.buffer;
      if (positionsPtr < 0 || positionsPtr + (11 * 8) > mem.byteLength) {
        console.error('❌ STATE pointer out of bounds');
        return;
      }
      // Reuse view if ptr and buffer unchanged (no allocations in hot path)
      if (stateViewRef.current === null ||
        statePtrRef.current !== positionsPtr ||
        memBufferRef.current !== mem) {
        stateViewRef.current = new Float64Array(mem, positionsPtr, 11);
        statePtrRef.current = positionsPtr;
        memBufferRef.current = mem;
      }
      const buf = stateViewRef.current as Float64Array;
      // Buffer layout: Sun(0..2) geocentric, Moon(3..5) geocentric, Earth(6..8) heliocentric, Zenith(9..10)
      const ex = buf[6]!, ey = buf[7]!, ez = buf[8]!;
      const mx = buf[3]!, my = buf[4]!, mz = buf[5]!;
      const sx = 0.0, sy = 0.0, sz = 0.0; // Sun at center in scene

      // Zenith from state buffer (radians)
      const sunZenithLngRad = buf[9]!;
      const sunZenithLatRad = buf[10]!;
      const sunZenithLng = sunZenithLngRad * 180 / Math.PI;
      const sunZenithLat = sunZenithLatRad * 180 / Math.PI;

      const astronomicalData = {
        sun: { x: sx, y: sy, z: sz, distance: 0, timestamp: currentTimeMs },
        earth: { x: ex, y: ey, z: ez, distance: Math.hypot(ex, ey, ez), timestamp: currentTimeMs },
        moon: { x: ex + mx, y: ey + my, z: ez + mz, distance: Math.hypot(mx, my, mz), timestamp: currentTimeMs },
        earthSunDistance: Math.hypot(ex, ey, ez),
        sunZenithLat, sunZenithLng, sunZenithLatRad, sunZenithLngRad,
      } as const;

      // yaw correction stored later into uProjVec.x/y (cos/sin) to avoid extra allocations

      // ✅ HELIOCENTRIC/GEOCENTRIC VISUALIZATION: Correct astronomical model
      const scaleAU = 700.0; // Match reference orbit scaling (~700 units per 1 AU)

      // Sun is static at scene center; no per-frame updates needed

      // ✅ EARTH ORBITS AROUND SUN - use real heliocentric coordinates (strict astronomy mapping)
      // ✅ Update Earth pivot world position and Earth-local zenith marker
      if (sceneState.earthPivot) {
        // Axis mapping aligned to ecliptic tilt visually: X->X, Z(ecliptic)->Y(scene), Y(ecliptic)->Z(scene) with single Z flip
        earthPositionVector.set(
          astronomicalData.earth.x * scaleAU,
          astronomicalData.earth.z * scaleAU,
          -(astronomicalData.earth.y * scaleAU)
        );
        sceneState.earthPivot.position.copyFrom(earthPositionVector);

        // ✅ CAMERA ALWAYS FOLLOWS EARTH - as requested!
        if (sceneState.camera) {
          sceneState.camera.setTarget(earthPositionVector);
        }

        // ✅ Compute zenith marker in Earth-local space FIRST (untransformed Earth),
        // then orient pivot so this point looks exactly at scene origin
        const latRad = astronomicalData.sunZenithLatRad;
        const lonRad = astronomicalData.sunZenithLngRad; // east-positive

        if (sceneState.zenithMarker) {
          const r = CELESTIAL_BODIES.earth!.radius * 0.5; // visual radius
          const phi = (Math.PI / 2) - latRad;
          const theta = (-lonRad) + Math.PI; // canonical: west-positive + π
          const sinPhi = Math.sin(phi);
          const x = r * sinPhi * Math.cos(theta);
          const z = r * sinPhi * Math.sin(theta);
          const y = r * Math.cos(phi);
          sceneState.zenithMarker.position.set(x, y, z);
          // Update debug ray along the local zenith direction
          if (sceneState.zenithRay && sceneState.zenithRayPositions && sceneState.zenithRayPositions.length >= 6) {
            // reuse preallocated vectors and buffer
            const lenInv = 1.0 / Math.sqrt(x * x + y * y + z * z);
            const endX = x * lenInv * 200;
            const endY = y * lenInv * 200;
            const endZ = z * lenInv * 200;
            sceneState.zenithRayPositions[3] = endX;
            sceneState.zenithRayPositions[4] = endY;
            sceneState.zenithRayPositions[5] = endZ;
            sceneState.zenithRay.updateVerticesData("position", sceneState.zenithRayPositions);
          }
        }

        // Orient pivot so the local zenith vector points exactly to origin using minimal rotation quaternion
        if (!sceneState.zenithMarker) return;
        // local zenith direction
        zenithLocalVector.set(
          sceneState.zenithMarker.position.x,
          sceneState.zenithMarker.position.y,
          sceneState.zenithMarker.position.z
        ).normalize();
        // world target direction (to Sun at origin)
        targetDirVector.set(
          -sceneState.earthPivot.position.x,
          -sceneState.earthPivot.position.y,
          -sceneState.earthPivot.position.z
        ).normalize();
        const d = Vector3.Dot(zenithLocalVector, targetDirVector);
        if (d > 0.999999) {
          // already aligned
          pivotRotationQuat.set(0, 0, 0, 1);
        } else if (d < -0.999999) {
          // opposite; choose orthogonal axis
          const ax = Math.abs(zenithLocalVector.x);
          const ay = Math.abs(zenithLocalVector.y);
          const az = Math.abs(zenithLocalVector.z);
          if (ax < ay && ax < az) crossAxisVector.set(1, 0, 0);
          else if (ay < az) crossAxisVector.set(0, 1, 0);
          else crossAxisVector.set(0, 0, 1);
          // axis = v x arbitrary
          Vector3.CrossToRef(zenithLocalVector, crossAxisVector, crossAxisVector);
          crossAxisVector.normalize();
          Quaternion.RotationAxisToRef(crossAxisVector, Math.PI, pivotRotationQuat);
        } else {
          // general case
          Vector3.CrossToRef(zenithLocalVector, targetDirVector, crossAxisVector);
          crossAxisVector.normalize();
          const angle = Math.acos(Math.min(1, Math.max(-1, d)));
          Quaternion.RotationAxisToRef(crossAxisVector, angle, pivotRotationQuat);
        }
        // Compute roll to preserve intuitive tilt: align rotated local-North with projection of worldUp onto plane ⟂ targetDir
        // 1) local North tangent at (phi, theta): e_north_local = -e_phi = [-cos(phi)cos(theta), sin(phi), -cos(phi)sin(theta)]
        const phi = (Math.PI / 2) - latRad;
        const theta = (-lonRad) + Math.PI;
        const cosPhi = Math.cos(phi);
        const sinPhi = Math.sin(phi);
        const cosTheta = Math.cos(theta);
        const sinTheta = Math.sin(theta);
        eNorthLocalVec.set(-cosPhi * cosTheta, sinPhi, -cosPhi * sinTheta);
        // Rotate eNorthLocal by q_align to world space
        pivotRotationQuat.toRotationMatrix(rotMatrix);
        Vector3.TransformCoordinatesToRef(eNorthLocalVec, rotMatrix, eNorthWorldVec);
        eNorthWorldVec.normalize();
        // Project worldUp onto plane orthogonal to targetDir
        const worldUpY = 1.0;
        uProjVec.set(
          0 - targetDirVector.x * (0 * targetDirVector.x + worldUpY * targetDirVector.y + 0 * targetDirVector.z),
          worldUpY - targetDirVector.y * (0 * targetDirVector.x + worldUpY * targetDirVector.y + 0 * targetDirVector.z),
          0 - targetDirVector.z * (0 * targetDirVector.x + worldUpY * targetDirVector.y + 0 * targetDirVector.z)
        );
        if (uProjVec.lengthSquared() < 1e-9) {
          // Fallback: project world Z if targetDir ~ worldUp
          uProjVec.set(
            0 - targetDirVector.x * (targetDirVector.z),
            0 - targetDirVector.y * (targetDirVector.z),
            1 - targetDirVector.z * (targetDirVector.z)
          );
        }
        uProjVec.normalize();
        // Signed angle between eNorthWorldVec and uProjVec around axis targetDir
        const dotNu = Math.min(1, Math.max(-1, Vector3.Dot(eNorthWorldVec, uProjVec)));
        const crossNu = Vector3.Cross(eNorthWorldVec, uProjVec);
        const sign = Vector3.Dot(crossNu, targetDirVector) >= 0 ? 1 : -1;
        const beta = Math.acos(dotNu) * sign;
        Quaternion.RotationAxisToRef(targetDirVector, beta, rollRotationQuat);
        // Final rotation: roll * align → normalize to ensure unit quaternion (critical for inverse)
        rollRotationQuat.multiplyToRef(pivotRotationQuat, finalRotationQuat);
        finalRotationQuat.normalize();
        sceneState.earthPivot.rotation.set(0, 0, 0);
        sceneState.earthPivot.rotationQuaternion = finalRotationQuat;

        // Earth mesh remains unrotated; only pivot orients the hierarchy (Moon orbit included)
        const earthMesh = sceneState.celestialMeshes.get('earth');
        if (earthMesh) {
          earthMesh.rotation.x = 0;
          earthMesh.rotation.y = 0;
          earthMesh.rotation.z = 0;
        }

        // Compute yaw correction between world→local Sun direction and red zenith vector.
        // This fixes any constant local Y-rotation offset between sphere texture seam and mathematical prime meridian.
        // Result reused for sublunar marker below (no extra WASM calls).
        {
          const q = sceneState.earthPivot.rotationQuaternion!;
          const invQ = new Quaternion(-q.x, -q.y, -q.z, q.w);
          const n = Math.hypot(invQ.x, invQ.y, invQ.z, invQ.w);
          if (n > 0) { invQ.x /= n; invQ.y /= n; invQ.z /= n; invQ.w /= n; }
          // world Sun dir (from Earth to origin)
          uProjVec.set(
            -sceneState.earthPivot.position.x,
            -sceneState.earthPivot.position.y,
            -sceneState.earthPivot.position.z
          ).normalize();
          Matrix.FromQuaternionToRef(invQ, rotMatrix);
          // localSunDir -> store in eNorthLocalVec
          Vector3.TransformCoordinatesToRef(uProjVec, rotMatrix, eNorthLocalVec).normalize();
          // red zenith local dir already in zenithLocalVector
          const azSunLocal = Math.atan2(eNorthLocalVec.z, eNorthLocalVec.x);
          const azRedLocal = Math.atan2(zenithLocalVector.z, zenithLocalVector.x);
          const delta = azRedLocal - azSunLocal;
          // Store yaw correction into preallocated uProjVec.xy as scratch to avoid extra fields
          // uProjVec.x = cos(delta), uProjVec.y = sin(delta)
          uProjVec.x = Math.cos(delta);
          uProjVec.y = Math.sin(delta);
        }

        // (moved sublunar marker placement below, after moon position update)
      }

      // ✅ MOON ORBITS AROUND EARTH
      if (sceneState.moonPivot) {
        const mxAU = buf[3]!; const myAU = buf[4]!; const mzAU = buf[5]!;
        const rUnits = Math.hypot(mxAU, myAU, mzAU) * MOON_UNITS_PER_AU;
        const moonMesh = sceneState.celestialMeshes.get('moon');
        // Compute sublunar lat/lon once per frame and reuse
        const sub = computeSublunarLatLonDeg(julianDay, wasmModule);
        let latRad: number | null = null;
        let lonRad: number | null = null;
        if (sub) {
          latRad = sub.latDeg * Math.PI / 180;
          lonRad = sub.lonDegEast * Math.PI / 180; // east-positive
        }

        if (moonMesh && latRad !== null && lonRad !== null && sceneState.earthPivot?.rotationQuaternion) {
          const phiL = (Math.PI / 2) - latRad;
          const thetaL = (-lonRad) + Math.PI;
          const sinPhiL = Math.sin(phiL);
          // Earth-local unit direction toward Moon
          const lx = sinPhiL * Math.cos(thetaL);
          const ly = Math.cos(phiL);
          const lz = sinPhiL * Math.sin(thetaL);
          // Transform local→world with Earth's current orientation
          const q = sceneState.earthPivot.rotationQuaternion;
          if (q) {
            Matrix.FromQuaternionToRef(q, rotMatrix);
            zenithLocalVector.set(lx, ly, lz);
            Vector3.TransformCoordinatesToRef(zenithLocalVector, rotMatrix, targetDirVector);
            targetDirVector.normalize().scaleInPlace(rUnits);
            moonMesh.position.copyFrom(targetDirVector);
          }
        }
        // ✅ Sync moonPivot POSITION only (keep geocentric vector in inertial ecliptic frame)
        if (sceneState.moonPivot && sceneState.earthPivot) {
          sceneState.moonPivot.position.copyFrom(sceneState.earthPivot.position);
          // Do not rotate moonPivot; keep lunar vector inertial
        }

        // ✅ Place sublunar (lunar zenith) marker using the same sublunar coords
        if (sceneState.lunarZenithMarker && sceneState.earthPivot && latRad !== null && lonRad !== null) {
          const r = CELESTIAL_BODIES.earth!.radius * 0.5;
          const phiL2 = (Math.PI / 2) - latRad;
          const thetaL2 = (-lonRad) + Math.PI;
          const sinPhiL2 = Math.sin(phiL2);
          const xL2 = r * sinPhiL2 * Math.cos(thetaL2);
          const zL2 = r * sinPhiL2 * Math.sin(thetaL2);
          const yL2 = r * Math.cos(phiL2);
          sceneState.lunarZenithMarker.position.set(xL2, yL2, zL2);
        }
      }

    } catch (error) {
      console.error('❌ Real-time Position Update Failed:', error);
    }
  }, [moonPositionVector, earthPositionVector]);

  // Compute solstice countdown outside the render frame to keep 1× WASM call per frame
  const computeSolsticeCountdown = useCallback((nowEpochMs: number, wasm: WASMModule): void => {
    try {
      // Prefer precise event time from WASM helper (TT-aware); fallback to decl scan if NaN
      const nowJD = JULIAN_DAY_UNIX_EPOCH + nowEpochMs / 86400000.0;
      // Reuse cached nextSolsticeJD if available and still in the future
      let solsticeJD = sceneStateRef.current.nextSolsticeJD ?? Number.NaN;
      if (!Number.isFinite(solsticeJD) || solsticeJD <= nowJD) {
        // Compute next solstice from current JD and cache (helper returns JD_UTC)
        const candidate = wasm.next_winter_solstice_from(nowJD);
        if (Number.isFinite(candidate)) {
          solsticeJD = candidate;
        }
        sceneStateRef.current.nextSolsticeJD = solsticeJD;
      }
      const solsticeMs = (solsticeJD - JULIAN_DAY_UNIX_EPOCH) * 86400000.0;
      const diffMs = solsticeMs - nowEpochMs;
      const totalMinutes = Math.max(0, Math.floor(diffMs / 60000));
      const days = Math.floor(totalMinutes / (60 * 24));
      const hours = Math.floor((totalMinutes - days * 24 * 60) / 60);
      const minutes = totalMinutes - days * 24 * 60 - hours * 60;
      const d2 = (n: number) => (n < 10 ? `0${n}` : `${n}`);
      const sDate = new Date(solsticeMs);
      const sY = sDate.getFullYear();
      const sM = d2(sDate.getMonth() + 1);
      const sD = d2(sDate.getDate());
      const sH = d2(sDate.getHours());
      const sMin = d2(sDate.getMinutes());
      if (sceneStateRef.current.tbSolstice) {
        const hh = d2(hours);
        const mm = d2(minutes);
        sceneStateRef.current.tbSolstice.text = `До зимнего солнцестояния: ${days}:${hh}:${mm} / ${sY}-${sM}-${sD} ${sH}:${sMin}`;
      }
    } catch {
      if (sceneStateRef.current.tbSolstice) sceneStateRef.current.tbSolstice.text = '—';
    } finally {
      sceneStateRef.current.isSolsticeComputing = false;
    }
  }, []);

  // ✅ ПРАВИЛЬНЫЙ useEffect как в референсе - ТОЛЬКО canvas как trigger!
  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) {
      console.log('⏸️ No canvas available');
      return;
    }

    if (!initializedRef.current) {
      console.log('🎯 Starting scene initialization ONCE...');
      initializedRef.current = true;
      initializeBabylonScene(canvasEl);
    }

    return () => {
      console.log('🧹 Cleaning up Babylon.js scene...');
      const sceneState = sceneStateRef.current;
      if (sceneState.engine) {
        // In StrictMode dev, effects mount/unmount twice. Allow re-init by resetting guard.
        initializedRef.current = false;
        try {
          sceneState.engine.stopRenderLoop();
          if (sceneState.scene) {
            sceneState.scene.dispose();
          }
          sceneState.engine.dispose();
        } catch { }
        sceneStateRef.current = {
          engine: null,
          scene: null,
          camera: null,
          celestialMeshes: new Map(),
          starMesh: null,
          isReady: false
        };
      }
    };
  }, [initializeBabylonScene]);

  // ✅ Self-managed canvas
  return (
    <canvas
      ref={canvasRef}
      id="babylon-canvas"
      className="babylon-canvas"
      style={{ touchAction: 'none' }}
    />
  );
};

export default BabylonScene;
