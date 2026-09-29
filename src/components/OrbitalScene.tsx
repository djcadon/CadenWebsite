import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { ThreePerf as ThreePerfInstance } from "three-perf";
import { destinations, type DestinationId } from "../constants/destinations";

interface OrbitalSceneProps {
    onSelect: (destination: string) => void;
    onReturnComplete: () => void;
    returnFrom?: DestinationId;
}

type Planet = {
    mesh: THREE.Mesh;
    hitbox: THREE.Mesh;
    angle: number;
    distance: number;
    speed: number;
};

const CAMERA_FOV = 40;
const CAMERA_NEAR_CLIP = 0.1;
const CAMERA_FAR_CLIP = 100;
const MAX_PIXEL_RATIO = 1.5;
const SYSTEM_TILT = 0.15;
const STAR_TEXTURE_SIZE = 64;
const STAR_TEXTURE_CENTER = STAR_TEXTURE_SIZE / 2;
const ORBIT_POINT_COUNT = 128;
const MAX_FRAME_DELTA_SECONDS = 0.05;
const PLANET_ZOOM_DISTANCE = 1.35;
const PLANET_ZOOM_DURATION_SECONDS = 1;
const RETURN_ZOOM_DURATION_SECONDS = 1.5;
const SUN_ROTATION_SPEED = 0.1;
const ORBIT_VERTICAL_OFFSET = -10;
const MOBILE_BREAKPOINT = 640;
const MOBILE_CAMERA_FOV = 46;
const MOBILE_SYSTEM_SCALE = 0.82;
const MOBILE_PIXEL_RATIO = 1.25;
const PLANET_POSITION_STORAGE_KEY = "caden-orbital-planet-positions";

function readSavedPlanetAngles(): Partial<Record<DestinationId, number>> {
    const savedPositions = sessionStorage.getItem(PLANET_POSITION_STORAGE_KEY);
    if (!savedPositions) {
        return {};
    }

    try {
        const parsedPositions: unknown = JSON.parse(savedPositions);
        if (!parsedPositions || typeof parsedPositions !== "object") {
            return {};
        }

        return Object.fromEntries(
            destinations
                .filter((destination) => {
                    const angle = (parsedPositions as Record<string, unknown>)[destination.id];
                    return typeof angle === "number" && Number.isFinite(angle);
                })
                .map((destination) => [
                    destination.id,
                    (parsedPositions as Record<string, number>)[destination.id],
                ]),
        );
    } catch (error: unknown) {
        console.warn("Unable to restore saved orbital positions.", error);
        return {};
    }
}

