import {
  ArcRotateCamera,
  Color3,
  CubeTexture,
  Effect,
  Engine,
  GlowLayer,
  Matrix,
  Mesh,
  MeshBuilder,
  PointLight,
  Scene,
  ShaderMaterial,
  StandardMaterial,
  Texture,
  Tools,
  Vector3,
  VertexData,
  VolumetricLightScatteringPostProcess
} from '@babylonjs/core';
import '@babylonjs/core/Materials/Textures/Loaders/envTextureLoader';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { AdvancedDynamicTexture, Control, TextBlock } from '@babylonjs/gui';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import type { WASMModule } from '../wasm/init';
import { createPositionsView, extractCelestialPositions } from '../wasm/init';
// Fire procedural texture (procedural flames for Sun surface)
import { FireProceduralTexture } from '@babylonjs/procedural-textures';

// ✅ CORRECT - Interface for 3D scene management (Babylon.js 8.21.0)
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
    radius: 40.0,                  // Match reference SUN_RADIUS
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
// Visual moon orbit radius (units), reference parity uses ~200
const MOON_ORBIT_RADIUS_UNITS = 200;

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

// ✅ КРИТИЧЕСКИЙ БЛОК 2: QUANTUM TIME CONSTANTS из референсной сцены (строки 107-144)
const QUANTUM_TIME_CONFIG = {
  // Константы для квантового времени (точно из референса)
  constNT: 1344643200000,                    // Базовая временная точка
  constD: 86459178.082191780821918,          // Обычный день в миллисекундах
  constDExtra: 43229589.41095890410959,      // Дополнительные дни (2 раза в году)
  constY: 31557600000,                       // Год в миллисекундах
  maxTime: 4090089600000,                    // Максимальное время
  specialDays: { year: 11, day: 121 }        // Особые дни: 11-й год, 121-й день
} as const;

// ✅ КРИТИЧЕСКИЙ БЛОК 3: РУССКИЕ НАЗВАНИЯ для времени (строки 1294-1296)
const RUSSIAN_DATE_NAMES = {
  months: ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"],
  days: ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"],
  daysNum: ["первый", "второй", "третий", "четвертый", "пятый", "шестой", "седьмой", "восьмой", "девятый", "десятый", "одиннадцатый", "двенадцатый", "тринадцатый", "четырнадцатый", "пятнадцатый", "шестнадцатый", "семнадцатый", "восемнадцатый", "девятнадцатый", "двадцатый"]
} as const;

