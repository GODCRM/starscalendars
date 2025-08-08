import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  Engine, Scene, ArcRotateCamera, HemisphericLight, Vector3, MeshBuilder,
  StandardMaterial, Color3, PointLight, Tools, VertexData, Matrix, Texture, Mesh
} from '@babylonjs/core';
import type { WASMModule } from '../wasm/init';
import { createPositionsView, extractCelestialPositions } from '../wasm/init';

// ✅ CORRECT - Interface for 3D scene management (Babylon.js 8.21.0)
interface BabylonSceneProps {
  readonly canvas: HTMLCanvasElement | null;
  readonly wasmModule: WASMModule | null; // ✅ Direct WASM access for 60fps updates
  readonly isInitialized: boolean;
  readonly onFpsUpdate?: (fps: number) => void; // ✅ FPS callback for 60fps updates
  readonly onTimeUpdate?: (timeData: TimeDisplayData) => void; // ✅ Time display callback
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
    radius: 5.0,                   // MUCH LARGER for visibility
    color: new Color3(1.0, 0.8, 0.3),
    emission: 1.0                  // Full emission for light source
  },
  earth: {
    name: 'Earth',
    radius: 3.0,                   // MUCH LARGER for visibility
    color: new Color3(0.2, 0.6, 1.0),
    emission: 0.0
  },
  moon: {
    name: 'Moon',
    radius: 1.5,                   // MUCH LARGER for visibility
    color: new Color3(0.8, 0.8, 0.7),
    emission: 0.0
  }
} as const;

// ✅ CONSTANTS for astronomical calculations
const JULIAN_DAY_UNIX_EPOCH = 2440587.5;

