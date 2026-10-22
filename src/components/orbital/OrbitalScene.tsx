import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { ThreePerf as ThreePerfInstance } from "three-perf";
import { destinations, type DestinationId } from "../../constants/destinations";
import { createStarField, createShootingStar } from "./stars";
import { createSun } from "./sun";
import {
    createPlanetSystem,
    updatePlanets,
    readSavedPlanetAngles,
    savePlanetAngles,
} from "./planets";

interface OrbitalSceneProps {
    onSelect: (destination: string) => void;
    onReturnComplete: () => void;
    returnFrom?: DestinationId;
    isBlackHole?: boolean;
    onEscapeBlackHole?: () => void;
}

// =============================================================================
// CAMERA OVERVIEW & VIEWPORT PROJECTION
// Defines default and responsive field-of-view, clipping planes, and positions.
// =============================================================================
const CAMERA_FOV = 40;                // Desktop field of view (degrees)
const CAMERA_NEAR_CLIP = 0.1;         // Near clipping frustum plane
const CAMERA_FAR_CLIP = 100;          // Far clipping frustum plane
const DESKTOP_CAMERA_POSITION = new THREE.Vector3(0, 22, 18); // Default desktop overview coordinates
const MOBILE_CAMERA_POSITION = new THREE.Vector3(0, 20, 21);  // Pulled back for vertical smartphone viewports
const BLACKHOLE_DESKTOP_CAMERA_POSITION = new THREE.Vector3(0, -6.8, 6.2); // Low-angle descent coordinates framing the accretion disk
const BLACKHOLE_MOBILE_CAMERA_POSITION = new THREE.Vector3(0, -7.5, 7.2);  // Smartphone framing for event horizon

// =============================================================================
// BLACK HOLE CHOREOGRAPHY & GRAVITATIONAL ACCELERATION
// Controls transition timing and cubic ease-in freefall acceleration curves.
// =============================================================================
const BLACKHOLE_DESCENT_DURATION_SECONDS = 4.2; // Slower, dramatic collapse & gravitational dive duration
const BLACKHOLE_ESCAPE_DURATION_SECONDS = 2.0;  // Smooth thruster burn return duration
const BLACKHOLE_CAMERA_ACCEL_POWER = 3.2;       // Exponent creating "slow at first, then faster" freefall

// =============================================================================
// RESPONSIVE MOBILE BREAKPOINTS & PERFORMANCE SCALING
// Downscales geometry and limits WebGL pixel ratios on mobile/low-power devices.
// =============================================================================
const MOBILE_BREAKPOINT = 640;        // Viewport width breakpoint in pixels
const MOBILE_CAMERA_FOV = 46;         // Slightly wider FOV to frame planets comfortably on phones
const MOBILE_SYSTEM_SCALE = 0.82;     // Overall solar system group scale multiplier on mobile
const MAX_PIXEL_RATIO = 1.5;          // Desktop device pixel ratio cap to balance crispness & GPU load
const MOBILE_PIXEL_RATIO = 1.25;      // Mobile/low-power pixel ratio cap to preserve battery & 60fps

// =============================================================================
// SCENE ORIENTATION & TIMING
// Sets the overall orbital plane tilt and delta time clamping.
// =============================================================================
const SYSTEM_TILT = 0.15;             // Slight pitch inclination for the entire solar system
const ORBIT_VERTICAL_OFFSET = -10;    // Y-axis offset centering the solar system in the viewport
const MAX_FRAME_DELTA_SECONDS = 0.05; // Maximum accumulated delta per frame (prevents tab-switch jump)

// =============================================================================
// CAMERA TRANSITIONS (ZOOM-IN & RETURN)
// Durations and distances for navigating between overview and planet surfaces.
// =============================================================================
const PLANET_ZOOM_DISTANCE = 1.35;        // Distance camera stops in front of target planet
const PLANET_ZOOM_DURATION_SECONDS = 1;   // Duration of zoom-in transition
const RETURN_ZOOM_DURATION_SECONDS = 1.5; // Duration of zoom-out return animation

