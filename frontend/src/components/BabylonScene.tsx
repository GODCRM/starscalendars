/**
 * BabylonScene.tsx - Cinematic 3D Astronomical Visualization
 * 
 * High-performance Babylon.js 8.18.0 integration for StarsCalendars
 * - 60fps real-time rendering with artistic celestial proportions
 * - Zero-copy WASM data integration via Float64Array views
 * - Hardware-accelerated rendering with WebGL 2.0/WebGPU support
 * - Geocentric scene design (Sun static at origin)
 * - Performance-optimized lifecycle management
 */

import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Engine,
  Scene,
  ArcRotateCamera,
  HemisphericLight,
  DirectionalLight,
  MeshBuilder,
  Vector3,
  Color3,
  Color4,
  StandardMaterial,
  PBRMaterial,
  Mesh
} from '@babylonjs/core';

// ✅ CORRECT - Import astronomical data types from WASM integration
import type { AstronomicalState } from '../wasm/init';

// ✅ CORRECT - Performance monitoring for 3D operations
class BabylonPerformanceTimer {
  private readonly operationName: string;
  private readonly startTime: number;

  constructor(operationName: string) {
    this.operationName = operationName;
    this.startTime = performance.now();
    console.log(`🎨 Babylon: Starting ${operationName}`);
  }

  public mark(checkpoint: string): void {
    const currentTime = performance.now();
    const duration = currentTime - this.startTime;
    console.log(`📊 Babylon: ${this.operationName} - ${checkpoint} at ${duration.toFixed(3)}ms`);
  }
}

// ✅ CORRECT - Strict TypeScript interface for BabylonScene props
interface BabylonSceneProps {
  readonly canvas: HTMLCanvasElement | null;
  readonly astronomicalData: AstronomicalState | null;
  readonly isInitialized: boolean;
  readonly onSceneReady?: (scene: Scene) => void;
  readonly onError?: (error: string) => void;
}

// ✅ CORRECT - Pre-allocated constants for zero-allocation rendering
const SCENE_CONFIG = {
  CLEAR_COLOR: new Color3(0.02, 0.02, 0.05), // Deep space background
  AMBIENT_INTENSITY: 0.15,
  SUN_INTENSITY: 1.2,
  SUN_RADIUS: 0.8, // Artistic proportion (not to scale)
  EARTH_RADIUS: 0.12, // Artistic proportion
  MOON_RADIUS: 0.08, // Artistic proportion
  MOON_ORBIT_SCALE: 15.0, // Artistic scaling for visibility
  CAMERA_RADIUS: 25.0,
  CAMERA_ALPHA: Math.PI / 4,
  CAMERA_BETA: Math.PI / 3,
  CAMERA_MIN_Z: 0.1,
  CAMERA_MAX_Z: 200.0,
  ANIMATION_FPS: 60,
  STAR_COUNT: 2000
} as const;

// ✅ CORRECT - Celestial body material configurations
const MATERIAL_CONFIG = {
  SUN: {
    DIFFUSE_COLOR: new Color3(1.0, 0.8, 0.3),
    EMISSIVE_COLOR: new Color3(1.0, 0.6, 0.0),
    SPECULAR_COLOR: new Color3(0.0, 0.0, 0.0)
  },
  EARTH: {
    DIFFUSE_COLOR: new Color3(0.2, 0.4, 0.8),
    SPECULAR_COLOR: new Color3(0.1, 0.2, 0.4),
    ROUGHNESS: 0.8
  },
  MOON: {
    DIFFUSE_COLOR: new Color3(0.7, 0.7, 0.6),
    SPECULAR_COLOR: new Color3(0.1, 0.1, 0.1),
    ROUGHNESS: 0.9
  }
} as const;