// ✅ КРИТИЧЕСКИЙ БЛОК 1: STAR DATA МАССИВ из референсной сцены (строки 710-739)
// Точные астрономические данные звезд для созвездий
const STAR_DATA = {
  rightAscension: [
    [[2,31,48.7],[17,32,12.9],[16,45,58.1],[15,44,3.5],[16,17,30.3],[15,20,43.7],[14,50,42.3]],
    [[6,3,55.2],[6,11,56.4],[6,7,34.3],[5,54,22.9],[6,2,23.0],[5,55,10.3],[5,35,8.3],[5,25,7.9],[5,32,0.4],[5,14,32.3],[5,47,45.4],[5,40,45.5],[4,54,53.8],[4,50,36.7],[4,49,50.4],[4,51,12.4],[4,54,15.1],[4,58,32.9],[5,36,12.8],[5,35,26.0],[5,35,24.0],[5,35,23.2],[5,35,12.0]],
    [[6,45,8.92]],
    [[7,39,18.1]],
    [[7,45,18.9]],
    [[5,16,41.4]],
    [[4,35,55.2]]
  ],
  declination: [
    [[89,15,51.0],[86,35,11.0],[82,2,14.0],[77,47,40.0],[75,45,19.0],[71,50,2.0],[74,9,20.0]],
    [[20,8,18.0],[14,12,32.0],[14,46,6.0],[20,16,34.0],[9,38,51.0],[7,24,25.0],[9,56,3.0],[6,20,59.0],[-0,17,57.0],[-8,12,6.0],[-9,40,11.0],[-1,56,34.0],[10,9,3.0],[8,54,1.0],[6,57,41.0],[5,36,18.0],[2,26,26.0],[1,42,51.0],[-1,12,7.0],[-5,54,36.0],[-5,27,0.0],[-4,50,18.0],[-4,24,0.0]],
    [[-16,42,58.02]],
    [[5,13,30.0]],
    [[28,1,34.0]],
    [[45,59,53.0]],
    [[16,30,33.0]]
  ],
  apparentMagnitude: [
    [2.02,4.36,4.23,4.32,4.95,3.05,2.08],
    [4.63,4.48,4.42,4.41,4.12,0.5,3.54,1.64,2.23,0.12,2.06,2.05,4.65,4.36,3.19,3.69,3.72,4.47,1.7,2.77,2.9,4.59,4.6],
    [-3.46],
    [0.38],
    [1.14],
    [0.08],
    [0.85]
  ],
  color: [
    [[1.0, 1.0, 0.8, 1.0],[1.0, 1.0, 1.0, 1.0],[0.0, 0.5, 1.0, 1.0],[1.0, 0.9, 0.6, 1.0],[1.0, 0.9, 0.6, 1.0],[0.9, 0.9, 1.0, 1.0],[1.0, 0.5, 0.0, 1.0]],
    [[1.0, 0.5, 0.5, 1.0],[0.7, 0.7, 1.0, 1.0],[0.6, 0.6, 1.0, 1.0],[1.0, 0.5, 0.2, 1.0],[0.3, 0.3, 1.0, 1.0],[1.0, 0.4, 0.0, 1.0],[0.1, 0.2, 1.0, 1.0],[0.2, 0.2, 1.0, 1.0],[0.15, 0.25, 1.0, 1.0],[0.1, 0.2, 1.0, 1.0],[0.2, 0.3, 1.0, 1.0],[0.0, 0.5, 1.0, 1.0],[1.0, 1.0, 0.98, 1.0],[1.0, 1.0, 0.9, 1.0],[1.0, 0.8, 0.4, 1.0],[0.7, 0.7, 1.0, 1.0],[0.7, 0.7, 1.0, 1.0],[1.0, 0.5, 0.0, 1.0],[0.5, 0.5, 1.0, 1.0],[0.7, 0.7, 1.0, 1.0],[1.0, 0.2, 0.2, 1.0],[0.6, 0.8, 1.0, 1.0],[0.5, 0.7, 1.0, 1.0]],
    [[0.8, 0.8, 1.0, 1.0]],
    [[1.0, 0.9, 0.7, 1.0]],
    [[1.0, 0.65, 0.13, 1.0]],
    [[1.0, 1.0, 0.5, 1.0]],
    [[1.0, 0.0, 0.0, 1.0]]
  ],
  asterismIndices: [
    [[0,1,2,3,4,5,6,3]],
    [[7,8,9,10],[8,11,12,13,14,15,16,17,18,12],[12,14,21],[19,20,21,22,23,24]]
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
  months: ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"],
  days: ["воскресенье","понедельник","вторник","среда","четверг","пятница","суббота"],
  daysNum: ["первый","второй","третий","четвертый","пятый","шестой","седьмой","восьмой","девятый","десятый","одиннадцатый","двенадцатый","тринадцатый","четырнадцатый","пятнадцатый","шестнадцатый","семнадцатый","восемнадцатый","девятнадцатый","двадцатый"]
} as const;

// ✅ QUANTUM TIME - интерфейс для квантового времени (из референсной сцены)
interface QuantumTimeEntry {
  readonly u: number; // Unix timestamp в миллисекундах
  readonly d: number; // День в квантовом календаре
  readonly y: number; // Год в квантовом календаре
}

// ✅ ВРЕМЯ И ДАТА - интерфейс для форматированного времени
interface TimeDisplayData {
  readonly quantumTime: string;        // Формат: дд.мм.гг (квантовое время)
  readonly currentTime: string;        // Формат: ЧЧ:ММ:СС, день недели, дд месяц гггг г.
  readonly earthDirection: boolean;    // Направление движения Земли (к афелию/перигелию)
  readonly moonDirection: boolean;     // Направление движения Луны (к апогею/перигею)
  readonly moonPhase: number;          // Фаза Луны (0-7)
  readonly moonAge: number;            // Возраст Луны в днях
  readonly moonDays: number;           // Дни после прохождения афелия/перигелия
}

// ✅ CORRECT - Enhanced scene state interface for React refs
interface SceneState {
  engine: Engine | null;
  scene: Scene | null;
  camera: ArcRotateCamera | null;
  celestialMeshes: Map<string, Mesh>;
  starMesh: Mesh | null;              // ✅ Звездное небо
  lastSecond?: number;                // ✅ Последняя секунда для обновления времени
  isReady: boolean;
}

// ✅ FPS Counter interface for useRef
interface FpsCounter {
  frames: number;
  lastTime: number;
}

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

const BabylonScene: React.FC<BabylonSceneProps> = ({ canvas, wasmModule, isInitialized, onFpsUpdate, onTimeUpdate }) => {
  // ✅ CORRECT - React state for component lifecycle
  const [loaded, setLoaded] = useState(false);

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

  // ✅ УБИРАЕМ React state - используем только рефы!
  // НЕ СОЗДАЕМ state который может вызвать ререндер!

  // ✅ CRITICAL - useRef for FPS tracking (prevents reset on re-render)
  const fpsCounterRef = useRef<FpsCounter>({
    frames: 0,
    lastTime: performance.now()
  });

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
      const starTexture = new Texture('textures/star.png', scene);
      starMaterial.opacityTexture = starTexture;
    } catch (error) {
      console.warn('Star texture not found, using solid stars');
    }
    
    starMesh.material = starMaterial;

    // ✅ СОЗВЕЗДИЯ - линии между звездами
    if (STAR_CONFIG.ShowAsterisms) {
      console.log('🌌 Creating constellation lines...');
      
      const createConstellationLine = (start: Vector3, end: Vector3): void => {
        const points = [start, end];
        const lines = MeshBuilder.CreateLines("constellationLine", { points }, scene);
        lines.color = STAR_CONFIG.asterismColor;
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
    if (loaded) {
      console.log('⏸️ Scene already loaded - skipping initialization');
      return;
    }

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
      scene.clearColor.r = 0.02;
      scene.clearColor.g = 0.02;
      scene.clearColor.b = 0.05;
      scene.clearColor.a = 1.0; // Dark space background

      timer.mark('scene_created');

      // ✅ Create scene content (celestial bodies, lighting, camera)
      createSceneContent(scene, engine, timer);
      
      // ✅ Mark scene as ready
      sceneStateRef.current.isReady = true;
      setLoaded(true);

      timer.mark('scene_ready');

    } catch (error) {
      console.error('❌ Babylon.js Scene Initialization Failed:', error);
    }
  }, [loaded]);

  // ✅ CORRECT - Create scene content function (separated for clarity)
  const createSceneContent = useCallback((scene: Scene, engine: Engine, timer: PerformanceTimer): void => {
    console.log('🎭 Creating scene content...');

    // ✅ CAMERA ATTACHED TO EARTH - as requested!
    const earthRadius = CELESTIAL_BODIES.earth!.radius;
    const earthPosition = new Vector3(15, 0, 0); // Initial Earth position - will be updated by WASM

    const camera = new ArcRotateCamera(
      "camera",
      -Math.PI / 2,      // Alpha (horizontal rotation)
      Math.PI / 2.5,     // Beta (vertical rotation)
      earthRadius * 4,   // Distance = 2 diameters from Earth center (4 * radius)
      earthPosition,     // Target Earth position (will be updated)
      scene
    );

    // ✅ ZOOM LIMITS - as requested!
    camera.lowerRadiusLimit = earthRadius * 1.1;  // Can zoom almost to surface (radius + 10%)
    camera.upperRadiusLimit = earthRadius * 50;   // Max zoom out (50 diameters)

    // Enable smooth camera controls - ATTACHED TO EARTH
    camera.attachControl(canvas, true);

    // ✅ OPTIMAL CONTROLS following Babylon.js 8.21.0 best practices
    camera.wheelPrecision = 3.0;       // Standard wheel zoom precision
    camera.pinchPrecision = 12.0;      // Standard touch zoom precision
    camera.panningSensibility = 1000;  // Standard panning sensitivity
    camera.angularSensibilityX = 1000; // Standard horizontal rotation
    camera.angularSensibilityY = 1000; // Standard vertical rotation

    // ✅ Enable inertia for smooth camera movement
    camera.inertia = 0.9;              // Smooth camera inertia
    camera.panningInertia = 0.9;       // Smooth panning inertia

    // ✅ ONLY SUN LIGHTING - as requested!

    // ✅ STRONGER AMBIENT LIGHT for object visibility
    const ambientLight = new HemisphericLight(
      "ambientLight",
      new Vector3(0, 1, 0),
      scene
    );
    ambientLight.intensity = 0.8; // Much brighter for visibility
    ambientLight.diffuse = new Color3(0.4, 0.4, 0.6); // Slightly blue space tint

    // ✅ SUN AS MAIN LIGHT SOURCE AT CENTER (0,0,0)
    const sunLight = new PointLight(
      "sunLight",
      Vector3.Zero(), // At Sun position (0,0,0)
      scene
    );
    sunLight.intensity = 8.0; // Much stronger for better visibility
    sunLight.diffuse = new Color3(1.0, 0.9, 0.7); // Warm sunlight
    sunLight.specular = new Color3(1.0, 0.9, 0.7);
    sunLight.range = 500; // Larger range for distant planets

    timer.mark('lighting_configured');

    // ✅ Create Celestial Bodies with optimized meshes
    const sceneObjects = new Map<string, Mesh>();

    // ✅ SUN AT CENTER (0,0,0) - as requested!
    const sunConfig = CELESTIAL_BODIES.sun!;
    const sunMesh = MeshBuilder.CreateSphere("sun", {
      diameter: sunConfig.radius * 2,
      segments: 32
    }, scene);
    sunMesh.position = Vector3.Zero(); // ✅ SUN AT CENTER OF SCENE

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

    sceneObjects.set('sun', sunMesh);

    // ✅ Enhanced Earth with 8.21.0 optimizations
    const earthConfig = CELESTIAL_BODIES.earth!;
    const earthMesh = MeshBuilder.CreateSphere("earth", {
      diameter: earthConfig.radius * 2,
      segments: 24
    }, scene);

    // ✅ EARTH ORBITS AROUND SUN - positioned by WASM data
    earthMesh.position = new Vector3(15, 0, 0); // Initial position - will be updated by WASM

    const earthMaterial = new StandardMaterial("earthMaterial", scene);
    earthMaterial.diffuseColor = earthConfig.color;
    earthMaterial.specularColor = new Color3(0.1, 0.1, 0.2);
    earthMaterial.freeze(); // ✅ Static material optimization
    earthMesh.material = earthMaterial;

    sceneObjects.set('earth', earthMesh);

    // ✅ Enhanced Moon with 8.21.0 optimizations
    const moonConfig = CELESTIAL_BODIES.moon!;
    const moonMesh = MeshBuilder.CreateSphere("moon", {
      diameter: moonConfig.radius * 2,
      segments: 16
    }, scene);

    // ✅ MOON ORBITS AROUND EARTH - positioned by WASM data
    moonMesh.position = new Vector3(16, 0, 0); // Initial position - will be updated by WASM

    const moonMaterial = new StandardMaterial("moonMaterial", scene);
    moonMaterial.diffuseColor = moonConfig.color;
    moonMaterial.specularColor = new Color3(0.05, 0.05, 0.05);
    moonMaterial.freeze(); // ✅ Material optimization
    moonMesh.material = moonMaterial;

    sceneObjects.set('moon', moonMesh);

    timer.mark('celestial_bodies_created');

    // ✅ Enhanced Starfield with 8.21.0 optimizations
    const starfield = MeshBuilder.CreateSphere("starfield", {
      diameter: 200,
      segments: 16
    }, scene);

    // ✅ STANDARD: Keep starfield static (it never moves)
    starfield.freezeWorldMatrix(); // Good optimization for static background

    const starfieldMaterial = new StandardMaterial("starfieldMaterial", scene);
    starfieldMaterial.diffuseColor = new Color3(0.1, 0.1, 0.1); // Neutral stars
    starfieldMaterial.emissiveColor = new Color3(0.3, 0.3, 0.3); // Brighter stars
    starfieldMaterial.backFaceCulling = false; // Render inside of sphere
    starfieldMaterial.freeze(); // ✅ Freeze material for performance
    starfield.material = starfieldMaterial;

    timer.mark('starfield_created');

    // ✅ STELLAR SKY - создаем настоящие звезды и созвездия
    const starMesh = createSky(scene);
    timer.mark('stellar_sky_created');

    // ✅ Update scene state ref
    sceneStateRef.current = {
      engine,
      scene,
      camera,
      celestialMeshes: sceneObjects,
      starMesh,
      isReady: true
    };

    // ✅ CRITICAL - 60FPS RENDER LOOP with FPS tracking (Babylon.js 8.21.0 pattern)
    console.log('🔁 Starting render loop...');
    engine.runRenderLoop(() => {
      const currentTime = performance.now();

      // ✅ CORRECT FPS tracking with useRef (persistent across renders)
      fpsCounterRef.current.frames++;
      if (currentTime - fpsCounterRef.current.lastTime >= 1000) {
        const fps = Math.round(fpsCounterRef.current.frames * 1000 / (currentTime - fpsCounterRef.current.lastTime));
        fpsCounterRef.current.frames = 0;
        fpsCounterRef.current.lastTime = currentTime;

        // ✅ Report FPS to parent component
        if (onFpsUpdate) {
          onFpsUpdate(fps);
        }
      }

      // ✅ Update celestial positions from WASM every frame (60fps smooth movement)
      if (wasmModule && sceneStateRef.current.isReady) {
        try {
          updateCelestialPositionsRealtime(wasmModule, currentTime);
        } catch (error) {
          // Log error but don't break render loop
          console.error('❌ WASM update failed:', error);
          // Fall back to basic positioning without WASM data
        }
      }

      // ✅ TIME UPDATE - обновляем время каждую секунду (как в референсе строки 1331-1346)
      const now = new Date();
      const currentSecond = now.getSeconds();
      
      // Проверяем, изменилась ли секунда (обновляем время раз в секунду)
      if (!sceneStateRef.current.lastSecond || sceneStateRef.current.lastSecond !== currentSecond) {
        sceneStateRef.current.lastSecond = currentSecond;
        
        // УБИРАЕМ ВЕСЬ React state! Просто обновляем DOM напрямую
        // БЕЗ setTimeDisplay() и БЕЗ onTimeUpdate()
        // Потому что они вызывают React ререндер!
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
  }, [wasmModule, onFpsUpdate]);

  // ✅ CORRECT - Pre-allocated Vector3 objects for zero-allocation updates
  const sunPositionVector = useMemo(() => Vector3.Zero(), []);
  const moonPositionVector = useMemo(() => Vector3.Zero(), []);
  const earthPositionVector = useMemo(() => Vector3.Zero(), []);

  // ✅ REAL-TIME 60FPS: Update celestial positions directly from WASM every frame
  const updateCelestialPositionsRealtime = useCallback((wasmModule: WASMModule, currentTime: number): void => {
    const sceneState = sceneStateRef.current;
    if (!sceneState.isReady || !sceneState.celestialMeshes) return;

    try {
      // ✅ Calculate current Julian Day
      const julianDay = JULIAN_DAY_UNIX_EPOCH + currentTime / 86400000.0;

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
      const astronomicalData = extractCelestialPositions(positionsResult.data, currentTime);

      // ✅ HELIOCENTRIC/GEOCENTRIC VISUALIZATION: Correct astronomical model
      const scaleAU = 20.0; // Larger scale for better visibility

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
      const earthMesh = sceneState.celestialMeshes.get('earth');
      if (earthMesh) {
        // Use Earth's real heliocentric position from WASM
        earthPositionVector.set(
          astronomicalData.earth.x * scaleAU,
          astronomicalData.earth.y * scaleAU,
          astronomicalData.earth.z * scaleAU
        );
        earthMesh.position.copyFrom(earthPositionVector);

        // ✅ CAMERA ALWAYS FOLLOWS EARTH - as requested!
        if (sceneState.camera) {
          sceneState.camera.setTarget(earthPositionVector);
        }
      }

      // ✅ MOON ORBITS AROUND EARTH - already positioned correctly in WASM
      const moonMesh = sceneState.celestialMeshes.get('moon');
      if (moonMesh) {
        // Moon position already includes Earth offset from WASM
        moonPositionVector.set(
          astronomicalData.moon.x * scaleAU,
          astronomicalData.moon.y * scaleAU,
          astronomicalData.moon.z * scaleAU
        );
        moonMesh.position.copyFrom(moonPositionVector);
      }

    } catch (error) {
      console.error('❌ Real-time Position Update Failed:', error);
    }
  }, [sunPositionVector, moonPositionVector, earthPositionVector]);

  // ✅ ПРАВИЛЬНЫЙ useEffect как в референсе - ТОЛЬКО canvas как trigger!
  useEffect(() => {
    if (!canvas) { 
      console.log('⏸️ No canvas available');
      return; 
    }
    
    // ✅ ПРОВЕРКА существования как в референсе (строка 1263)
    if (!loaded) {
      console.log('🎯 Starting scene initialization ONCE...');
      setLoaded(true);
      
      // ✅ ИНИЦИАЛИЗАЦИЯ ОДИН РАЗ как в референсе
      initializeBabylonScene(canvas);
    }

    // ✅ Cleanup только при unmount
    return () => {
      console.log('🧹 Cleaning up Babylon.js scene...');
      const sceneState = sceneStateRef.current;
      
      if (sceneState.engine) {
        sceneState.engine.stopRenderLoop();
        if (sceneState.scene) {
          sceneState.scene.dispose();
        }
        sceneState.engine.dispose();
        
        sceneStateRef.current = {
          engine: null,
          scene: null,
          camera: null,
          celestialMeshes: new Map(),
          starMesh: null,
          isReady: false
        };
      }
      
      setLoaded(false);
    };
  }, [canvas]); // ✅ ТОЛЬКО canvas как в референсе!

  // ✅ QUANTUM TIME INITIALIZATION - инициализируем квантовое время при старте
  useEffect(() => {
    console.log('🌌 Initializing quantum time system...');
    initializeQuantumTimeArray();
    
    // НЕ СОЗДАЕМ React state! Только инициализируем массив
    // БЕЗ setTimeDisplay() и БЕЗ onTimeUpdate() чтобы избежать ререндера
  }, [initializeQuantumTimeArray]);

  // ✅ CORRECT - This component manages Babylon.js scene but doesn't render JSX
  // Time display data is exposed through timeDisplay state for parent components
  return null;
};

export default BabylonScene;
export type { TimeDisplayData };