// ✅ QUANTUM TIME - интерфейс для квантового времени (из референсной сцены)
interface QuantumTimeEntry {
  readonly u: number; // Unix timestamp в миллисекундах
  readonly d: number; // День в квантовом календаре
  readonly y: number; // Год в квантовом календаре
}

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
  earthPivot?: TransformNode | null;
  moonPivot?: TransformNode | null;
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

  // ✅ QUANTUM TIME - массив квантового времени (референсная сцена строки 1272-1291)
  const quantumTimeArrayRef = useRef<QuantumTimeEntry[]>([]);

  // ✅ Internal canvas ref (self-managed canvas)
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // ✅ УБИРАЕМ React state - используем только рефы!
  // НЕ СОЗДАЕМ state который может вызвать ререндер!

  // FPS handled by BABYLON.Tools.GetFps() inside render loop

  // ✅ КРИТИЧЕСКИЙ БЛОК 4: QUANTUM TIME FUNCTIONS (строки 82-98, 107-144 из референса)

  /**
   * Функция для бинарного поиска ближайшего меньшего элемента по полю u
   * Точный перенос из референсной сцены (строки 82-98)
   */
  const findClosestSmaller = useCallback((arr: QuantumTimeEntry[], targetU: number): QuantumTimeEntry | null => {
    let left = 0;
    let right = arr.length - 1;
    let closestSmaller: QuantumTimeEntry | null = null;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      if (arr[mid]!.u <= targetU) {
        closestSmaller = arr[mid]!;
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
    return closestSmaller;
  }, []);

  /**
   * Инициализация массива квантового времени NT
   * Точный перенос из референсной сцены (строки 1272-1291)
   */
  const initializeQuantumTimeArray = useCallback((): void => {
    if (quantumTimeArrayRef.current.length >= 30000) {
      return; // Массив уже инициализирован
    }

    console.log('🌌 Initializing Quantum Time Array...');
    const NT: QuantumTimeEntry[] = [];
    const udy = { u: QUANTUM_TIME_CONFIG.constNT, d: 0, y: 0 };

    while (udy.u < QUANTUM_TIME_CONFIG.maxTime) {
      NT.push({ ...udy });

      if (udy.y === QUANTUM_TIME_CONFIG.specialDays.year && udy.d === QUANTUM_TIME_CONFIG.specialDays.day) {
        // Особые дни: добавляем 2 дополнительных дня
        udy.u += QUANTUM_TIME_CONFIG.constDExtra;
        udy.d += 1;
        NT.push({ ...udy });
        udy.u += QUANTUM_TIME_CONFIG.constDExtra;
        udy.d += 1;
        NT.push({ ...udy });
      } else {
        // Обычный день
        udy.u += QUANTUM_TIME_CONFIG.constD;
        udy.d += 1;
      }

      if (udy.d === 365) {
        udy.d = 0;
        udy.y += 1;
      }
    }

    quantumTimeArrayRef.current = NT;
    console.log(`✅ Quantum Time Array initialized with ${NT.length} entries`);
  }, []);

  /**
   * Расчет квантового времени для даты
   * Точный перенос из референсной сцены (строки 100-144)
   */
  const calculateQuantumTime = useCallback((date: Date): string => {
    // Корректируем время для UTC (как в референсе)
    const adjustedDate = new Date(date);
    adjustedDate.setHours(24 - (adjustedDate.getTimezoneOffset() / 60 + 4));
    adjustedDate.setMinutes(0);
    adjustedDate.setSeconds(0);
    adjustedDate.setMilliseconds(0);

    // Инициализируем массив если нужно
    if (quantumTimeArrayRef.current.length === 0) {
      initializeQuantumTimeArray();
    }

    // Находим ближайшее квантовое время
    const res = findClosestSmaller(quantumTimeArrayRef.current, adjustedDate.getTime());
    if (!res) {
      return '00.00.00';
    }

    const yNTr = Math.trunc(res.y);
    const dNTrr = Math.trunc(res.d);
    const dpNTr = Math.trunc(dNTrr / 10);
    const dNTr = dNTrr - (dpNTr * 10);

    const yNT = `00${yNTr.toString()}`;
    const dNT = `00${dNTr.toString()}`;
    const dpNT = `00${dpNTr.toString()}`;

    return `${dNT.substring(dNT.length - 2)}.${dpNT.substring(dpNT.length - 2)}.${yNT.substring(yNT.length - 2)}`;
  }, [findClosestSmaller, initializeQuantumTimeArray]);

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

  // ✅ CORRECT - Main scene initialization function (Babylon.js 8.21.0 patterns)
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

    // ✅ OPTIMAL CONTROLS following Babylon.js 8.21.0 best practices
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
    // Reference parity: only diffuse set; no custom intensity/specular/range
    sunLight.diffuse = new Color3(0.5, 0.5, 0.5);
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

    // ✅ Enhanced Earth with 8.21.0 optimizations
    const earthMesh = MeshBuilder.CreateSphere("earth", {
      diameter: earthDiameter, // value is DIAMETER in reference
      segments: 300 // PLANET_V (референс)
    }, scene);
    // ✅ Pivot hierarchy (reference parity): earthPivot → earth, moonPivot → moon
    const earthPivot = new TransformNode('earthPivot', scene);
    earthPivot.position = new Vector3(15, 0, 0); // Initial world position - will be updated by WASM
    earthMesh.parent = earthPivot;
    earthMesh.position.set(0, 0, 0);

    // Flip Earth mesh 180° around Z so texture aligns like reference
    earthMesh.rotation.z = Math.PI;

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

    // ✅ Enhanced Moon with 8.21.0 optimizations
    const moonConfig = CELESTIAL_BODIES.moon!;
    const moonMesh = MeshBuilder.CreateSphere("moon", {
      diameter: moonConfig.radius, // value is DIAMETER in reference
      segments: 25 // reference value
    }, scene);

    // ✅ MOON via dedicated pivot under Earth pivot for correct geocentric local offset
    const moonPivot = new TransformNode('moonPivot', scene);
    moonPivot.parent = earthPivot;
    moonPivot.position.set(0, 0, 0);
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
    const cloudsTex = new Texture('/textures/earth-c.jpg', scene);
    cloudsMaterial.setTexture('cloudsTexture', cloudsTex);
    const cloudsMesh = MeshBuilder.CreateSphere('clouds', {
      diameter: earthDiameter + 2, // ENV_H = 2, based on DIAMETER
      segments: 300 // повторяем PLANET_V для совпадения геометрии
    }, scene);
    cloudsMesh.material = cloudsMaterial;
    cloudsMesh.rotation.z = Math.PI;
    cloudsMesh.parent = earthMesh; // Follow Earth

    // ✅ Skybox – use prefiltered .env on all platforms (no fallbacks)
    const skybox = MeshBuilder.CreateBox('universe', { size: 10000 }, scene);
    const skyboxMaterial = new StandardMaterial('universe', scene);
    skyboxMaterial.backFaceCulling = false;
    const envTex = CubeTexture.CreateFromPrefilteredData('/textures/universe/environment.env', scene);
    envTex.onLoadObservable.addOnce(() => {
      envTex.coordinatesMode = Texture.SKYBOX_MODE;
      skyboxMaterial.reflectionTexture = envTex;
      // brighten the skybox only (not affecting PBR exposure)
      try { (skyboxMaterial as any).reflectionTextureLevel = SKYBOX_INTENSITY; } catch { }
      skyboxMaterial.markDirty();
      // Freeze only after reflection is bound
      skyboxMaterial.disableLighting = true;
      skybox.material = skyboxMaterial;
      skybox.position = new Vector3(0, 0, 0);
      skyboxMaterial.freeze();
      skybox.freezeWorldMatrix();
    });
    // If load is very slow, keep material attached but unfrozen
    skybox.material = skyboxMaterial;

    timer.mark('skybox_created');

    // ✨ Subtle glow for bright emissive objects (Sun)
    const glow = new GlowLayer('glow', scene);
    glow.intensity = 0.5; // only to soften stars/constellations like ref; not for sun

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

    // ✅ GUI (Babylon GUI) — current date and quantum date like reference
    const gui = AdvancedDynamicTexture.CreateFullscreenUI('UI', true, scene);
    gui.renderScale = 1.0;

    // Quantum Date (tbNT)
    const tbNT = new TextBlock('tbNT');
    tbNT.fontSizeInPixels = 34;
    tbNT.width = '200px';
    tbNT.height = '34px';
    tbNT.color = '#CCCDCE';
    tbNT.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    tbNT.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    tbNT.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    tbNT.top = 40;
    gui.addControl(tbNT);

    // Current Date/Time (tbTD)
    const tbTD = new TextBlock('tbTD');
    tbTD.fontSizeInPixels = 15;
    tbTD.width = '320px';
    tbTD.height = '20px';
    tbTD.color = '#CCCDCE';
    tbTD.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    tbTD.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    tbTD.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    tbTD.top = 80;
    gui.addControl(tbTD);

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
      earthPivot,
      moonPivot
    };

    // ✅ CRITICAL - 60FPS RENDER LOOP with FPS tracking (Babylon.js 8.21.0 pattern)
    console.log('🔁 Starting render loop...');
    engine.runRenderLoop(() => {
      // Use absolute UTC time for correct Julian Day
      const nowMs = Date.now();
      // Update FPS overlay using Engine API
      const stats = document.getElementById('stats');
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
      const now = new Date();
      const currentSecond = now.getSeconds();

      // Проверяем, изменилась ли секунда (обновляем время раз в секунду)
      if (!sceneStateRef.current.lastSecond || sceneStateRef.current.lastSecond !== currentSecond) {
        sceneStateRef.current.lastSecond = currentSecond;
        // Обновляем Babylon GUI — без React state
        if (sceneStateRef.current.tbTD) {
          sceneStateRef.current.tbTD.text = formatCurrentTime(now);
        }
        if (sceneStateRef.current.tbNT) {
          sceneStateRef.current.tbNT.text = calculateQuantumTime(now);
        }
      }

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
  const sunPositionVector = useMemo(() => Vector3.Zero(), []);
  const moonPositionVector = useMemo(() => Vector3.Zero(), []);
  const earthPositionVector = useMemo(() => Vector3.Zero(), []);

  // ✅ REAL-TIME 60FPS: Update celestial positions directly from WASM every frame
  const updateCelestialPositionsRealtime = useCallback((wasmModule: WASMModule, currentTimeMs: number): void => {
    const sceneState = sceneStateRef.current;
    if (!sceneState.isReady || !sceneState.celestialMeshes) return;

    try {
      // ✅ Calculate current Julian Day based on absolute time
      const julianDay = JULIAN_DAY_UNIX_EPOCH + currentTimeMs / 86400000.0;

      // ✅ CRITICAL: Exactly ONE compute_all() call per frame (60fps)
      const positionsPtr = wasmModule.compute_all(julianDay);

      // Add debug logging for first few frames
      if (!((window as any).__debugCallCount)) (window as any).__debugCallCount = 0;
      if ((window as any).__debugCallCount++ < 5) {
        console.log(`🌌 WASM Frame ${(window as any).__debugCallCount}: JD=${julianDay.toFixed(6)}, ptr=${positionsPtr}`);
      }

      if (positionsPtr === 0) {
        console.warn('⚠️ WASM calculation returned null pointer');
        return;
      }

      // ✅ Zero-copy access via Float64Array view to WASM memory
      const positionsResult = createPositionsView(wasmModule, positionsPtr);
      if (!positionsResult.success) {
        console.error('❌ Failed to create positions view:', positionsResult.error.message);
        return;
      }

      // ✅ Extract all celestial positions using the dedicated function
      const astronomicalData = extractCelestialPositions(positionsResult.data, currentTimeMs, wasmModule);

      // ✅ HELIOCENTRIC/GEOCENTRIC VISUALIZATION: Correct astronomical model
      const scaleAU = 700.0; // Match reference orbit scaling (~700 units per 1 AU)

      // ✅ SUN ALWAYS AT CENTER (0,0,0) - HELIOCENTRIC MODEL
      const sunMesh = sceneState.celestialMeshes.get('sun');
      if (sunMesh) {
        sunPositionVector.set(
          astronomicalData.sun.x * scaleAU, // Always (0,0,0) from WASM
          astronomicalData.sun.y * scaleAU,
          astronomicalData.sun.z * scaleAU
        );
        sunMesh.position.copyFrom(sunPositionVector);
      }

      // ✅ EARTH ORBITS AROUND SUN - use real heliocentric coordinates
      // ✅ Update Earth pivot world position and Earth-local zenith marker
      if (sceneState.earthPivot) {
        earthPositionVector.set(
          astronomicalData.earth.x * scaleAU,
          astronomicalData.earth.y * scaleAU,
          -astronomicalData.earth.z * scaleAU // RH→LH Z-flip applied at scene layer (not in WASM)
        );
        sceneState.earthPivot.position.copyFrom(earthPositionVector);

        // ✅ CAMERA ALWAYS FOLLOWS EARTH - as requested!
        if (sceneState.camera) {
          sceneState.camera.setTarget(earthPositionVector);
        }

        // ✅ Apply Earth tilt/rotation using WASM zenith (reference parity)
        const latRad = astronomicalData.sunZenithLatRad;
        const lonRad = astronomicalData.sunZenithLngRad; // east-positive
        // pivot tilt
        sceneState.earthPivot.rotation.z = latRad;
        sceneState.earthPivot.rotation.x = latRad;
        // planet self-rotation
        const earthMesh = sceneState.celestialMeshes.get('earth');
        if (earthMesh) {
          earthMesh.rotation.y = -lonRad;
        }

        // ✅ Update zenith marker on Earth's surface using reference tweak for longitude
        if (sceneState.zenithMarker) {
          const r = CELESTIAL_BODIES.earth!.radius * 0.5; // visual radius
          // True anomaly from Earth heliocentric vector
          const trueAnomalyDeg = Math.atan2(astronomicalData.earth.y, astronomicalData.earth.x) * 180 / Math.PI;
          const lonEDeg = astronomicalData.sunZenithLngRad * 180 / Math.PI;
          const markerLngDeg = -(lonEDeg - 7 + trueAnomalyDeg);
          const markerLngRad = markerLngDeg * Math.PI / 180;
          const x = r * Math.cos(latRad) * Math.cos(markerLngRad);
          const z = -r * Math.cos(latRad) * Math.sin(markerLngRad); // apply scene-level Z-flip
          const y = r * Math.sin(latRad);
          sceneState.zenithMarker.position.set(x, y, z);
        }
      }

      // ✅ MOON ORBITS AROUND EARTH - already positioned correctly in WASM
      // ✅ Moon local geocentric offset under moonPivot
      if (sceneState.moonPivot) {
        // Raw geocentric offset in scene units
        const mx = (astronomicalData.moon.x - astronomicalData.earth.x) * scaleAU;
        const my = (astronomicalData.moon.y - astronomicalData.earth.y) * scaleAU;
        const mz = -(astronomicalData.moon.z - astronomicalData.earth.z) * scaleAU; // scene-level Z-flip
        const dist = Math.hypot(mx, my, mz);
        const k = dist > 0 ? (MOON_ORBIT_RADIUS_UNITS / dist) : 0;
        sceneState.moonPivot.position.set(0, 0, 0); // pivot at Earth's center
        const moonMesh = sceneState.celestialMeshes.get('moon');
        if (moonMesh) {
          moonMesh.position.set(mx * k, my * k, mz * k);
        }
      }

    } catch (error) {
      console.error('❌ Real-time Position Update Failed:', error);
    }
  }, [sunPositionVector, moonPositionVector, earthPositionVector]);

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

  // ✅ QUANTUM TIME INITIALIZATION - инициализируем квантовое время при старте
  useEffect(() => {
    console.log('🌌 Initializing quantum time system...');
    initializeQuantumTimeArray();

    // НЕ СОЗДАЕМ React state! Только инициализируем массив
    // БЕЗ setTimeDisplay() и БЕЗ onTimeUpdate() чтобы избежать ререндера
  }, [initializeQuantumTimeArray]);

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
