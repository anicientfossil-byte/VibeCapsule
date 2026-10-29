import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { audioBeatEngine, BeatFrameData } from '../utils/audioBeatEngine';

interface SurrealSceneProps {
  scrollY?: number;
}

export const SurrealScene: React.FC<SurrealSceneProps> = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Device capability detection
    const isMobile =
      typeof window !== 'undefined' &&
      (window.innerWidth < 768 || ('ontouchstart' in window) || (navigator.maxTouchPoints > 0));

    // Three.js Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x05030a, 0.016);

    const camera = new THREE.PerspectiveCamera(
      55,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 3.2, 18);
    camera.lookAt(0, 2, 0);

    const renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: !isMobile,
      alpha: true,
      stencil: false,
      depth: true
    });

    const pixelRatio = isMobile ? 1.0 : Math.min(window.devicePixelRatio || 1, 1.5);
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // 1. Studio Lighting Rig
    const ambientLight = new THREE.AmbientLight(0x23143d, 1.4);
    scene.add(ambientLight);

    const purpleDirLight = new THREE.DirectionalLight(0x9333ea, 2.5);
    purpleDirLight.position.set(-15, 20, 10);
    scene.add(purpleDirLight);

    const magentaRimLight = new THREE.DirectionalLight(0xd946ef, 3.2);
    magentaRimLight.position.set(15, 12, -8);
    scene.add(magentaRimLight);

    // Central Glowing Point Lights inside the Vortex Center
    const orbPointLight = new THREE.PointLight(0xf43f5e, 3.0, 38, 1.2);
    orbPointLight.position.set(0, 3.0, 0);
    scene.add(orbPointLight);

    const orbVioletLight = new THREE.PointLight(0xa855f7, 2.8, 32, 1.2);
    orbVioletLight.position.set(0, 3.2, 0);
    scene.add(orbVioletLight);

    // Interactive cursor follow light for paused mode
    const cursorInteractiveLight = new THREE.PointLight(0xd946ef, 1.5, 25, 1.4);
    cursorInteractiveLight.position.set(0, 3.0, 0);
    scene.add(cursorInteractiveLight);

    // 2. Surreal Low-Poly 3D Mountain Landscape
    const mountainSegmentsX = isMobile ? 42 : 72;
    const mountainSegmentsY = isMobile ? 26 : 46;
    const mountainGeom = new THREE.PlaneGeometry(115, 68, mountainSegmentsX, mountainSegmentsY);
    mountainGeom.rotateX(-Math.PI / 2.3);

    const mountainPositions = mountainGeom.attributes.position;
    const baseHeights: number[] = [];
    const valleyMasks: number[] = [];

    for (let i = 0; i < mountainPositions.count; i++) {
      const x = mountainPositions.getX(i);
      const y = mountainPositions.getY(i);
      const z = mountainPositions.getZ(i);

      // Valley mask opens up the center for the dynamic vortex
      const distFromCenter = Math.sqrt(x * x + (z + 8) * (z + 8));
      const valleyMask = Math.min(1.0, Math.pow(distFromCenter / 22, 1.8));
      valleyMasks.push(valleyMask);

      // Multi-octave procedural mountain ridges
      let height =
        Math.sin(x * 0.12) * Math.cos(z * 0.14) * 4.2 +
        Math.sin(x * 0.28 + 1.2) * Math.cos(z * 0.24) * 2.8 +
        Math.cos(x * 0.06 - z * 0.08) * 5.5 +
        Math.sin((x + z) * 0.35) * 1.5;

      const edgeBoost = Math.max(0, (Math.abs(x) - 10) * 0.35);
      const backBoost = Math.max(0, (-z - 5) * 0.4);
      height = (height + edgeBoost + backBoost) * valleyMask;

      const finalY = y + Math.max(-1.5, height);
      mountainPositions.setY(i, finalY);
      baseHeights.push(finalY);
    }
    mountainGeom.computeVertexNormals();

    const mountainMat = new THREE.MeshStandardMaterial({
      color: 0x120826,
      roughness: 0.72,
      metalness: 0.28,
      flatShading: true,
      wireframe: false
    });

    const mountainMesh = new THREE.Mesh(mountainGeom, mountainMat);
    mountainMesh.position.set(0, -0.8, -12);
    scene.add(mountainMesh);

    // Mountain wireframe holographic sheen
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x8b5cf6,
      wireframe: true,
      transparent: true,
      opacity: 0.12
    });
    const mountainWire = new THREE.Mesh(mountainGeom, wireMat);
    mountainWire.position.copy(mountainMesh.position);
    scene.add(mountainWire);

    // 3. Reflective Liquid Water Surface in Foreground
    const waterSegs = isMobile ? 32 : 64;
    const waterGeom = new THREE.PlaneGeometry(125, 52, waterSegs, waterSegs);
    waterGeom.rotateX(-Math.PI / 2);

    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x070312,
      roughness: 0.08,
      metalness: 0.92,
      flatShading: false,
      transparent: true,
      opacity: 0.94
    });

    const waterMesh = new THREE.Mesh(waterGeom, waterMat);
    waterMesh.position.set(0, -1.8, 4);
    scene.add(waterMesh);

    const waterPositions = waterGeom.attributes.position;
    const waterInitialY: number[] = [];
    for (let i = 0; i < waterPositions.count; i++) {
      waterInitialY.push(waterPositions.getY(i));
    }

    // 4. Procedural Glowing Particle Texture
    const pCanvas = document.createElement('canvas');
    pCanvas.width = 64;
    pCanvas.height = 64;
    const pCtx = pCanvas.getContext('2d');
    if (pCtx) {
      const gradient = pCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.2, 'rgba(236, 72, 153, 0.9)');
      gradient.addColorStop(0.55, 'rgba(168, 85, 247, 0.45)');
      gradient.addColorStop(0.85, 'rgba(126, 34, 206, 0.15)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      pCtx.fillStyle = gradient;
      pCtx.fillRect(0, 0, 64, 64);
    }
    const particleTexture = new THREE.CanvasTexture(pCanvas);

    // 5. Dynamic Particle Cloud / Vortex
    const particleCount = isMobile ? 1200 : 4200;
    const particleGeom = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleBaseColors = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);
    const particleScales = new Float32Array(particleCount);
    const particleAngles = new Float32Array(particleCount);
    const particleRadii = new Float32Array(particleCount);
    const particleSpeeds = new Float32Array(particleCount);
    const particleYOffsets = new Float32Array(particleCount);
    const particleLayers = new Float32Array(particleCount); // 0=core, 1=mid, 2=outer

    const colorCore = new THREE.Color(0xf43f5e);
    const colorMid = new THREE.Color(0xd946ef);
    const colorOuter = new THREE.Color(0x8b5cf6);
    const colorHighlight = new THREE.Color(0xffffff);

    for (let i = 0; i < particleCount; i++) {
      const t = Math.random();
      const radius = 0.4 + Math.pow(t, 1.8) * 7.5;
      const angle = Math.random() * Math.PI * 2;
      const heightSpread = (1 - t * 0.7) * (Math.random() - 0.5) * 3.8;

      particleRadii[i] = radius;
      particleAngles[i] = angle;
      particleSpeeds[i] = (0.2 + (1.0 / (radius + 0.4)) * 0.6) * (Math.random() * 0.4 + 0.8);
      particleYOffsets[i] = heightSpread;

      particlePositions[i * 3] = Math.cos(angle) * radius;
      particlePositions[i * 3 + 1] = heightSpread + 3.0;
      particlePositions[i * 3 + 2] = Math.sin(angle) * radius;

      const mixedColor = new THREE.Color();
      if (t < 0.25) {
        mixedColor.copy(colorCore).lerp(colorHighlight, Math.random() * 0.4);
        particleLayers[i] = 0;
      } else if (t < 0.65) {
        mixedColor.copy(colorCore).lerp(colorMid, (t - 0.25) / 0.4);
        particleLayers[i] = 1;
      } else {
        mixedColor.copy(colorMid).lerp(colorOuter, (t - 0.65) / 0.35);
        particleLayers[i] = 2;
      }

      particleBaseColors[i * 3] = mixedColor.r;
      particleBaseColors[i * 3 + 1] = mixedColor.g;
      particleBaseColors[i * 3 + 2] = mixedColor.b;

      particleColors[i * 3] = mixedColor.r;
      particleColors[i * 3 + 1] = mixedColor.g;
      particleColors[i * 3 + 2] = mixedColor.b;

      particleScales[i] = Math.random() * 1.5 + 0.8;
    }

    particleGeom.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeom.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const baseParticleSize = isMobile ? 0.38 : 0.48;
    const particleMat = new THREE.PointsMaterial({
      size: baseParticleSize,
      map: particleTexture,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      opacity: 0.95
    });

    const particleSystem = new THREE.Points(particleGeom, particleMat);
    scene.add(particleSystem);

    // 6. Ambient Galaxy Stardust
    const starCount = isMobile ? 320 : 900;
    const starGeom = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 95;
      starPositions[i * 3 + 1] = Math.random() * 38 - 2;
      starPositions[i * 3 + 2] = (Math.random() - 0.5) * 55 - 15;

      const starHue = Math.random() > 0.6 ? 0xd8b4fe : 0xf472b6;
      const c = new THREE.Color(starHue);
      starColors[i * 3] = c.r;
      starColors[i * 3 + 1] = c.g;
      starColors[i * 3 + 2] = c.b;
    }
    starGeom.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeom.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 0.18,
      map: particleTexture,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      opacity: 0.65
    });
    const starField = new THREE.Points(starGeom, starMat);
    scene.add(starField);

    // Mouse Tracking with Velocity & Tactile Inertia
    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let mouseVelocityX = 0;
    let mouseVelocityY = 0;
    let mouseSpeed = 0;
    let smoothedMouseSpeed = 0;

    // Click / Tap dynamic wave impulse state
    let clickImpulseTime = -999;
    let clickImpulseOriginX = 0;
    let clickImpulseOriginZ = 0;

    const handleMouseMove = (event: MouseEvent) => {
      targetMouseX = (event.clientX / window.innerWidth) * 2 - 1;
      targetMouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length > 0) {
        targetMouseX = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
        targetMouseY = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
      }
    };

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      let clientX = 0;
      let clientY = 0;
      if ('clientX' in event) {
        clientX = event.clientX;
        clientY = event.clientY;
      } else if ('touches' in event && event.touches && event.touches.length > 0) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
      }

      const normX = (clientX / window.innerWidth) * 2 - 1;
      const normY = -(clientY / window.innerHeight) * 2 + 1;

      clickImpulseTime = clock.getElapsedTime();
      clickImpulseOriginX = normX * 18.0;
      clickImpulseOriginZ = 4.0 - normY * 12.0;

      // Pointer visual impulse only — mouse sound interaction disabled per user request
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown as EventListener, { passive: true });

    // Scroll Tracking
    let scrollProgress = 0;
    const handleScroll = () => {
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      scrollProgress = window.scrollY / maxScroll;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // Animation & Dual-Mode Visualization Render Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();
    let frameCount = 0;
    let accumulatedBeatRotation = 0;

    // Vortex center coordinates for smooth interpolation between modes
    const currentVortexCenter = new THREE.Vector3(0, 3.0, 0);
    const targetVortexCenter = new THREE.Vector3(0, 3.0, 0);

    // Dynamic Mode Weights:
    // When isPlaying === true -> musicModeWeight ramps to 1.0 (music rules all)
    // When isPlaying === false -> cursorModeWeight ramps to 1.0 (mouse rules all)
    let musicModeWeight = 0.0;

    // Track color caching
    let lastTrackSeed = -1;
    const dynamicCoreColor = new THREE.Color();
    const dynamicMidColor = new THREE.Color();
    const dynamicOuterColor = new THREE.Color();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      frameCount++;

      const elapsedTime = clock.getElapsedTime();
      
      // Live Beat & Audio Spectrum Frame
      const beatFrame: BeatFrameData = audioBeatEngine.getFrame();
      const {
        beat,
        bass,
        midBass,
        mid,
        treble,
        overallIntensity,
        isPlaying,
        trackSeed,
        colorHueOffset,
        vortexMode,
        spectrum,
        waveform
      } = beatFrame;

      // Update Track Dynamic Colors if track changed
      if (trackSeed !== lastTrackSeed) {
        lastTrackSeed = trackSeed;
        const baseHue = (0.83 + colorHueOffset) % 1.0; // Magenta-purple spectrum
        dynamicCoreColor.setHSL(baseHue, 0.95, 0.55);
        dynamicMidColor.setHSL((baseHue + 0.08) % 1.0, 0.90, 0.50);
        dynamicOuterColor.setHSL((baseHue + 0.16) % 1.0, 0.85, 0.45);

        // Update particle colors for this song
        const pColors = particleGeom.attributes.color as THREE.BufferAttribute;
        for (let i = 0; i < particleCount; i++) {
          const layer = particleLayers[i];
          const tempColor = new THREE.Color();
          if (layer === 0) {
            tempColor.copy(dynamicCoreColor).lerp(colorHighlight, 0.3);
          } else if (layer === 1) {
            tempColor.copy(dynamicCoreColor).lerp(dynamicMidColor, 0.6);
          } else {
            tempColor.copy(dynamicMidColor).lerp(dynamicOuterColor, 0.7);
          }
          pColors.setXYZ(i, tempColor.r, tempColor.g, tempColor.b);
        }
        pColors.needsUpdate = true;
      }

      // Smooth mouse lerping
      prevMouseX = currentMouseX;
      prevMouseY = currentMouseY;
      currentMouseX += (targetMouseX - currentMouseX) * 0.08;
      currentMouseY += (targetMouseY - currentMouseY) * 0.08;
      mouseVelocityX = currentMouseX - prevMouseX;
      mouseVelocityY = currentMouseY - prevMouseY;
      mouseSpeed = Math.sqrt(mouseVelocityX * mouseVelocityX + mouseVelocityY * mouseVelocityY);
      smoothedMouseSpeed += (mouseSpeed - smoothedMouseSpeed) * 0.1;

      // Cursor motion sound disabled per user request

      // Smooth transition between Paused (Cursor Mode) and Playing (Music Visualization Mode)
      const targetMusicWeight = isPlaying ? 1.0 : 0.0;
      musicModeWeight += (targetMusicWeight - musicModeWeight) * 0.06;
      const cursorModeWeight = 1.0 - musicModeWeight;

      // =========================================================================
      // 1. VORTEX POSITION & INTERACTIVITY LOGIC
      // =========================================================================
      // When Paused: Vortex center tracks the user's cursor across the 3D canvas!
      // When Playing: Vortex stays centered to act as the massive stage visualizer!
      const cursorTargetX = currentMouseX * (isMobile ? 4.5 : 8.5);
      const cursorTargetY = 3.0 + currentMouseY * (isMobile ? 2.5 : 4.5);
      const cursorTargetZ = currentMouseY * 2.0;

      targetVortexCenter.set(
        cursorTargetX * cursorModeWeight,
        3.0 * musicModeWeight + cursorTargetY * cursorModeWeight,
        cursorTargetZ * cursorModeWeight
      );
      currentVortexCenter.lerp(targetVortexCenter, 0.08);

      // Parallax Camera Placement
      const scrollYOffset = scrollProgress * 5.0;
      const beatCameraThump = isPlaying ? beat * (isMobile ? 0.08 : 0.18) : 0;
      
      // When playing, camera movement is music-locked with subtle background tilt;
      // when paused, camera tracks mouse with broad immersive 3D parallax!
      const cameraMouseFactor = cursorModeWeight * 2.2 + musicModeWeight * 0.5;
      camera.position.x = currentMouseX * cameraMouseFactor;
      camera.position.y = 3.2 + currentMouseY * (cameraMouseFactor * 0.7) - scrollYOffset * 0.3 + beatCameraThump;
      camera.lookAt(
        currentVortexCenter.x * 0.3,
        2.0 - scrollYOffset * 0.15 + (beatCameraThump * 0.5) + (currentVortexCenter.y - 3.0) * 0.2,
        0
      );

      // Light coordinates follow vortex center
      orbPointLight.position.copy(currentVortexCenter);
      orbVioletLight.position.set(currentVortexCenter.x, currentVortexCenter.y + 0.2, currentVortexCenter.z);

      // Interactive cursor light illuminates mouse zone when paused
      cursorInteractiveLight.position.set(cursorTargetX, cursorTargetY, cursorTargetZ + 2.0);
      cursorInteractiveLight.intensity = cursorModeWeight * (1.2 + smoothedMouseSpeed * 15.0);

      // =========================================================================
      // 2. SURREAL MOUNTAIN LANDSCAPE REACTIVITY
      // =========================================================================
      if (!isMobile || frameCount % 2 === 0) {
        const mPos = mountainGeom.attributes.position;
        // Playing: bass frequencies drive seismic ripples. Paused: mouse coordinates tilt and ripple terrain.
        const bassImpact = isPlaying ? (bass * 3.2 + beat * 1.8) : (0.15 + smoothedMouseSpeed * 2.0);
        const waveSpeed = isPlaying ? (2.5 + overallIntensity * 3.5) : (1.2 + smoothedMouseSpeed * 4.0);

        for (let i = 0; i < mPos.count; i++) {
          const x = mPos.getX(i);
          const z = mPos.getZ(i);
          const vMask = valleyMasks[i] || 1;

          // Audio-reactive or mouse-tilted seismic wave
          const seismicWave =
            Math.sin(x * 0.14 + z * 0.11 - elapsedTime * waveSpeed) *
            bassImpact *
            vMask *
            0.65;

          // Dynamic mouse elevation distortion in paused mode
          const mouseDistortion =
            cursorModeWeight *
            Math.sin((x - currentMouseX * 15) * 0.1 + (z - currentMouseY * 10) * 0.1) *
            0.5 *
            vMask;

          mPos.setY(i, baseHeights[i] + seismicWave + mouseDistortion);
        }
        mountainGeom.computeVertexNormals();
        mPos.needsUpdate = true;
      }

      // Wireframe flash
      wireMat.opacity =
        0.10 +
        (bass * 0.4 + beat * 0.35) * musicModeWeight +
        (smoothedMouseSpeed * 0.5) * cursorModeWeight;

      if (isPlaying) {
        if (beat > 0.65) {
          wireMat.color.copy(dynamicCoreColor);
        } else if (bass > 0.5) {
          wireMat.color.copy(dynamicMidColor);
        } else {
          wireMat.color.copy(dynamicOuterColor);
        }
      } else {
        wireMat.color.setHex(0x8b5cf6);
      }

      // =========================================================================
      // 3. REFLECTIVE WATER SURFACE: AUDIO SHOCKWAVES & INTERACTIVE CURSOR RIPPLES
      // =========================================================================
      if (!isMobile || frameCount % 2 === 0) {
        const pos = waterGeom.attributes.position;
        const waveSpeed = isPlaying ? (2.0 + overallIntensity * 3.2) : 1.5;
        const waveAmp = isPlaying ? (0.15 + bass * 0.32) : 0.12;
        const concentricKick = isPlaying ? beat * 0.35 : 0;

        // Cursor water projection in paused mode
        const cursorWaterX = currentMouseX * 22.0;
        const cursorWaterZ = 4.0 - currentMouseY * 16.0;

        for (let i = 0; i < pos.count; i++) {
          const x = pos.getX(i);
          const z = pos.getZ(i);

          // Music shockwave radiating from central stage vortex
          const distFromVortex = Math.sqrt(x * x + z * z);
          const musicRipple =
            Math.sin(distFromVortex * 0.55 - elapsedTime * 5.2) *
            concentricKick *
            Math.exp(-distFromVortex * 0.055) *
            musicModeWeight;

          // Interactive ripple radiating from cursor position on the water!
          const distFromCursor = Math.sqrt((x - cursorWaterX) ** 2 + (z - cursorWaterZ) ** 2);
          const cursorRipple =
            Math.sin(distFromCursor * 0.8 - elapsedTime * (3.0 + smoothedMouseSpeed * 10.0)) *
            (0.18 + smoothedMouseSpeed * 0.8) *
            Math.exp(-distFromCursor * 0.12) *
            cursorModeWeight;

          // Interactive click shockwave radiating across the water plane
          const timeSinceClick = elapsedTime - clickImpulseTime;
          let clickRipple = 0;
          if (timeSinceClick >= 0 && timeSinceClick < 3.0) {
            const distFromClick = Math.sqrt((x - clickImpulseOriginX) ** 2 + (z - clickImpulseOriginZ) ** 2);
            const rippleWaveFront = timeSinceClick * 16.0;
            const distDiff = Math.abs(distFromClick - rippleWaveFront);
            if (distDiff < 4.0) {
              clickRipple = Math.cos((distDiff / 4.0) * Math.PI * 0.5) * Math.exp(-timeSinceClick * 1.2) * 0.45;
            }
          }

          // Base ambient fluid wave
          const baseFluidWave =
            Math.sin(x * 0.25 + elapsedTime * waveSpeed) * waveAmp +
            Math.cos(z * 0.3 + elapsedTime * (waveSpeed * 0.8)) * (waveAmp * 0.8) +
            Math.sin((x + z) * 0.15 + elapsedTime * (waveSpeed * 1.2)) * (waveAmp * 0.5);

          pos.setY(i, waterInitialY[i] + baseFluidWave + musicRipple + cursorRipple + clickRipple);
        }
        waterGeom.computeVertexNormals();
        pos.needsUpdate = true;
      }

      // =========================================================================
      // 4. DYNAMIC PURPLE PARTICLE VORTEX: DUAL-MODE CORE
      // =========================================================================
      const pos = particleGeom.attributes.position;
      const pCount = particleCount;
      const speedMultiplier = isMobile ? 0.65 : 0.95;

      // When Playing: Rotation is driven by the track's tempo, beat kicks, and rhythm
      // When Paused: Rotation accelerates with mouse movement velocity and swirling gestures!
      const rotationalBeatBoost = isPlaying ? (1.0 + beat * 3.8 + bass * 2.2 + treble * 1.5) : 1.0;
      const mouseSwirlBoost = cursorModeWeight * (smoothedMouseSpeed * 18.0);
      accumulatedBeatRotation += (0.003 + (beat * 0.02 + bass * 0.012) * musicModeWeight + mouseSwirlBoost * 0.005);

      // Radial Beat Pulse / Expansion
      // In music mode: each kick and sub-bass explodes the vortex outward
      // In cursor mode: moving mouse stirs and disperses particles outward in a trail, plus tap burst
      const timeSinceClick = elapsedTime - clickImpulseTime;
      const clickBurst = (timeSinceClick >= 0 && timeSinceClick < 1.0) ? Math.exp(-timeSinceClick * 3.5) * 0.5 : 0;
      const beatRadiusExpansion = isPlaying
        ? (beat * 0.52 + bass * 0.38 + (spectrum[1] || 0) * 0.2)
        : (smoothedMouseSpeed * 0.6 + clickBurst);

      // Geometry mode alterations per track
      const isPulsar = vortexMode === 'pulsar';
      const isRing = vortexMode === 'ring';
      const isNebula = vortexMode === 'nebula';

      const cx = currentVortexCenter.x;
      const cy = currentVortexCenter.y;
      const cz = currentVortexCenter.z;

      for (let i = 0; i < pCount; i++) {
        // Orbital motion
        particleAngles[i] += particleSpeeds[i] * 0.013 * speedMultiplier * (rotationalBeatBoost + mouseSwirlBoost);
        const r = particleRadii[i];
        const a = particleAngles[i];

        // Music-mode distinct geometry transformations
        let currentR = r * (1.0 + beatRadiusExpansion);

        if (musicModeWeight > 0.05) {
          if (isPulsar) {
            // Explosive spherical shell pulse
            currentR += Math.sin(a * 4.0 + elapsedTime * 3.0) * (beat * 0.45);
          } else if (isRing) {
            // Flat concentrated accretion disc
            currentR = (2.0 + (r * 0.7)) * (1.0 + beatRadiusExpansion * 0.8);
          } else if (isNebula) {
            // Billowing volumetric cloud
            currentR += Math.sin(r * 2.0 - elapsedTime * 2.0) * (0.3 + mid * 0.5);
          }
        }

        // Mouse turbulence wake in paused mode
        if (cursorModeWeight > 0.05) {
          const mouseWake = Math.sin(a * 2.0 - elapsedTime * 4.0) * (smoothedMouseSpeed * 1.5);
          currentR += mouseWake * cursorModeWeight;
        }

        // Breathing oscillation
        const breath = Math.sin(elapsedTime * 1.8 + r * 1.2) * 0.14;
        currentR += breath;

        // Vertical height wave
        const yBase = particleYOffsets[i] * (isRing ? 0.35 : 1.0);
        // Mid melodies & vocals create vertical helical waves
        const midWave = isPlaying ? Math.sin(a * 3.0 + elapsedTime * 4.2) * (mid * 0.95 + midBass * 0.4) : 0;
        // Mouse Y velocity tilts the particle spiral
        const mouseTiltWave = cursorModeWeight * (Math.sin(a + elapsedTime * 3.0) * (currentMouseY * 0.8 + mouseVelocityY * 5.0));
        const yOsc = (Math.sin(elapsedTime * 2.2 + a * 2.0) * 0.22) * (1.0 + bass * 0.9) + midWave + mouseTiltWave;

        // Position particles centered around currentVortexCenter
        pos.setX(i, cx + Math.cos(a) * currentR);
        pos.setY(i, cy + yBase + yOsc - scrollYOffset * 0.4);
        pos.setZ(i, cz + Math.sin(a) * currentR);
      }
      pos.needsUpdate = true;

      // Particle system scale
      const systemScale = 1.0 + (beat * 0.28 + bass * 0.2) * musicModeWeight + (smoothedMouseSpeed * 0.35) * cursorModeWeight;
      particleSystem.scale.set(
        systemScale,
        systemScale * (1.0 + mid * 0.18),
        systemScale
      );

      // Particle size expands with kicks and treble sparkle
      particleMat.size =
        baseParticleSize *
        (1.0 + (beat * 0.75 + treble * 0.4) * musicModeWeight + (smoothedMouseSpeed * 0.4) * cursorModeWeight);

      // Particle system global tilt
      particleSystem.rotation.y = elapsedTime * 0.05 + accumulatedBeatRotation;
      particleSystem.rotation.x =
        Math.sin(elapsedTime * 0.3) * 0.1 +
        (currentMouseY * 0.25) * cursorModeWeight +
        (beat * 0.08) * musicModeWeight;
      particleSystem.rotation.z =
        Math.cos(elapsedTime * 0.25) * 0.08 +
        (currentMouseX * 0.25) * cursorModeWeight +
        (bass * 0.06) * musicModeWeight;

      // =========================================================================
      // 5. LIGHTING FLARES & BEAT ILLUMINATION
      // =========================================================================
      // Glowing orb point light flaring with kick drum & bass
      const orbKickFlare = isPlaying
        ? (beat * 8.5 + bass * 3.8 + (spectrum[0] || 0) * 4.0)
        : (0.6 + smoothedMouseSpeed * 4.0);
      orbPointLight.intensity = 2.8 + orbKickFlare;
      orbPointLight.distance = 36 + (isPlaying ? beat * 25 : 0);

      // Violet point light dancing to mid melodies & vocals
      const orbMidFlare = isPlaying
        ? (mid * 5.2 + treble * 2.8 + (spectrum[3] || 0) * 3.0)
        : 0.6;
      orbVioletLight.intensity = 2.4 + orbMidFlare;

      // Ambient light swelling with sub-bass resonance
      ambientLight.intensity = 1.3 + (isPlaying ? bass * 1.1 : 0.08);

      // Directional lights rhythmically sweeping
      purpleDirLight.intensity = 2.3 + (isPlaying ? bass * 2.2 : 0.15);
      magentaRimLight.intensity = 3.0 + (isPlaying ? beat * 3.5 : 0.25);

      // Starfield drift
      starField.rotation.y = elapsedTime * 0.015;

      renderer.render(scene, camera);
    };

    animate();

    // Clean unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('pointerdown', handlePointerDown as EventListener);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);

      mountainGeom.dispose();
      mountainMat.dispose();
      wireMat.dispose();
      waterGeom.dispose();
      waterMat.dispose();
      particleGeom.dispose();
      particleMat.dispose();
      starGeom.dispose();
      starMat.dispose();
      particleTexture.dispose();

      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden"
      aria-hidden="true"
    />
  );
};