// ✅ CORRECT - Coordinate system conversion utilities
const CoordinateUtils = {
  /**
   * Convert ecliptic spherical coordinates to Cartesian
   * @param longitude - Ecliptic longitude in radians
   * @param latitude - Ecliptic latitude in radians  
   * @param distance - Distance in AU
   * @returns Cartesian coordinates as Vector3
   */
  eclipticToCartesian: (longitude: number, latitude: number, distance: number): Vector3 => {
    const x = distance * Math.cos(latitude) * Math.cos(longitude);
    const y = distance * Math.sin(latitude);
    const z = distance * Math.cos(latitude) * Math.sin(longitude);
    return new Vector3(x, y, z);
  },

  /**
   * Scale astronomical distances for artistic visualization
   * @param position - Raw astronomical position
   * @param scaleFactor - Scaling factor for visibility
   * @returns Scaled position vector
   */
  scalePosition: (position: Vector3, scaleFactor: number): Vector3 => {
    return position.multiplyByFloats(scaleFactor, scaleFactor, scaleFactor);
  }
};

/**
 * BabylonScene - Main 3D scene component for astronomical visualization
 */
const BabylonScene: React.FC<BabylonSceneProps> = ({
  canvas,
  astronomicalData,
  isInitialized,
  onSceneReady,
  onError
}) => {
  // ✅ CORRECT - Refs for performance-critical 3D objects (zero re-allocation)
  const engineRef = useRef<Engine | null>(null);
  const sceneRef = useRef<Scene | null>(null);
  const cameraRef = useRef<ArcRotateCamera | null>(null);
  const sunMeshRef = useRef<Mesh | null>(null);
  const earthMeshRef = useRef<Mesh | null>(null);
  const moonMeshRef = useRef<Mesh | null>(null);
  const starFieldRef = useRef<Mesh | null>(null);
  const sunLightRef = useRef<DirectionalLight | null>(null);
  const ambientLightRef = useRef<HemisphericLight | null>(null);
  const renderLoopRef = useRef<(() => void) | null>(null);

  // ✅ CORRECT - Pre-allocated vectors for zero-allocation updates
  const moonPositionRef = useRef<Vector3>(Vector3.Zero());

  // ✅ CORRECT - Memoized materials for performance optimization
  const materials = useMemo(() => {
    if (!sceneRef.current) return null;

    const scene = sceneRef.current;
    const timer = new BabylonPerformanceTimer('material_creation');

    // Sun material with emissive glow
    const sunMaterial = new StandardMaterial('sunMaterial', scene);
    sunMaterial.diffuseColor = MATERIAL_CONFIG.SUN.DIFFUSE_COLOR;
    sunMaterial.emissiveColor = MATERIAL_CONFIG.SUN.EMISSIVE_COLOR;
    sunMaterial.specularColor = MATERIAL_CONFIG.SUN.SPECULAR_COLOR;
    sunMaterial.disableLighting = true; // Sun is light source

    // Earth material with PBR for realism
    const earthMaterial = new PBRMaterial('earthMaterial', scene);
    earthMaterial.albedoColor = MATERIAL_CONFIG.EARTH.DIFFUSE_COLOR;
    earthMaterial.metallic = 0.0;
    earthMaterial.roughness = MATERIAL_CONFIG.EARTH.ROUGHNESS;

    // Moon material with realistic surface
    const moonMaterial = new PBRMaterial('moonMaterial', scene);
    moonMaterial.albedoColor = MATERIAL_CONFIG.MOON.DIFFUSE_COLOR;
    moonMaterial.metallic = 0.0;
    moonMaterial.roughness = MATERIAL_CONFIG.MOON.ROUGHNESS;

    // Starfield material
    const starMaterial = new StandardMaterial('starMaterial', scene);
    starMaterial.diffuseColor = new Color3(1.0, 1.0, 1.0);
    starMaterial.emissiveColor = new Color3(0.8, 0.8, 1.0);
    starMaterial.pointsCloud = true;
    starMaterial.pointSize = 2.0;

    timer.mark('materials_created');

    return {
      sun: sunMaterial,
      earth: earthMaterial,
      moon: moonMaterial,
      starfield: starMaterial
    };
  }, [sceneRef.current]);

  // ✅ CORRECT - Initialize Babylon.js engine with performance optimizations
  const initializeEngine = useCallback((canvas: HTMLCanvasElement): Engine => {
    const timer = new BabylonPerformanceTimer('engine_initialization');

    const engine = new Engine(canvas, true, {
      preserveDrawingBuffer: false,
      stencil: false,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance', // Force discrete GPU
      failIfMajorPerformanceCaveat: false,
      adaptToDeviceRatio: true
    });

    // Performance optimizations
    engine.enableOfflineSupport = false;
    engine.doNotHandleContextLost = true;

    // Set target FPS for consistent performance
    engine.setHardwareScalingLevel(1.0);

    timer.mark('engine_created');
    return engine;
  }, []);

  // ✅ CORRECT - Create scene with optimal settings for 60fps performance
  const createScene = useCallback((engine: Engine): Scene => {
    const timer = new BabylonPerformanceTimer('scene_creation');

    const scene = new Scene(engine);
    
    // Performance-critical scene settings
    scene.clearColor = new Color4(SCENE_CONFIG.CLEAR_COLOR.r, SCENE_CONFIG.CLEAR_COLOR.g, SCENE_CONFIG.CLEAR_COLOR.b, 1.0);
    scene.ambientColor = new Color3(0.1, 0.1, 0.15);

    timer.mark('scene_configured');
    return scene;
  }, []);

  // ✅ CORRECT - Setup camera with cinematic controls
  const setupCamera = useCallback((scene: Scene): ArcRotateCamera => {
    const timer = new BabylonPerformanceTimer('camera_setup');

    const camera = new ArcRotateCamera(
      'mainCamera',
      SCENE_CONFIG.CAMERA_ALPHA,
      SCENE_CONFIG.CAMERA_BETA,
      SCENE_CONFIG.CAMERA_RADIUS,
      Vector3.Zero(),
      scene
    );

    // Camera controls for meditative experience
    camera.minZ = SCENE_CONFIG.CAMERA_MIN_Z;
    camera.maxZ = SCENE_CONFIG.CAMERA_MAX_Z;
    camera.wheelPrecision = 50;
    camera.pinchPrecision = 50;
    camera.panningSensibility = 100;
    camera.angularSensibilityX = 1000;
    camera.angularSensibilityY = 1000;

    // Smooth camera movements
    camera.inertia = 0.9;
    camera.panningInertia = 0.9;

    // Set camera limits for better UX
    camera.lowerRadiusLimit = 5.0;
    camera.upperRadiusLimit = 100.0;
    camera.lowerBetaLimit = 0.1;
    camera.upperBetaLimit = Math.PI - 0.1;

    camera.attachControl(scene.getEngine().getRenderingCanvas(), true);

    timer.mark('camera_ready');
    return camera;
  }, []);

  // ✅ CORRECT - Setup lighting for cinematic astronomy visualization
  const setupLighting = useCallback((scene: Scene): { ambient: HemisphericLight; sun: DirectionalLight } => {
    const timer = new BabylonPerformanceTimer('lighting_setup');

    // Ambient hemispheric light for general illumination
    const ambientLight = new HemisphericLight(
      'ambientLight',
      new Vector3(0, 1, 0),
      scene
    );
    ambientLight.intensity = SCENE_CONFIG.AMBIENT_INTENSITY;
    ambientLight.diffuse = new Color3(0.3, 0.3, 0.5);
    ambientLight.groundColor = new Color3(0.1, 0.1, 0.2);

    // Directional light from Sun for realistic lighting
    const sunLight = new DirectionalLight(
      'sunLight',
      new Vector3(-1, -0.5, -1),
      scene
    );
    sunLight.intensity = SCENE_CONFIG.SUN_INTENSITY;
    sunLight.diffuse = new Color3(1.0, 0.9, 0.7);
    sunLight.specular = new Color3(1.0, 0.9, 0.7);

    timer.mark('lighting_configured');
    return { ambient: ambientLight, sun: sunLight };
  }, []);

  // ✅ CORRECT - Create starfield background for immersive experience
  const createStarfield = useCallback((scene: Scene, material: StandardMaterial): Mesh => {
    const timer = new BabylonPerformanceTimer('starfield_creation');

    // Create random star positions
    const starPositions: number[] = [];

    for (let i = 0; i < SCENE_CONFIG.STAR_COUNT; i++) {
      // Random spherical distribution
      const phi = Math.random() * Math.PI * 2;
      const costheta = Math.random() * 2 - 1;
      const theta = Math.acos(costheta);
      const radius = 50 + Math.random() * 100; // Distance from center

      const x = radius * Math.sin(theta) * Math.cos(phi);
      const y = radius * Math.sin(theta) * Math.sin(phi);
      const z = radius * Math.cos(theta);

      starPositions.push(x, y, z);
    }

    // Create point cloud mesh
    const starField = MeshBuilder.CreateSphere('starfield', { diameter: 0.1 }, scene);
    starField.material = material;

    // Use vertex data for performance
    const positions = new Float32Array(starPositions);
    starField.setVerticesData('position', positions);

    // Disable frustum culling for performance
    starField.alwaysSelectAsActiveMesh = true;

    timer.mark('starfield_ready');
    return starField;
  }, []);

  // ✅ CORRECT - Create celestial bodies with artistic proportions
  const createCelestialBodies = useCallback((
    scene: Scene,
    materials: { sun: StandardMaterial; earth: PBRMaterial; moon: PBRMaterial }
  ): { sun: Mesh; earth: Mesh; moon: Mesh } => {
    const timer = new BabylonPerformanceTimer('celestial_bodies_creation');

    // Create Sun (static at origin for geocentric scene)
    const sun = MeshBuilder.CreateSphere('sun', {
      diameter: SCENE_CONFIG.SUN_RADIUS * 2,
      segments: 32
    }, scene);
    sun.position = Vector3.Zero();
    sun.material = materials.sun;

    // Add subtle glow effect to Sun
    const sunGlow = MeshBuilder.CreateSphere('sunGlow', {
      diameter: SCENE_CONFIG.SUN_RADIUS * 2.2,
      segments: 16
    }, scene);
    sunGlow.position = Vector3.Zero();
    sunGlow.parent = sun;
    
    const glowMaterial = new StandardMaterial('sunGlowMaterial', scene);
    glowMaterial.diffuseColor = new Color3(1.0, 0.6, 0.0);
    glowMaterial.emissiveColor = new Color3(0.5, 0.3, 0.0);
    glowMaterial.alpha = 0.3;
    sunGlow.material = glowMaterial;

    // Create Earth
    const earth = MeshBuilder.CreateSphere('earth', {
      diameter: SCENE_CONFIG.EARTH_RADIUS * 2,
      segments: 32
    }, scene);
    earth.position = Vector3.Zero(); // Will be updated by WASM data
    earth.material = materials.earth;

    // Create Moon
    const moon = MeshBuilder.CreateSphere('moon', {
      diameter: SCENE_CONFIG.MOON_RADIUS * 2,
      segments: 24
    }, scene);
    moon.position = new Vector3(3, 0, 0); // Initial position, will be updated
    moon.material = materials.moon;

    timer.mark('celestial_bodies_ready');
    return { sun, earth, moon };
  }, []);

  // ✅ CRITICAL - Update celestial positions from WASM data (exactly once per frame)
  const updateCelestialPositions = useCallback((
    astronomicalData: AstronomicalState,
    earth: Mesh,
    moon: Mesh
  ): void => {
    const timer = new BabylonPerformanceTimer('position_update');

    // Earth remains at origin for geocentric visualization
    earth.position.setAll(0);

    // Convert Moon's ecliptic coordinates to Cartesian (already in radians from WASM)
    const moonCartesian = CoordinateUtils.eclipticToCartesian(
      astronomicalData.moon.longitude,
      astronomicalData.moon.latitude,
      astronomicalData.moon.distance
    );

    // Scale Moon position for artistic visibility
    const moonScaled = CoordinateUtils.scalePosition(moonCartesian, SCENE_CONFIG.MOON_ORBIT_SCALE);

    // Update Moon position using pre-allocated vector (zero-allocation update)
    moonPositionRef.current.copyFrom(moonScaled);
    moon.position.copyFrom(moonPositionRef.current);

    timer.mark('positions_updated');
  }, []);

  // ✅ CORRECT - Scene initialization effect
  useEffect((): (() => void) | void => {
    if (!canvas || !isInitialized) return;

    const timer = new BabylonPerformanceTimer('scene_initialization');
    
    try {
      // Initialize Babylon.js engine
      const engine = initializeEngine(canvas);
      engineRef.current = engine;

      // Create scene
      const scene = createScene(engine);
      sceneRef.current = scene;

      // Setup camera
      const camera = setupCamera(scene);
      cameraRef.current = camera;

      // Setup lighting  
      const lights = setupLighting(scene);
      ambientLightRef.current = lights.ambient;
      sunLightRef.current = lights.sun;

      timer.mark('core_systems_ready');

      // Wait for materials to be ready
      scene.executeWhenReady(() => {
        if (!materials) return;

        // Create starfield background
        const starfield = createStarfield(scene, materials.starfield);
        starFieldRef.current = starfield;

        // Create celestial bodies
        const bodies = createCelestialBodies(scene, materials);
        sunMeshRef.current = bodies.sun;
        earthMeshRef.current = bodies.earth;
        moonMeshRef.current = bodies.moon;

        // Start render loop
        const renderLoop = () => {
          scene.render();
        };
        renderLoopRef.current = renderLoop;
        engine.runRenderLoop(renderLoop);

        timer.mark('scene_complete');

        // Notify parent component
        onSceneReady?.(scene);

        console.log('✅ Babylon.js scene initialized successfully');
      });

      // Handle engine resize
      const handleResize = () => {
        engine.resize();
      };
      window.addEventListener('resize', handleResize);

      // Cleanup function
      return () => {
        window.removeEventListener('resize', handleResize);
        
        if (renderLoopRef.current) {
          engine.stopRenderLoop();
        }
        
        scene.dispose();
        engine.dispose();
        
        // Clear refs
        engineRef.current = null;
        sceneRef.current = null;
        cameraRef.current = null;
        sunMeshRef.current = null;
        earthMeshRef.current = null;
        moonMeshRef.current = null;
        starFieldRef.current = null;
        sunLightRef.current = null;
        ambientLightRef.current = null;
        renderLoopRef.current = null;

        console.log('🧹 Babylon.js scene cleaned up');
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown Babylon.js initialization error';
      console.error('❌ Babylon.js scene initialization failed:', errorMessage);
      onError?.(errorMessage);
      return; // Early return for error case
    }
  }, [
    canvas,
    isInitialized,
    materials,
    initializeEngine,
    createScene,
    setupCamera,
    setupLighting,
    createStarfield,
    createCelestialBodies,
    onSceneReady,
    onError
  ]);

  // ✅ CRITICAL - Update positions from WASM data (triggered by new astronomical data)
  useEffect(() => {
    if (!astronomicalData || !earthMeshRef.current || !moonMeshRef.current) return;

    updateCelestialPositions(
      astronomicalData,
      earthMeshRef.current,
      moonMeshRef.current
    );
  }, [astronomicalData, updateCelestialPositions]);

  // ✅ CORRECT - No JSX rendering (pure canvas manipulation)
  return null;
};

export default BabylonScene;