// =============================================================================
// TIME ACCELERATION & TACHYON OVERDRIVE EASTER EGG
// Configures orbital speed boost on Spacebar hold and collapse into black hole.
// =============================================================================
const TIME_ACCEL_STANDARD_MULTIPLIER = 6.0;   // Baseline time dilation speed
const TIME_ACCEL_OVERDRIVE_MULTIPLIER = 10.0; // Tachyon overload peak speed
const TIME_ACCEL_LERP_FACTOR = 0.08;          // Smooth transition rate into acceleration
const TIME_DECEL_LERP_FACTOR = 0.06;          // Smooth deceleration rate back to normal time
const OVERDRIVE_WARNING_SECONDS = 2.4;        // Continuous hold time before tachyon overload begins
const OVERDRIVE_COLLAPSE_SECONDS = 4.4;       // Continuous hold time triggering gravitational collapse
const SUN_HUD_OFFSET_Y = 3.2;                 // Local vertical offset above sun for telemetry HUD
const STARLIGHT_STORAGE_KEY = "caden-starlight-captured";
const STARLIGHT_TOAST_DURATION_MS = 2000;     // Duration spatial starlight badge remains visible

// =============================================================================
// LIGHTING CONFIGURATION
// Configures soft ambient fill and the warm central point light emitted from the sun.
// =============================================================================
const AMBIENT_LIGHT_COLOR = 0x9da6b5;     // Cool ambient fill color
const AMBIENT_LIGHT_INTENSITY = 0.2;      // Subtle fill intensity
const SUN_LIGHT_COLOR = 0xffd39b;         // Warm incandescent sunlight color
const SUN_LIGHT_INTENSITY = 40;           // High-intensity central emission
const SUN_LIGHT_DISTANCE = 45;            // Max radial falloff distance
const SUN_LIGHT_DECAY = 2;                // Physically realistic quadratic attenuation