function OrbitalScene({ onSelect, onReturnComplete, returnFrom }: OrbitalSceneProps) {
    // The Three.js canvas is mounted into this container after the component renders.
    const mountRef = useRef<HTMLDivElement>(null);
    // These refs let the animation loop position HTML labels over their planets.
    const labelRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const descriptionRefs = useRef<Record<string, HTMLSpanElement | null>>({});
    const [isZooming, setIsZooming] = useState(false);
    // Keep the latest callback available to the one-time Three.js effect.
    const onSelectRef = useRef<(destination: string) => void>(onSelect);
    const onReturnCompleteRef = useRef(onReturnComplete);
    const returnFromRef = useRef(returnFrom);

    useEffect(() => {
        onSelectRef.current = onSelect;
    }, [onSelect]);
    useEffect(() => {
        onReturnCompleteRef.current = onReturnComplete;
    }, [onReturnComplete]);

    useEffect(() => {
        const mount = mountRef.current;
        if (!mount) {
            return;
        }
        const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
        const isLowPower = navigator.hardwareConcurrency <= 4;
        const pixelRatioLimit = isMobile || isLowPower ? MOBILE_PIXEL_RATIO : MAX_PIXEL_RATIO;
        const sceneScale = isMobile ? MOBILE_SYSTEM_SCALE : 1;
        const savedPlanetAngles = readSavedPlanetAngles();
        // Create the scene and camera used by the orbital visualization.
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
            isMobile ? MOBILE_CAMERA_FOV : CAMERA_FOV,
            1,
            CAMERA_NEAR_CLIP,
            CAMERA_FAR_CLIP,
        );
        camera.position.set(0, isMobile ? 20 : 22, isMobile ? 21 : 18);
        camera.lookAt(0, ORBIT_VERTICAL_OFFSET, 0);
        const overviewPosition = new THREE.Vector3(0, isMobile ? 20 : 22, isMobile ? 21 : 18);

        // Render with transparency so the surrounding page background remains visible.
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelRatioLimit));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.domElement.style.touchAction = "manipulation";
        mount.appendChild(renderer.domElement);
        let performanceMonitor: ThreePerfInstance | null = null;
        let isDisposed = false;
        if (import.meta.env.DEV) {
            import("three-perf")
                .then(({ ThreePerf }) => {
                    if (isDisposed) {
                        return;
                    }
                    performanceMonitor = new ThreePerf({
                        anchorX: "left",
                        anchorY: "top",
                        domElement: mount,
                        renderer,
                        memory: true,
                        showGraph: true,
                    });
                    const performancePanel = document.getElementById("three-perf-ui");
                    if (performancePanel) {
                        performancePanel.style.top = "var(--header-height)";
                        performancePanel.style.bottom = "auto";
                    }
                })
                .catch((error: unknown) => {
                    console.error("Unable to load the development performance monitor.", error);
                });
        }

        // Ambient light fills the scene while the point light gives the sun and planets their highlights.
        scene.add(new THREE.AmbientLight(0x9da6b5, 0.2));
        const sunLight = new THREE.PointLight(0xffd39b, 40, 45, 2);

        // The system group lets the whole solar system share a slight tilt.
        const system = new THREE.Group();
        system.add(sunLight);
        system.rotation.x = SYSTEM_TILT;
        system.position.y = ORBIT_VERTICAL_OFFSET;
        system.scale.setScalar(sceneScale);
        scene.add(system);

        // Several point-cloud layers create stars with varied brightness and size.
        const starGroups = [
            { count: isMobile || isLowPower ? 500 : 900, size: 0.14 },
            { count: isMobile || isLowPower ? 140 : 280, size: 0.24 },
            { count: isMobile || isLowPower ? 24 : 45, size: 0.42 },
        ];
        // Use a shared six-point star texture so every point renders as a filled
        // star shape rather than a round dot.
        const starCanvas = document.createElement("canvas");
        starCanvas.width = STAR_TEXTURE_SIZE;
        starCanvas.height = STAR_TEXTURE_SIZE;
        const starContext = starCanvas.getContext("2d");
        if (!starContext) {
            throw new Error("Unable to create the star texture.");
        }
        starContext.translate(STAR_TEXTURE_CENTER, STAR_TEXTURE_CENTER);
        starContext.beginPath();
        for (let point = 0; point < 12; point += 1) {
            const angle = -Math.PI / 2 + (point * Math.PI) / 6;
            const radius = point % 2 === 0 ? 30 : 13;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (point === 0) {
                starContext.moveTo(x, y);
            } else {
                starContext.lineTo(x, y);
            }
        }
        starContext.closePath();
        starContext.fillStyle = "#ffffff";
        starContext.fill();
        const starTexture = new THREE.CanvasTexture(starCanvas);
        starTexture.colorSpace = THREE.SRGBColorSpace;
        const starClouds: THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>[] = [];
        const starGeometries: THREE.BufferGeometry[] = [];
        const starBaseColors: Float32Array[] = [];
        
        starGroups.forEach(({ count, size }) => {
            const starGeometry = new THREE.BufferGeometry();
            const starPositions = new Float32Array(count * 3);
            const starColors = new Float32Array(count * 3);
            for (let i = 0; i < count; i += 1) {
                const position = i * 3;
                const brightness = 0.3 + Math.random() * 0.7; // Made stars brighter overall
                // Spread stars through a shallow box around the orbital plane.
                starPositions[position] = (Math.random() - 0.5) * 42;
                starPositions[position + 1] = (Math.random() - 0.5) * 24;
                starPositions[position + 2] = (Math.random() - 0.5) * 42;
                starColors[position] = brightness;
                starColors[position + 1] = brightness * 0.98;
                starColors[position + 2] = brightness * 0.9;
            }
            starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
            starGeometry.setAttribute("color", new THREE.BufferAttribute(starColors, 3));
            const points = new THREE.Points(
                starGeometry,
                new THREE.PointsMaterial({
                    size,
                    map: starTexture,
                    vertexColors: true,
                    transparent: true,
                    opacity: 1, // Full opacity, we modulate color now
                    depthWrite: false,
                    sizeAttenuation: true,
                }),
            );
            starClouds.push(points);
            starGeometries.push(starGeometry);
            starBaseColors.push(starColors.slice()); // Save original colors for twinkle math
            scene.add(points);
        });

        // Shooting Star
        const shootingStar = new THREE.Mesh(
            new THREE.SphereGeometry(0.08, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 })
        );
        shootingStar.scale.z = 25; // Stretch into a line
        scene.add(shootingStar);
        
        let shootingStarProgress = 1;
        const shootingStarStart = new THREE.Vector3();
        const shootingStarEnd = new THREE.Vector3();

        // The sun is composed of a custom procedural shader. We use ShaderMaterial here 
        // to mathematical generate the surface pattern in real-time on the GPU. 
        // This avoids heavy image textures while still creating a dynamic, slow-shifting 
        // surface effect that makes the star feel "hot" and active.
        const sunUniforms = {
            time: { value: 0 }
        };
        const sunMaterial = new THREE.ShaderMaterial({
            uniforms: sunUniforms,
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vPosition;
                void main() {
                    vUv = uv;
                    vPosition = position;
                    // Keep the sphere perfectly round
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                varying vec2 vUv;
                varying vec3 vPosition;
                void main() {
                    // Very slow, subtle, large-scale noise
                    float noise = sin(vPosition.x * 2.0 + time * 0.5) * 
                                  cos(vPosition.y * 2.0 + time * 0.4) * 
                                  sin(vPosition.z * 2.0 - time * 0.3);
                    
                    float intensity = (noise + 1.0) * 0.5;
                    
                    // Original base color: 0xe8a95e (approx 0.91, 0.66, 0.37)
                    // Slightly darker/warmer color: 0xcc7a22 (approx 0.8, 0.48, 0.13)
                    vec3 baseColor = vec3(0.91, 0.66, 0.37);
                    vec3 warmColor = vec3(0.8, 0.48, 0.13);
                    
                    // Softly mix them
                    vec3 color = mix(warmColor, baseColor, intensity);
                    
                    gl_FragColor = vec4(color, 1.0);
                }
            `
        });

        const sun = new THREE.Mesh(
            new THREE.SphereGeometry(1.5, isMobile ? 32 : 48, isMobile ? 32 : 48),
            sunMaterial
        );
        system.add(sun);

        const sunHalo = new THREE.Mesh(
            new THREE.SphereGeometry(1.75, isMobile ? 24 : 32, isMobile ? 24 : 32),
            new THREE.MeshBasicMaterial({
                color: 0xf1bd78,
                transparent: true,
                opacity: 0.08,
                side: THREE.BackSide,
            }),
        );
        system.add(sunHalo);

        // Each destination gets an orbit ring and a separate planet frame. Keeping
        // them in separate branches ensures animating a planet cannot transform its orbit.
        const planets: Planet[] = destinations.map((destination, index) => {
            const orbitFrame = new THREE.Group();
            orbitFrame.rotation.x = (index - 1.5) * 0.08;
            orbitFrame.rotation.z = (index - 1.5) * 0.04;
            system.add(orbitFrame);

            // Build a circle from line segments so its size follows the destination.
            const orbit = new THREE.LineLoop(
                new THREE.BufferGeometry().setFromPoints(
                    Array.from({ length: isMobile ? 96 : ORBIT_POINT_COUNT }, (_, point) => {
                        const pointCount = isMobile ? 96 : ORBIT_POINT_COUNT;
                        const angle = (point / pointCount) * Math.PI * 2;
                        return new THREE.Vector3(
                            Math.cos(angle) * destination.distance,
                            0,
                            Math.sin(angle) * destination.distance,
                        );
                    }),
                ),
                new THREE.LineBasicMaterial({
                    color: 0x555a61,
                    transparent: true,
                    opacity: 0.4,
                }),
            );
            orbitFrame.add(orbit);

            const planetFrame = new THREE.Group();
            planetFrame.rotation.copy(orbitFrame.rotation);
            system.add(planetFrame);
            const material = new THREE.MeshStandardMaterial({
                color: destination.color,
                roughness: 0.72,
                metalness: 0.05,
            });

            // We want the planets to have unique, swirling surface patterns (like gas giants or clouds).
            // However, if we just used a raw ShaderMaterial (like we did for the sun), the planets 
            // would no longer react to the scene's lighting, shadows, or roughness settings. 
            // 
            // The solution is `.onBeforeCompile`: This allows us to hook into Three.js's built-in 
            // MeshStandardMaterial and inject our own custom 3D noise algorithm right into its fragment 
            // shader BEFORE it gets compiled. This way, we get the mathematical patterns while perfectly 
            // preserving all the complex lighting physics!
            material.onBeforeCompile = (shader) => {
                // Pass a unique seed to each planet based on its index so they all look different
                shader.uniforms.seed = { value: index * 13.37 };
                
                shader.vertexShader = `
                    varying vec3 vObjPos;
                ` + shader.vertexShader;
                
                shader.vertexShader = shader.vertexShader.replace(
                    '#include <begin_vertex>',
                    `
                    #include <begin_vertex>
                    vObjPos = position;
                    `
                );

                shader.fragmentShader = `
                    uniform float seed;
                    varying vec3 vObjPos;
                    
                    // Simple 3D noise function
                    float hash(vec3 p) {
                        p = fract(p * 0.3183099 + 0.1);
                        p *= 17.0;
                        return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
                    }
                    float noise(in vec3 x) {
                        vec3 p = floor(x);
                        vec3 f = fract(x);
                        f = f * f * (3.0 - 2.0 * f);
                        return mix(mix(mix(hash(p + vec3(0,0,0)), hash(p + vec3(1,0,0)), f.x),
                                       mix(hash(p + vec3(0,1,0)), hash(p + vec3(1,1,0)), f.x), f.y),
                                   mix(mix(hash(p + vec3(0,0,1)), hash(p + vec3(1,0,1)), f.x),
                                       mix(hash(p + vec3(0,1,1)), hash(p + vec3(1,1,1)), f.x), f.y), f.z);
                    }
                ` + shader.fragmentShader;

                shader.fragmentShader = shader.fragmentShader.replace(
                    'vec4 diffuseColor = vec4( diffuse, opacity );',
                    `
                    // Combine layers of noise for a marbled look
                    float n1 = noise(vObjPos * 3.0 + seed);
                    float n2 = noise(vObjPos * 6.0 - seed);
                    float finalNoise = (n1 * 0.7) + (n2 * 0.3);
                    
                    // Darken or lighten the base color slightly based on the noise
                    vec3 patternColor = mix(diffuse * 0.5, diffuse * 1.5, finalNoise);
                    
                    vec4 diffuseColor = vec4( patternColor, opacity );
                    `
                );
            };

            const mesh = new THREE.Mesh(
                new THREE.SphereGeometry(destination.size, isMobile ? 32 : 48, isMobile ? 32 : 48),
                material
            );
            mesh.userData = { id: destination.id };
            planetFrame.add(mesh);
            const hitbox = new THREE.Mesh(
                new THREE.SphereGeometry(destination.size * 2, 12, 12),
                new THREE.MeshBasicMaterial({
                    transparent: true,
                    opacity: 0,
                    depthWrite: false,
                }),
            );
            hitbox.userData = { id: destination.id };
            planetFrame.add(hitbox);
            return {
                mesh,
                hitbox,
                angle: savedPlanetAngles[destination.id] ?? index * 1.55,
                distance: destination.distance,
                speed: destination.speed,
            };
        });
        const planetHitboxes = planets.map(({ hitbox }) => hitbox);
        let returning = false;
        const returnStartedAt = 0;
        let returnStartPosition: THREE.Vector3 | null = null;
        let returningMesh: THREE.Mesh | null = null;
        const returnTargetPosition = new THREE.Vector3(0, ORBIT_VERTICAL_OFFSET, 0);
        const overviewTarget = new THREE.Vector3(0, ORBIT_VERTICAL_OFFSET, 0);
        const returningPlanet = planets.find(
            ({ mesh }) => mesh.userData.id === returnFromRef.current,
        );
        if (returningPlanet) {
            const { mesh, angle, distance } = returningPlanet;
            returningMesh = mesh;
            mesh.position.set(Math.cos(angle) * distance, 0, Math.sin(angle) * distance);
            const planetPosition = mesh.getWorldPosition(new THREE.Vector3());
            const returnDirection = overviewPosition.clone().sub(planetPosition).normalize();
            returnStartPosition = planetPosition
                .clone()
                .add(returnDirection.multiplyScalar(PLANET_ZOOM_DISTANCE));
            camera.position.copy(returnStartPosition);
            camera.lookAt(planetPosition);
            returning = true;
        }

        // Pointer coordinates are normalized for Three.js raycasting.
        const raycaster = new THREE.Raycaster();
        const pointer = new THREE.Vector2();
        const projectedPosition = new THREE.Vector3();
        const targetPosition = new THREE.Vector3();
        const zoomDirection = new THREE.Vector3();
        const endPosition = new THREE.Vector3();
        const updatePointer = (event: MouseEvent | PointerEvent) => {
            const bounds = renderer.domElement.getBoundingClientRect();
            pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
            pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
        };
        // Show only the description belonging to the currently hovered planet.
        let hoveredId: string | undefined;
        const setHoveredLabel = (id?: string) => {
            if (id === hoveredId) {
                return;
            }
            hoveredId = id;
            destinations.forEach((destination) => {
                descriptionRefs.current[destination.id]?.classList.toggle(
                    "opacity-100",
                    destination.id === id,
                );
                descriptionRefs.current[destination.id]?.classList.toggle(
                    "opacity-0",
                    destination.id !== id,
                );
            });
        };
        // Raycast against planet meshes so orbit lines and the sun do not trigger hover or selection states.
        const handlePointerMove = (event: PointerEvent) => {
            updatePointer(event);
            raycaster.setFromCamera(pointer, camera);
            const hovered = raycaster.intersectObjects(planetHitboxes)[0]?.object;
            renderer.domElement.style.cursor = hovered ? "pointer" : "default";
            setHoveredLabel(hovered?.userData.id);
        };
        // Zoom state is tied to the animation clock and current Three.js object.
        let zoomTarget: THREE.Mesh | null = null;
        let zoomStartedAt = 0;
        let zoomStartPosition: THREE.Vector3 | null = null;
        let zoomStartTarget: THREE.Vector3 | null = null;
        let zoomFinished = false;
        const handleClick = (event: MouseEvent) => {
            updatePointer(event);
            raycaster.setFromCamera(pointer, camera);
            const selected = raycaster.intersectObjects(planetHitboxes)[0]?.object as
                THREE.Mesh | undefined;
            if (selected && !zoomTarget) {
                zoomTarget = selected;
                zoomStartedAt = elapsed;
                zoomStartPosition = camera.position.clone();
                zoomStartTarget = selected.getWorldPosition(new THREE.Vector3());
                setIsZooming(true);
            }
        };
        const handlePointerLeave = () => setHoveredLabel();
        renderer.domElement.addEventListener("pointermove", handlePointerMove);
        renderer.domElement.addEventListener("click", handleClick);
        renderer.domElement.addEventListener("pointerleave", handlePointerLeave);

        // Keep the camera projection aligned with the responsive canvas size.
        const resize = () => {
            const width = mount.clientWidth;
            const height = mount.clientHeight;
            renderer.setSize(width, height);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
        };
        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(mount);
        resize();

        // Accumulate a clamped frame delta so an occasional delayed frame does
        // not make the planets visibly jump ahead in their orbits.
        let previousTimestamp = performance.now();
        let elapsed = 0;
        let frame: number | undefined;
        const animate = (timestamp: number) => {
            performanceMonitor?.begin();
            const delta = Math.min((timestamp - previousTimestamp) / 1000, MAX_FRAME_DELTA_SECONDS);
            previousTimestamp = timestamp;
            elapsed += delta;
            if (returning) {
                const progress = Math.min(
                    (elapsed - returnStartedAt) / RETURN_ZOOM_DURATION_SECONDS,
                    1,
                );
                const easedProgress = 1 - (1 - progress) ** 3;
                camera.position.lerpVectors(
                    returnStartPosition as THREE.Vector3,
                    overviewPosition,
                    easedProgress,
                );
                if (returningMesh) {
                    returningMesh.getWorldPosition(targetPosition);
                    returnTargetPosition.lerpVectors(targetPosition, overviewTarget, easedProgress);
                }
                camera.lookAt(returnTargetPosition);
                if (progress === 1) {
                    returning = false;
                    onReturnCompleteRef.current();
                }
            }
            // We map over each planet to update its position along its orbital ring.
            planets.forEach(({ mesh, hitbox, angle, distance, speed }, index) => {
                // Trigonometry (sine and cosine) is used to calculate the X and Z coordinates
                // of the circular orbit based on the elapsed time and planet speed.
                mesh.position.set(
                    Math.cos(angle + elapsed * speed) * distance,
                    0,
                    Math.sin(angle + elapsed * speed) * distance,
                );
                hitbox.position.copy(mesh.position);
                
                // AXIAL ROTATION:
                // We give each planet a unique axial rotation speed (spinning on its own Y axis)
                mesh.rotation.y = elapsed * (0.15 + (index * 0.2));
                // We also add a tiny bit of off-axis tilt wobble (like Earth's 23.5 degree tilt).
                // This makes the procedural noise patterns look fully 3D and dynamic as they spin.
                mesh.rotation.x = elapsed * (0.02 + (index * 0.03));
                mesh.rotation.z = elapsed * (0.01 + (index * 0.01));
                
                // HTML TRACKING:
                // We project the planet's 3D world position back into flat 2D screen coordinates
                // so that we can perfectly overlay standard HTML text labels on top of the WebGL canvas.
                const projected = mesh.getWorldPosition(projectedPosition).project(camera);
                const label = labelRefs.current[mesh.userData.id];
                if (label) {
                    const x = (projected.x * 0.5 + 0.5) * renderer.domElement.clientWidth;
                    const y = (-projected.y * 0.5 + 0.5) * renderer.domElement.clientHeight;
                    label.style.transform = `translate3d(${x}px, ${y}px, 0)`;
                }
            });
            // Interpolate the camera toward the selected planet using cubic easing,
            // then notify the parent once the transition has completed.
            if (zoomTarget) {
                const progress = Math.min(
                    (elapsed - zoomStartedAt) / PLANET_ZOOM_DURATION_SECONDS,
                    1,
                );
                const easedProgress = 1 - (1 - progress) ** 3;
                zoomTarget.getWorldPosition(targetPosition);
                if (!zoomStartPosition || !zoomStartTarget) {
                    return;
                }
                zoomDirection.copy(zoomStartPosition).sub(zoomStartTarget).normalize();
                endPosition
                    .copy(targetPosition)
                    .add(zoomDirection.multiplyScalar(PLANET_ZOOM_DISTANCE));
                camera.position.lerpVectors(zoomStartPosition, endPosition, easedProgress);
                camera.lookAt(targetPosition);
                if (progress === 1 && !zoomFinished) {
                    zoomFinished = true;
                    onSelectRef.current(zoomTarget.userData.id);
                }
            }
            // STAR TWINKLE (Individual Shimmer)
            // Rather than animating an entire layer of stars at once, we tap directly into the 
            // WebGL buffer geometry. This allows us to modify the brightness of thousands of 
            // individual stars independently at 60fps with almost zero performance cost.
            starGeometries.forEach((geometry, groupIndex) => {
                const colors = geometry.attributes.color.array as Float32Array;
                const baseColors = starBaseColors[groupIndex];
                for (let i = 0; i < colors.length; i += 3) {
                    // Create a unique phase for each star based on its index and position
                    const phase = i * 0.1 + elapsed * (2.0 + (i % 3));
                    // Fluctuate between 20% and 100% of base brightness
                    const twinkle = 0.2 + 0.8 * (0.5 + 0.5 * Math.sin(phase));
                    colors[i] = baseColors[i] * twinkle;
                    colors[i + 1] = baseColors[i + 1] * twinkle;
                    colors[i + 2] = baseColors[i + 2] * twinkle;
                }
                geometry.attributes.color.needsUpdate = true;
            });

            // Pulsing Sun Halo
            const pulse = Math.sin(elapsed * 1.5);
            sunHalo.scale.setScalar(1 + pulse * 0.04);
            sunHalo.material.opacity = 0.08 + pulse * 0.03;

            // Shooting Star Logic
            if (shootingStarProgress >= 1 && Math.random() < 0.003) {
                shootingStarProgress = 0;
                shootingStarStart.set((Math.random() - 0.5) * 40, (Math.random() - 0.5) * 20, -15 - Math.random() * 10);
                shootingStarEnd.copy(shootingStarStart).add(new THREE.Vector3(20 + Math.random() * 10, -10 - Math.random() * 10, 0));
                shootingStar.position.copy(shootingStarStart);
                shootingStar.lookAt(shootingStarEnd);
            }
            if (shootingStarProgress < 1) {
                shootingStarProgress += delta * 1.2;
                shootingStar.position.lerpVectors(shootingStarStart, shootingStarEnd, shootingStarProgress);
                (shootingStar.material as THREE.MeshBasicMaterial).opacity = Math.sin(shootingStarProgress * Math.PI);
            }

            // Slowly rotate the sun while rendering the current frame.
            sun.rotation.y = elapsed * SUN_ROTATION_SPEED;
            sunUniforms.time.value = elapsed;

            renderer.render(scene, camera);
            performanceMonitor?.end();
            frame = requestAnimationFrame(animate);
        };
        animate(performance.now());

        return () => {
            // Stop the loop and detach listeners before releasing WebGL resources.
            isDisposed = true;
            sessionStorage.setItem(
                PLANET_POSITION_STORAGE_KEY,
                JSON.stringify(
                    Object.fromEntries(
                        planets.map(({ mesh, angle, speed }) => [
                            mesh.userData.id,
                            angle + elapsed * speed,
                        ]),
                    ),
                ),
            );
            if (frame !== undefined) {
                cancelAnimationFrame(frame);
            }
            starTexture.dispose();
            resizeObserver.disconnect();
            renderer.domElement.removeEventListener("pointermove", handlePointerMove);
            renderer.domElement.removeEventListener("click", handleClick);
            renderer.domElement.removeEventListener("pointerleave", handlePointerLeave);
            scene.traverse((object) => {
                if ("geometry" in object && object.geometry instanceof THREE.BufferGeometry) {
                    object.geometry.dispose();
                }
                if ("material" in object && object.material) {
                    const materials = Array.isArray(object.material)
                        ? object.material
                        : [object.material];
                    materials.forEach((material) => {
                        if (material instanceof THREE.Material) {
                            material.dispose();
                        }
                    });
                }
            });
            renderer.dispose();
            performanceMonitor?.dispose();
            mount.removeChild(renderer.domElement);
        };
    }, []);

    return (
        <div
            className="relative h-full w-full"
            ref={mountRef}
            aria-label="Interactive orbital navigation"
            role="img"
        >
            {/* Fade the scene during the camera transition into a destination. */}
            <div
                className={`pointer-events-none absolute inset-0 z-10 bg-[#101010] transition-opacity duration-700 ${isZooming ? "opacity-35" : "opacity-0"}`}
            />
            {/* HTML labels stay crisp while the planets remain WebGL-rendered. */}
            <div className="pointer-events-none absolute inset-0">
                {destinations.map((destination) => (
                    <div
                        className="absolute whitespace-nowrap text-center font-mono"
                        key={destination.id}
                        ref={(element) => {
                            labelRefs.current[destination.id] = element;
                        }}
                    >
                        <div className="absolute left-1/2 top-6 -translate-x-1/2 whitespace-nowrap">
                            <strong className="block text-sm uppercase tracking-[.14em] text-text sm:text-lg">
                                {destination.label}
                            </strong>
                            <span
                                className="mt-1 block text-xs text-muted opacity-0 transition-opacity duration-200 sm:text-base"
                                ref={(element) => {
                                    descriptionRefs.current[destination.id] = element;
                                }}
                            >
                                {destination.description}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default OrbitalScene;
