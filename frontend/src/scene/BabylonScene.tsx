import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import { Engine, Scene, ArcRotateCamera, HemisphericLight, Vector3, MeshBuilder, StandardMaterial, Color3, DirectionalLight, PointLight } from '@babylonjs/core';
import type { Mesh } from '@babylonjs/core';
import type { AstronomicalState } from '../wasm/init';

// ✅ CORRECT - Interface for 3D scene management (Babylon.js 8.20.0)
interface BabylonSceneProps {
  readonly canvas: HTMLCanvasElement | null;
  readonly astronomicalData: AstronomicalState | null;
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

// ✅ CORRECT - Pre-configured celestial bodies with artistic proportions  
const CELESTIAL_BODIES: Record<string, CelestialBodyConfig> = {
  sun: {
    name: 'Sun',
    radius: 0.2,                   // Artistic size for visibility
    color: new Color3(1.0, 0.8, 0.3),
    emission: 1.0                  // Full emission for light source
  },
  earth: {
    name: 'Earth', 
    radius: 0.05,
    color: new Color3(0.2, 0.6, 1.0),
    emission: 0.0
  },
  moon: {
    name: 'Moon',
    radius: 0.02,
    color: new Color3(0.8, 0.8, 0.7),
    emission: 0.0
  }
} as const;

// ✅ CORRECT - Performance timer for 60fps monitoring
class BabylonPerformanceTimer {
  private readonly operationName: string;
  private readonly startTime: number;

  constructor(operationName: string) {
    this.operationName = operationName;
    this.startTime = performance.now();
    console.log(`🎬 Babylon.js: Starting ${operationName}`);
  }