function OrbitalScene({
    onSelect,
    onReturnComplete,
    returnFrom,
    isBlackHole = false,
    onEscapeBlackHole,
}: OrbitalSceneProps) {
    const mountRef = useRef<HTMLDivElement>(null);
    const labelRefs = useRef<Record<string, HTMLDivElement | null>>({});
    const descriptionRefs = useRef<Record<string, HTMLSpanElement | null>>({});
    const sunTelemetryRef = useRef<HTMLDivElement>(null);
    const sunTelemetryTextRef = useRef<HTMLSpanElement>(null);
    const starlightBadgeRef = useRef<HTMLDivElement>(null);
    const starlightTextRef = useRef<HTMLSpanElement>(null);
    const blackHoleHudRef = useRef<HTMLDivElement>(null);
    const blackHoleStatusTextRef = useRef<HTMLSpanElement>(null);
    const [isZooming, setIsZooming] = useState(false);
    const [blackHoleUIActive, setBlackHoleUIActive] = useState(false);

    const onSelectRef = useRef<(destination: string) => void>(onSelect);
    const onReturnCompleteRef = useRef(onReturnComplete);
    const returnFromRef = useRef(returnFrom);
    const isBlackHoleRef = useRef(isBlackHole);
    const onEscapeBlackHoleRef = useRef(onEscapeBlackHole);
    const blackHoleUIActiveRef = useRef(false);

    useEffect(() => {
        onSelectRef.current = onSelect;
    }, [onSelect]);

    useEffect(() => {
        onReturnCompleteRef.current = onReturnComplete;
    }, [onReturnComplete]);

    useEffect(() => {
        returnFromRef.current = returnFrom;
    }, [returnFrom]);

    useEffect(() => {
        isBlackHoleRef.current = isBlackHole;
        if (isBlackHole) {
            console.warn(
                "%c[TELEMETRY] Proximity alert: Gravitational singularity reached. Time dilation infinite at r=2GM/c².",
                "color: #f1bd78; font-family: monospace; font-size: 13px; font-weight: bold;",
            );
        } else {
            blackHoleUIActiveRef.current = false;
        }
    }, [isBlackHole]);

    useEffect(() => {
        onEscapeBlackHoleRef.current = onEscapeBlackHole;
    }, [onEscapeBlackHole]);

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

        // Three.js Scene and Camera
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
            isMobile ? MOBILE_CAMERA_FOV : CAMERA_FOV,
            1,
            CAMERA_NEAR_CLIP,
            CAMERA_FAR_CLIP,
        );
        camera.position.copy(isMobile ? MOBILE_CAMERA_POSITION : DESKTOP_CAMERA_POSITION);
        camera.lookAt(0, ORBIT_VERTICAL_OFFSET, 0);
        const overviewPosition = (isMobile ? MOBILE_CAMERA_POSITION : DESKTOP_CAMERA_POSITION).clone();

        // Renderer
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

        // Lighting & System Group
        scene.add(new THREE.AmbientLight(AMBIENT_LIGHT_COLOR, AMBIENT_LIGHT_INTENSITY));
        const sunLight = new THREE.PointLight(
            SUN_LIGHT_COLOR,
            SUN_LIGHT_INTENSITY,
            SUN_LIGHT_DISTANCE,
            SUN_LIGHT_DECAY,
        );

        const system = new THREE.Group();
        system.add(sunLight);
        system.rotation.x = SYSTEM_TILT;
        system.position.y = ORBIT_VERTICAL_OFFSET;
        system.scale.setScalar(sceneScale);
        scene.add(system);

        // Sub-systems from modular files
        const { starTexture, updateTwinkle } = createStarField(scene, isMobile, isLowPower);
        const {
            updateShootingStar,
            checkCatch,
            dispose: disposeShootingStar,
        } = createShootingStar(scene, starTexture);
        const { sun, sunHitbox, updateSun, dispose: disposeSun } = createSun(system, isMobile);
        const { planets, planetHitboxes, orbitLines } = createPlanetSystem(system, isMobile, savedPlanetAngles);

        // Return zoom state
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
            mesh.updateWorldMatrix(true, false);
            const planetPosition = mesh.getWorldPosition(new THREE.Vector3());
            const initialDirection = overviewPosition.clone().sub(planetPosition).normalize();
            returnStartPosition = planetPosition
                .clone()
                .add(initialDirection.multiplyScalar(PLANET_ZOOM_DISTANCE));
            camera.position.copy(returnStartPosition);
            camera.lookAt(planetPosition);
            returning = true;
        }

        // Raycasting & Interaction
        const raycaster = new THREE.Raycaster();
        const pointer = new THREE.Vector2();
        const projectedPosition = new THREE.Vector3();
        const targetPosition = new THREE.Vector3();
        const zoomDirection = new THREE.Vector3();
        const endPosition = new THREE.Vector3();
        const currentReturnStart = new THREE.Vector3();
        const returnDirection = new THREE.Vector3();

        const updatePointer = (event: MouseEvent | PointerEvent) => {
            const bounds = renderer.domElement.getBoundingClientRect();
            pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
            pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
        };

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

        let starlightFadeTimer: number | undefined;
        const tempCatchVector = new THREE.Vector3();

        const triggerStarlightCapture = (worldPosition: THREE.Vector3) => {
            const currentCount =
                parseInt(localStorage.getItem(STARLIGHT_STORAGE_KEY) || "0", 10) + 1;
            localStorage.setItem(STARLIGHT_STORAGE_KEY, currentCount.toString());

            if (starlightBadgeRef.current && starlightTextRef.current) {
                tempCatchVector.copy(worldPosition).project(camera);
                if (tempCatchVector.z <= 1) {
                    const x = (tempCatchVector.x * 0.5 + 0.5) * renderer.domElement.clientWidth;
                    const y = (-tempCatchVector.y * 0.5 + 0.5) * renderer.domElement.clientHeight;

                    starlightBadgeRef.current.style.transform = `translate3d(${x}px, ${y + 24}px, 0)`;
                    starlightTextRef.current.textContent = `[+1 STARLIGHT CAPTURED // TOTAL: ${currentCount}]`;
                    starlightBadgeRef.current.style.opacity = "1";

                    if (starlightFadeTimer !== undefined) {
                        window.clearTimeout(starlightFadeTimer);
                    }
                    starlightFadeTimer = window.setTimeout(() => {
                        if (starlightBadgeRef.current) {
                            starlightBadgeRef.current.style.opacity = "0";
                        }
                    }, STARLIGHT_TOAST_DURATION_MS);
                }
            }
        };

        const handlePointerMove = (event: PointerEvent) => {
            updatePointer(event);
            raycaster.setFromCamera(pointer, camera);
            const hovered = raycaster.intersectObjects(planetHitboxes)[0]?.object;
            renderer.domElement.style.cursor = hovered ? "pointer" : "default";
            setHoveredLabel(hovered?.userData.id);

            // Shooting star hover catch check
            const bounds = renderer.domElement.getBoundingClientRect();
            const pixelX = event.clientX - bounds.left;
            const pixelY = event.clientY - bounds.top;
            const catchResult = checkCatch(pixelX, pixelY, camera, bounds.width, bounds.height, false);
            if (catchResult.caught && catchResult.worldPosition) {
                triggerStarlightCapture(catchResult.worldPosition);
            }
        };

        let zoomTarget: THREE.Mesh | null = null;
        let zoomStartedAt = 0;
        let zoomStartPosition: THREE.Vector3 | null = null;
        let zoomStartTarget: THREE.Vector3 | null = null;
        let zoomFinished = false;

        const handleClick = (event: MouseEvent) => {
            updatePointer(event);

            // Shooting star click catch check
            const bounds = renderer.domElement.getBoundingClientRect();
            const pixelX = event.clientX - bounds.left;
            const pixelY = event.clientY - bounds.top;
            const catchResult = checkCatch(pixelX, pixelY, camera, bounds.width, bounds.height, true);
            if (catchResult.caught && catchResult.worldPosition) {
                triggerStarlightCapture(catchResult.worldPosition);
                return;
            }

            if (isBlackHoleRef.current || currentBlackHoleProgress > 0.05) {
                return;
            }

            raycaster.setFromCamera(pointer, camera);
            const selected = raycaster.intersectObjects(planetHitboxes)[0]?.object as
                THREE.Mesh | undefined;
            if (selected && !zoomTarget) {
                if (returning) {
                    returning = false;
                }
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

        // Time Acceleration State (Spacebar & Sun Hold)
        let isAccelerating = false;
        let speedMultiplier = 1.0;
        let orbitalElapsed = 0;
        let sunHoldTimer: number | undefined;

        const isEditableElement = (element: Element | null): boolean => {
            if (!element) return false;
            const tagName = element.tagName.toLowerCase();
            return (
                tagName === "input" ||
                tagName === "textarea" ||
                (element as HTMLElement).isContentEditable
            );
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" || event.code === "Escape") {
                if (isBlackHoleRef.current) {
                    isBlackHoleRef.current = false;
                    blackHoleUIActiveRef.current = false;
                    if (blackHoleHudRef.current) {
                        blackHoleHudRef.current.style.display = "none";
                    }
                    setBlackHoleUIActive(false);
                    onEscapeBlackHoleRef.current?.();
                    return;
                }
            }
            if (event.code === "Space" && !isEditableElement(document.activeElement)) {
                if (!zoomTarget && !returning) {
                    event.preventDefault();
                    isAccelerating = true;
                }
            }
        };

        const handleKeyUp = (event: KeyboardEvent) => {
            if (event.code === "Space") {
                isAccelerating = false;
            }
        };

        const handleWindowBlur = () => {
            isAccelerating = false;
        };

        const handlePointerDown = (event: PointerEvent) => {
            if (zoomTarget || returning || isBlackHoleRef.current) return;
            updatePointer(event);
            raycaster.setFromCamera(pointer, camera);
            const hitSun = raycaster.intersectObject(sunHitbox).length > 0;
            if (hitSun) {
                // Immediately engage acceleration on mobile touch or mouse hold
                isAccelerating = true;
            }
        };

        const handlePointerUp = () => {
            if (sunHoldTimer !== undefined) {
                window.clearTimeout(sunHoldTimer);
                sunHoldTimer = undefined;
            }
            isAccelerating = false;
        };

        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        window.addEventListener("blur", handleWindowBlur);
        renderer.domElement.addEventListener("pointerdown", handlePointerDown);
        window.addEventListener("pointerup", handlePointerUp);
        window.addEventListener("pointercancel", handlePointerUp);

        // Responsive Resizing & Orientation Change
        const resize = () => {
            const width = mount.clientWidth;
            const height = mount.clientHeight;
            if (width === 0 || height === 0) {
                return;
            }

            renderer.setSize(width, height);
            camera.aspect = width / height;

            const currentIsMobile = width < MOBILE_BREAKPOINT;
            camera.fov = currentIsMobile ? MOBILE_CAMERA_FOV : CAMERA_FOV;
            overviewPosition.copy(currentIsMobile ? MOBILE_CAMERA_POSITION : DESKTOP_CAMERA_POSITION);
            system.scale.setScalar(currentIsMobile ? MOBILE_SYSTEM_SCALE : 1);
            camera.updateProjectionMatrix();

            if (!returning && !zoomTarget) {
                camera.position.copy(overviewPosition);
                camera.lookAt(0, ORBIT_VERTICAL_OFFSET, 0);
            }
        };
        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(mount);
        resize();

        // Animation Loop
        let previousTimestamp = performance.now();
        let elapsed = 0;
        let frame: number | undefined;
        let currentBlackHoleProgress = 0;
        let accelHoldTime = 0;
        let isTriggeringCollapse = false;
        const sunHudAnchor = new THREE.Vector3();

        const animate = (timestamp: number) => {
            performanceMonitor?.begin();
            const delta = Math.min((timestamp - previousTimestamp) / 1000, MAX_FRAME_DELTA_SECONDS);
            previousTimestamp = timestamp;
            elapsed += delta;

            // Black hole singularity state integration
            const isBlackHoleActive = Boolean(isBlackHoleRef.current);
            if (isBlackHoleActive) {
                currentBlackHoleProgress = Math.min(
                    1.0,
                    currentBlackHoleProgress + delta / BLACKHOLE_DESCENT_DURATION_SECONDS,
                );
            } else {
                currentBlackHoleProgress = Math.max(
                    0.0,
                    currentBlackHoleProgress - delta / BLACKHOLE_ESCAPE_DURATION_SECONDS,
                );
            }

            const shouldShowBlackHoleUI =
                isBlackHoleActive && currentBlackHoleProgress > 0.08;
            if (shouldShowBlackHoleUI !== blackHoleUIActiveRef.current) {
                blackHoleUIActiveRef.current = shouldShowBlackHoleUI;
                setBlackHoleUIActive(shouldShowBlackHoleUI);
            }

            if (blackHoleStatusTextRef.current) {
                blackHoleStatusTextRef.current.textContent =
                    currentBlackHoleProgress >= 0.85
                        ? "CRITICAL // EVENT HORIZON REACHED"
                        : "SINGULARITY DETECTED // FREEFALL";
            }

            // Time acceleration & Tachyon Overdrive calculation
            let targetMultiplier = 1.0;
            if (isTriggeringCollapse) {
                targetMultiplier = TIME_ACCEL_OVERDRIVE_MULTIPLIER;
                // Once the black hole descent actually begins, release the trigger latch
                if (currentBlackHoleProgress > 0.08) {
                    isTriggeringCollapse = false;
                }
            } else if (isAccelerating && !zoomTarget && !returning && !isBlackHoleActive) {
                accelHoldTime += delta;
                if (accelHoldTime >= OVERDRIVE_COLLAPSE_SECONDS) {
                    // Trigger black hole collapse!
                    isTriggeringCollapse = true;
                    accelHoldTime = 0;
                    isAccelerating = false;
                    onSelectRef.current("blackhole");
                } else if (accelHoldTime >= OVERDRIVE_WARNING_SECONDS) {
                    const overdriveProgress =
                        (accelHoldTime - OVERDRIVE_WARNING_SECONDS) /
                        (OVERDRIVE_COLLAPSE_SECONDS - OVERDRIVE_WARNING_SECONDS);
                    targetMultiplier = THREE.MathUtils.lerp(
                        TIME_ACCEL_STANDARD_MULTIPLIER,
                        TIME_ACCEL_OVERDRIVE_MULTIPLIER,
                        overdriveProgress,
                    );
                } else {
                    targetMultiplier = TIME_ACCEL_STANDARD_MULTIPLIER;
                }
            } else {
                accelHoldTime = 0;
            }

            const lerpFactor = targetMultiplier > speedMultiplier
                ? TIME_ACCEL_LERP_FACTOR
                : TIME_DECEL_LERP_FACTOR;
            speedMultiplier = THREE.MathUtils.lerp(speedMultiplier, targetMultiplier, lerpFactor);
            if (!isAccelerating && Math.abs(speedMultiplier - 1.0) < 0.01) {
                speedMultiplier = 1.0;
            }

            orbitalElapsed += delta * speedMultiplier;

            // 1. Update planets along their orbits (with black hole infall & orbit line fading)
            updatePlanets(planets, orbitalElapsed, currentBlackHoleProgress, orbitLines);

            // 2. Camera transitions (return zoom-out, planet zoom-in, or black hole descent)
            if (returning) {
                const progress = Math.min(
                    (elapsed - returnStartedAt) / RETURN_ZOOM_DURATION_SECONDS,
                    1,
                );
                const easedProgress = progress * progress * (3 - 2 * progress);

                if (returningMesh) {
                    returningMesh.getWorldPosition(targetPosition);
                    returnDirection.copy(overviewPosition).sub(targetPosition).normalize();
                    currentReturnStart
                        .copy(targetPosition)
                        .add(returnDirection.multiplyScalar(PLANET_ZOOM_DISTANCE));

                    camera.position.lerpVectors(
                        currentReturnStart,
                        overviewPosition,
                        easedProgress,
                    );
                    returnTargetPosition.lerpVectors(targetPosition, overviewTarget, easedProgress);
                    camera.lookAt(returnTargetPosition);
                } else if (returnStartPosition) {
                    camera.position.lerpVectors(
                        returnStartPosition,
                        overviewPosition,
                        easedProgress,
                    );
                    camera.lookAt(overviewTarget);
                }

                if (progress === 1) {
                    returning = false;
                    onReturnCompleteRef.current();
                }
            }

            if (zoomTarget) {
                const progress = Math.min(
                    (elapsed - zoomStartedAt) / PLANET_ZOOM_DURATION_SECONDS,
                    1,
                );
                const easedProgress = 1 - (1 - progress) ** 3;
                zoomTarget.getWorldPosition(targetPosition);
                if (zoomStartPosition && zoomStartTarget) {
                    zoomDirection.copy(zoomStartPosition).sub(zoomStartTarget).normalize();
                    endPosition
                        .copy(targetPosition)
                        .add(zoomDirection.multiplyScalar(PLANET_ZOOM_DISTANCE));
                    camera.position.lerpVectors(zoomStartPosition, endPosition, easedProgress);
                    camera.lookAt(targetPosition);
                }
                if (progress === 1 && !zoomFinished) {
                    zoomFinished = true;
                    onSelectRef.current(zoomTarget.userData.id);
                }
            }

            if (!returning && !zoomTarget) {
                if (currentBlackHoleProgress > 0) {
                    const targetCamera = isMobile
                        ? BLACKHOLE_MOBILE_CAMERA_POSITION
                        : BLACKHOLE_DESKTOP_CAMERA_POSITION;

                    // During descent: cubic ease-in freefall ("slow at first, then accelerating faster")
                    // During escape: smoothstep thruster burn back into stable overview orbit
                    const cameraProgress = isBlackHoleActive
                        ? Math.pow(currentBlackHoleProgress, BLACKHOLE_CAMERA_ACCEL_POWER)
                        : currentBlackHoleProgress *
                          currentBlackHoleProgress *
                          (3 - 2 * currentBlackHoleProgress);

                    camera.position.lerpVectors(overviewPosition, targetCamera, cameraProgress);
                    camera.lookAt(overviewTarget);
                }
            }

            // 3. HTML label tracking
            planets.forEach(({ mesh }) => {
                const projected = mesh.getWorldPosition(projectedPosition).project(camera);
                const label = labelRefs.current[mesh.userData.id];
                if (label) {
                    if (projected.z > 1 || currentBlackHoleProgress > 0.6) {
                        label.style.display = "none";
                    } else {
                        label.style.display = "";
                        const x = (projected.x * 0.5 + 0.5) * renderer.domElement.clientWidth;
                        const y = (-projected.y * 0.5 + 0.5) * renderer.domElement.clientHeight;
                        label.style.transform = `translate3d(${x}px, ${y}px, 0)`;
                        label.style.opacity = `${Math.max(0, 1 - currentBlackHoleProgress * 1.8)}`;
                    }
                }
            });

            // 4. Update visual sub-systems
            updateTwinkle(orbitalElapsed);
            updateShootingStar(delta);

            // The central star smoothly collapses over the first ~75% of the sequence
            const shaderProgress = isBlackHoleActive
                ? THREE.MathUtils.smoothstep(currentBlackHoleProgress, 0.0, 0.75)
                : currentBlackHoleProgress;
            updateSun(orbitalElapsed, shaderProgress);

            // 5. Update Sun Telemetry HUD readout
            if (sunTelemetryRef.current && sunTelemetryTextRef.current) {
                const showTelemetry =
                    (speedMultiplier > 1.05 || isTriggeringCollapse) && currentBlackHoleProgress < 0.08;
                if (showTelemetry) {
                    sunTelemetryRef.current.style.opacity = "1";

                    let statusMessage = `[TIME DILATION // ${speedMultiplier.toFixed(1)}X]`;
                    if (isTriggeringCollapse) {
                        statusMessage = "[CRITICAL: MASS LIMIT REACHED // IMPLOSION]";
                    } else if (accelHoldTime >= OVERDRIVE_WARNING_SECONDS) {
                        const overdriveProgress =
                            (accelHoldTime - OVERDRIVE_WARNING_SECONDS) /
                            (OVERDRIVE_COLLAPSE_SECONDS - OVERDRIVE_WARNING_SECONDS);
                        statusMessage =
                            overdriveProgress >= 0.55
                                ? "[CRITICAL: MASS LIMIT REACHED // IMPLOSION]"
                                : `[TACHYON OVERLOAD // ${speedMultiplier.toFixed(1)}X]`;
                    }
                    sunTelemetryTextRef.current.textContent = statusMessage;

                    sunHudAnchor.set(0, SUN_HUD_OFFSET_Y, 0);
                    sun.localToWorld(sunHudAnchor);
                    sunHudAnchor.project(camera);

                    if (sunHudAnchor.z <= 1) {
                        const x = (sunHudAnchor.x * 0.5 + 0.5) * renderer.domElement.clientWidth;
                        const y = (-sunHudAnchor.y * 0.5 + 0.5) * renderer.domElement.clientHeight;
                        sunTelemetryRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
                    }
                } else {
                    sunTelemetryRef.current.style.opacity = "0";
                }
            }

            renderer.render(scene, camera);
            performanceMonitor?.end();
            frame = requestAnimationFrame(animate);
        };
        animate(performance.now());

        // Cleanup
        return () => {
            isDisposed = true;
            savePlanetAngles(planets, orbitalElapsed);

            if (frame !== undefined) {
                cancelAnimationFrame(frame);
            }
            if (sunHoldTimer !== undefined) {
                window.clearTimeout(sunHoldTimer);
            }
            if (starlightFadeTimer !== undefined) {
                window.clearTimeout(starlightFadeTimer);
            }
            disposeShootingStar();
            disposeSun();
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
            window.removeEventListener("blur", handleWindowBlur);
            renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
            window.removeEventListener("pointerup", handlePointerUp);
            window.removeEventListener("pointercancel", handlePointerUp);

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
            <div
                className={`pointer-events-none absolute inset-0 z-10 bg-[#101010] transition-opacity duration-700 ${isZooming ? "opacity-35" : "opacity-0"}`}
            />
            {/* Spatial Telemetry Readout (Projected directly above Sun) */}
            <div
                className="pointer-events-none absolute left-0 top-0 z-20 -translate-x-1/2 -translate-y-full select-none whitespace-nowrap font-mono text-xs uppercase tracking-[.14em] text-accent opacity-0 transition-opacity duration-150"
                ref={sunTelemetryRef}
                aria-live="polite"
            >
                <div className="flex items-center gap-1.5 border border-line/80 bg-bg/90 px-2.5 py-1 shadow-sm backdrop-blur-xs">
                    <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
                    <span ref={sunTelemetryTextRef}>[TIME DILATION // 1.0X]</span>
                </div>
            </div>
            {/* Spatial Telemetry Readout (Shooting Star Catch - Appears Below Star) */}
            <div
                className="pointer-events-none absolute left-0 top-0 z-30 -translate-x-1/2 select-none whitespace-nowrap font-mono text-xs uppercase tracking-[.14em] text-accent opacity-0 transition-opacity duration-200"
                ref={starlightBadgeRef}
                aria-live="polite"
            >
                <div className="flex items-center gap-1.5 border border-line/80 bg-bg/95 px-2.5 py-1 shadow-md backdrop-blur-xs">
                    <span className="text-accent">✦</span>
                    <span ref={starlightTextRef}>[+1 STARLIGHT CAPTURED]</span>
                </div>
            </div>
            {/* Black Hole Event Horizon Warning & Abort Controls */}
            {isBlackHole && blackHoleUIActive && (
                <div
                    ref={blackHoleHudRef}
                    className="pointer-events-auto absolute inset-x-0 bottom-10 z-30 flex flex-col items-center justify-center gap-3 font-mono select-none"
                    aria-live="polite"
                >
                    <div className="flex items-center gap-2 border border-accent/40 bg-bg/95 px-3.5 py-1.5 text-xs uppercase tracking-[.14em] text-accent shadow-lg backdrop-blur-xs">
                        <span className="inline-block h-2 w-2 animate-ping rounded-full bg-accent" />
                        <span ref={blackHoleStatusTextRef}>CRITICAL // EVENT HORIZON REACHED</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            isBlackHoleRef.current = false;
                            blackHoleUIActiveRef.current = false;
                            if (blackHoleHudRef.current) {
                                blackHoleHudRef.current.style.display = "none";
                            }
                            setBlackHoleUIActive(false);
                            onEscapeBlackHoleRef.current?.();
                        }}
                        className="cursor-pointer border border-line bg-bg/90 px-4 py-1.5 font-mono text-xs uppercase tracking-wider text-muted transition-colors hover:border-accent hover:text-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    >
                        [← ESCAPE ORBIT // ESC]
                    </button>
                </div>
            )}
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