  public mark(checkpoint: string): void {
    const currentTime = performance.now();
    const duration = currentTime - this.startTime;
    console.log(`🎭 Babylon.js: ${this.operationName} - ${checkpoint} at ${duration.toFixed(3)}ms`);
  }
}

// ✅ CORRECT - Scene management state interface
interface SceneState {
  readonly engine: Engine | null;
  readonly scene: Scene | null;
  readonly camera: ArcRotateCamera | null;
  readonly celestialMeshes: Map<string, Mesh>;
  readonly isReady: boolean;
}

const BabylonScene: React.FC<BabylonSceneProps> = ({ canvas, astronomicalData, isInitialized }) => {
  // ✅ CORRECT - Scene state management with refs for performance
  const sceneStateRef = useRef<SceneState>({
    engine: null,
    scene: null,
    camera: null,
    celestialMeshes: new Map(),
    isReady: false
  });

  const renderLoopRef = useRef<number>(0);
  const lastUpdateTimeRef = useRef<number>(0);

  // ✅ CORRECT - Initialize Babylon.js Engine and Scene (8.20.0 API)
  const initializeBabylonScene = useCallback(async (canvas: HTMLCanvasElement): Promise<void> => {
    const timer = new BabylonPerformanceTimer('babylon_scene_initialization');

    try {
      // Create Engine with optimized settings for 60fps
      const engine = new Engine(canvas, true, {
        preserveDrawingBuffer: true,
        stencil: true,
        antialias: true,
        powerPreference: "high-performance"
      });

      timer.mark('engine_created');

      // Create Scene
      const scene = new Scene(engine);
      scene.useRightHandedSystem = true; // For astronomical coordinate system compatibility

      timer.mark('scene_created');

      // Setup Camera for cinematic experience (медитативный опыт)
      const camera = new ArcRotateCamera(
        "camera",
        -Math.PI / 2,      // Alpha (horizontal rotation)
        Math.PI / 2.5,     // Beta (vertical rotation) 
        10,                // Radius (distance from target)
        Vector3.Zero(),    // Target at origin (Sun position)
        scene
      );

      // Enable smooth camera controls
      camera.attachControl(canvas, true);
      camera.setTarget(Vector3.Zero());
      
      // Cinematic camera settings
      camera.wheelPrecision = 10;        // Smooth zoom
      camera.pinchPrecision = 50;        // Touch zoom sensitivity
      camera.panningSensibility = 1000;  // Smooth panning
      camera.angularSensibilityX = 1000; // Horizontal rotation sensitivity
      camera.angularSensibilityY = 1000; // Vertical rotation sensitivity

      timer.mark('camera_configured');

      // Setup Lighting System for astronomical visualization
      
      // 1. Ambient light for general illumination
      const ambientLight = new HemisphericLight(
        "ambientLight",
        new Vector3(0, 1, 0),
        scene
      );
      ambientLight.intensity = 0.3;
      ambientLight.diffuse = new Color3(0.8, 0.8, 1.0); // Slight blue tint

      // 2. Sun as primary directional light source
      const sunLight = new PointLight(
        "sunLight",
        Vector3.Zero(), // At Sun position (0,0,0)
        scene
      );
      sunLight.intensity = 2.0;
      sunLight.diffuse = new Color3(1.0, 0.9, 0.7); // Warm sunlight
      sunLight.specular = new Color3(1.0, 0.9, 0.7);

      // 3. Fill light for better visibility of distant objects
      const fillLight = new DirectionalLight(
        "fillLight",
        new Vector3(-1, -0.5, -1),
        scene
      );
      fillLight.intensity = 0.5;
      fillLight.diffuse = new Color3(0.7, 0.8, 1.0); // Cool fill light

      timer.mark('lighting_configured');

      // Create Celestial Bodies
      const celestialMeshes = new Map<string, Mesh>();

      // Create Sun (will be positioned by WASM data in geocentric scene)
      const sunConfig = CELESTIAL_BODIES.sun!;
      const sunMesh = MeshBuilder.CreateSphere("sun", {
        diameter: sunConfig.radius * 2,
        segments: 32
      }, scene);
      sunMesh.position = Vector3.Zero(); // Initial position - will be updated by WASM data

      // Sun material with emission
      const sunMaterial = new StandardMaterial("sunMaterial", scene);
      sunMaterial.diffuseColor = sunConfig.color;
      sunMaterial.emissiveColor = sunConfig.color;
      sunMaterial.specularColor = new Color3(0, 0, 0); // No specular highlights
      sunMesh.material = sunMaterial;

      celestialMeshes.set('sun', sunMesh);

      // Create Earth
      const earthConfig = CELESTIAL_BODIES.earth!;
      const earthMesh = MeshBuilder.CreateSphere("earth", {
        diameter: earthConfig.radius * 2,
        segments: 24
      }, scene);

      const earthMaterial = new StandardMaterial("earthMaterial", scene);
      earthMaterial.diffuseColor = earthConfig.color;
      earthMaterial.specularColor = new Color3(0.1, 0.1, 0.2);
      earthMesh.material = earthMaterial;

      celestialMeshes.set('earth', earthMesh);

      // Create Moon  
      const moonConfig = CELESTIAL_BODIES.moon!;
      const moonMesh = MeshBuilder.CreateSphere("moon", {
        diameter: moonConfig.radius * 2,
        segments: 16
      }, scene);

      const moonMaterial = new StandardMaterial("moonMaterial", scene);
      moonMaterial.diffuseColor = moonConfig.color;
      moonMaterial.specularColor = new Color3(0.05, 0.05, 0.05);
      moonMesh.material = moonMaterial;

      celestialMeshes.set('moon', moonMesh);

      timer.mark('celestial_bodies_created');

      // Create starfield background
      const starfield = MeshBuilder.CreateSphere("starfield", {
        diameter: 200,
        segments: 16
      }, scene);

      const starfieldMaterial = new StandardMaterial("starfieldMaterial", scene);
      starfieldMaterial.diffuseColor = new Color3(0.1, 0.1, 0.3);
      starfieldMaterial.emissiveColor = new Color3(0.05, 0.05, 0.2);
      starfieldMaterial.backFaceCulling = false; // Render inside of sphere
      starfield.material = starfieldMaterial;

      timer.mark('starfield_created');

      // Update scene state
      sceneStateRef.current = {
        engine,
        scene,
        camera,
        celestialMeshes,
        isReady: true
      };

      // Start render loop for 60fps
      engine.runRenderLoop(() => {
        const currentTime = performance.now();
        
        // Frame rate limiting for exactly 60fps
        if (currentTime - lastUpdateTimeRef.current >= 16.67) { // 1000/60 = 16.67ms
          scene.render();
          lastUpdateTimeRef.current = currentTime;
        }
      });

      // Handle resize
      window.addEventListener('resize', () => {
        engine.resize();
      });

      timer.mark('initialization_complete');
      console.log('✅ Babylon.js Scene Initialized Successfully at 60fps');

    } catch (error) {
      console.error('❌ Babylon.js Scene Initialization Failed:', error);
    }
  }, []);

  // ✅ CORRECT - Pre-allocated Vector3 objects for zero-allocation updates
  const sunPositionVector = useMemo(() => Vector3.Zero(), []);
  const moonPositionVector = useMemo(() => Vector3.Zero(), []);
  const earthPositionVector = useMemo(() => Vector3.Zero(), []);

  // ✅ CRITICAL - Update celestial positions from WASM Cartesian data (FIXED)
  const updateCelestialPositions = useCallback((astronomicalData: AstronomicalState): void => {
    const sceneState = sceneStateRef.current;
    if (!sceneState.isReady || !sceneState.celestialMeshes) return;

    const positionTimer = new BabylonPerformanceTimer('position_update');

    try {
      // ✅ FIXED: Direct Cartesian coordinate usage (no conversion needed)
      const scaleAU = 10.0; // Artistic scale for visibility (10x for better visualization)

      // ✅ GEOCENTRIC SCENE: Sun position from WASM (relative to Earth at origin)
      const sunMesh = sceneState.celestialMeshes.get('sun');
      if (sunMesh && astronomicalData.sun) {
        // Direct Cartesian coordinates from WASM (already in correct format)
        sunPositionVector.set(
          astronomicalData.sun.x * scaleAU,
          astronomicalData.sun.y * scaleAU, 
          astronomicalData.sun.z * scaleAU
        );
        sunMesh.position.copyFrom(sunPositionVector);
      }

      // ✅ GEOCENTRIC SCENE: Earth remains at origin (0,0,0)
      const earthMesh = sceneState.celestialMeshes.get('earth');
      if (earthMesh) {
        // Earth is always at origin in geocentric scene
        earthPositionVector.set(0, 0, 0);
        earthMesh.position.copyFrom(earthPositionVector);
      }

      // ✅ FIXED: Moon position from WASM Cartesian coordinates
      const moonMesh = sceneState.celestialMeshes.get('moon');
      if (moonMesh && astronomicalData.moon) {
        // Direct Cartesian coordinates from WASM (geocentric)
        moonPositionVector.set(
          astronomicalData.moon.x * scaleAU,
          astronomicalData.moon.y * scaleAU,
          astronomicalData.moon.z * scaleAU
        );
        moonMesh.position.copyFrom(moonPositionVector);
      }

      positionTimer.mark('positions_updated');

    } catch (error) {
      console.error('❌ Position Update Failed:', error);
    }
  }, [sunPositionVector, moonPositionVector, earthPositionVector]);

  // ✅ CORRECT - Scene initialization effect
  useEffect(() => {
    if (!canvas || !isInitialized) return;

    const initScene = async (): Promise<void> => {
      await initializeBabylonScene(canvas);
    };

    initScene().catch((error: unknown) => {
      console.error('Scene initialization error:', error);
    });

    // Cleanup function
    return () => {
      const sceneState = sceneStateRef.current;
      if (sceneState.engine) {
        sceneState.engine.stopRenderLoop();
        sceneState.engine.dispose();
      }
      if (renderLoopRef.current !== 0) {
        cancelAnimationFrame(renderLoopRef.current);
      }
    };
  }, [canvas, isInitialized, initializeBabylonScene]);

  // ✅ CORRECT - Update positions when astronomical data changes
  useEffect(() => {
    if (!astronomicalData || !sceneStateRef.current.isReady) return;

    updateCelestialPositions(astronomicalData);
  }, [astronomicalData, updateCelestialPositions]);

  // ✅ CORRECT - This component manages Babylon.js scene but doesn't render JSX
  return null;
};

export default BabylonScene;