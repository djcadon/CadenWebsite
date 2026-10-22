import * as THREE from "three";

// =============================================================================
// STAR TEXTURE CONFIGURATION
// Dimensions for the procedurally drawn 6-point canvas star texture.
// =============================================================================
const STAR_TEXTURE_SIZE = 64;
const STAR_TEXTURE_CENTER = STAR_TEXTURE_SIZE / 2;

// =============================================================================
// STARFIELD BOUNDS & DENSITY
// Defines the width (X), height (Y), and depth (Z) of the deep-space starbox.
// =============================================================================
const STAR_BOUNDS_X = 45;
const STAR_BOUNDS_Y = 28;
const STAR_BOUNDS_Z = 45;

// =============================================================================
// SUN LINE-OF-SIGHT EXCLUSION CYLINDER
// Prevents stars from spawning along the direct diagonal vector between the
// camera at (0, 22, 18) and the sun at (0, -10, 0), ensuring the sun is never
// visually obstructed by foreground stars.
// =============================================================================
const SUN_CAMERA_DELTA_Y = 32; // Difference in Y between camera (22) and sun (-10)
const SUN_CAMERA_DELTA_Z = 18; // Difference in Z between camera (18) and sun (0)
const SUN_CAMERA_DISTANCE_SQ = 1348; // 32^2 + 18^2 (squared length of the vector)
const SUN_CAMERA_DISTANCE = 36.715; // Math.sqrt(1348) (Euclidean length of the vector)
const STAR_EXCLUSION_RADIUS = 5; // Radius of the hollow cylinder cleared around the sightline

// =============================================================================
// SHOOTING STAR TUNING & CATCH MECHANICS
// Controls the frequency, velocity, and visual elongation of occasional shooting
// stars, as well as stardust burst physics when caught by hover or click.
// =============================================================================
const SHOOTING_STAR_TRIGGER_CHANCE = 0.003; // Probability per frame of spawning a shooting star
const SHOOTING_STAR_SPEED = 0.95; // Traversal speed (balanced so visitors can track & catch it)
const SHOOTING_STAR_STRETCH_Z = 25; // Z-axis mesh elongation factor to create the streak effect
const SHOOTING_STAR_RADIUS = 0.08; // Base sphere radius before stretching
const BURST_PARTICLE_COUNT = 20; // Spark count for starlight burst when caught
const BURST_DURATION_SECONDS = 0.75; // Lifespan of sparkling dust explosion
const CATCH_RADIUS_HOVER_PX = 42; // Screen-space proximity threshold for mouse hover catch
const CATCH_RADIUS_CLICK_PX = 60; // Expanded threshold for touch tap / click catch

export function createStarTexture(): THREE.CanvasTexture {
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
    return starTexture;
}

export interface StarField {
    starClouds: THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>[];
    starTexture: THREE.CanvasTexture;
    updateTwinkle: (elapsed: number) => void;
}

export function createStarField(
    scene: THREE.Scene,
    isMobile: boolean,
    isLowPower: boolean,
): StarField {
    const starTexture = createStarTexture();
    const starClouds: THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>[] = [];
    const starGeometries: THREE.BufferGeometry[] = [];
    const starBaseColors: Float32Array[] = [];

    const starGroups = [
        { count: isMobile || isLowPower ? 500 : 900, size: 0.14 },
        { count: isMobile || isLowPower ? 140 : 280, size: 0.24 },
        { count: isMobile || isLowPower ? 24 : 45, size: 0.42 },
    ];

    starGroups.forEach(({ count, size }) => {
        const starGeometry = new THREE.BufferGeometry();
        const starPositions = new Float32Array(count * 3);
        const starColors = new Float32Array(count * 3);

        for (let i = 0; i < count; i += 1) {
            const position = i * 3;
            const brightness = 0.3 + Math.random() * 0.7;
            let x: number, y: number, z: number;
            let inCylinder = false;

            // Generate stars in a compact box, hollowing out a diagonal cylinder
            // between camera and sun to prevent overlapping in front of the sun.
            do {
                x = (Math.random() - 0.5) * STAR_BOUNDS_X;
                y = (Math.random() - 0.5) * STAR_BOUNDS_Y;
                z = (Math.random() - 0.5) * STAR_BOUNDS_Z;

                const crossX = SUN_CAMERA_DELTA_Y * z - SUN_CAMERA_DELTA_Z * (y + 10);
                const crossY = SUN_CAMERA_DELTA_Z * x;
                const crossZ = -SUN_CAMERA_DELTA_Y * x;
                const crossMag = Math.sqrt(crossX * crossX + crossY * crossY + crossZ * crossZ);
                const distToLine = crossMag / SUN_CAMERA_DISTANCE;

                const t =
                    (SUN_CAMERA_DELTA_Y * (y + 10) + SUN_CAMERA_DELTA_Z * z) /
                    SUN_CAMERA_DISTANCE_SQ;
                inCylinder = distToLine < STAR_EXCLUSION_RADIUS && t > -0.1;
            } while (inCylinder);

            starPositions[position] = x;
            starPositions[position + 1] = y;
            starPositions[position + 2] = z;
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
                opacity: 1,
                depthWrite: false,
                sizeAttenuation: true,
            }),
        );

        starClouds.push(points);
        starGeometries.push(starGeometry);
        starBaseColors.push(starColors.slice());
        scene.add(points);
    });

    const updateTwinkle = (elapsed: number) => {
        starGeometries.forEach((geometry, groupIndex) => {
            const colors = geometry.attributes.color.array as Float32Array;
            const baseColors = starBaseColors[groupIndex];
            for (let i = 0; i < colors.length; i += 3) {
                const phase = i * 0.1 + elapsed * (2.0 + (i % 3));
                const twinkle = 0.2 + 0.8 * (0.5 + 0.5 * Math.sin(phase));
                colors[i] = baseColors[i] * twinkle;
                colors[i + 1] = baseColors[i + 1] * twinkle;
                colors[i + 2] = baseColors[i + 2] * twinkle;
            }
            geometry.attributes.color.needsUpdate = true;
        });
    };

    return { starClouds, starTexture, updateTwinkle };
}

export interface ShootingStarCatchResult {
    caught: boolean;
    worldPosition?: THREE.Vector3;
}

export interface ShootingStarSystem {
    shootingStar: THREE.Mesh;
    updateShootingStar: (delta: number) => void;
    checkCatch: (
        screenX: number,
        screenY: number,
        camera: THREE.Camera,
        clientWidth: number,
        clientHeight: number,
        isClick?: boolean,
    ) => ShootingStarCatchResult;
    dispose: () => void;
}

export function createShootingStar(
    scene: THREE.Scene,
    starTexture: THREE.CanvasTexture,
): ShootingStarSystem {
    const shootingStar = new THREE.Mesh(
        new THREE.SphereGeometry(SHOOTING_STAR_RADIUS, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 }),
    );
    shootingStar.scale.z = SHOOTING_STAR_STRETCH_Z;
    scene.add(shootingStar);

    // Stardust burst particle system
    const burstGeometry = new THREE.BufferGeometry();
    const burstPositions = new Float32Array(BURST_PARTICLE_COUNT * 3);
    const burstColors = new Float32Array(BURST_PARTICLE_COUNT * 3);
    const burstVelocities: THREE.Vector3[] = Array.from(
        { length: BURST_PARTICLE_COUNT },
        () => new THREE.Vector3(),
    );

    for (let i = 0; i < BURST_PARTICLE_COUNT; i += 1) {
        burstPositions[i * 3] = 0;
        burstPositions[i * 3 + 1] = 0;
        burstPositions[i * 3 + 2] = 0;

        // Radiant warm starlight sparkles (gold/white/cyan)
        burstColors[i * 3] = 1.0;
        burstColors[i * 3 + 1] = 0.88 + Math.random() * 0.12;
        burstColors[i * 3 + 2] = 0.65 + Math.random() * 0.35;
    }

    burstGeometry.setAttribute("position", new THREE.BufferAttribute(burstPositions, 3));
    burstGeometry.setAttribute("color", new THREE.BufferAttribute(burstColors, 3));

    const burstMaterial = new THREE.PointsMaterial({
        size: 0.35,
        map: starTexture,
        vertexColors: true,
        transparent: true,
        opacity: 0,
        depthWrite: false,
    });

    const burstPoints = new THREE.Points(burstGeometry, burstMaterial);
    scene.add(burstPoints);

    let burstProgress = 1;

    const triggerBurst = (position: THREE.Vector3) => {
        burstProgress = 0;
        burstPoints.position.copy(position);
        for (let i = 0; i < BURST_PARTICLE_COUNT; i += 1) {
            const phi = Math.random() * Math.PI * 2;
            const theta = Math.random() * Math.PI;
            const speed = 1.8 + Math.random() * 3.2;
            burstVelocities[i].set(
                Math.sin(theta) * Math.cos(phi) * speed,
                Math.sin(theta) * Math.sin(phi) * speed,
                Math.cos(theta) * speed,
            );
            burstPositions[i * 3] = 0;
            burstPositions[i * 3 + 1] = 0;
            burstPositions[i * 3 + 2] = 0;
        }
        burstGeometry.attributes.position.needsUpdate = true;
        burstMaterial.opacity = 1;
    };

    let shootingStarProgress = 1;
    const shootingStarStart = new THREE.Vector3();
    const shootingStarEnd = new THREE.Vector3();
    const tempScreenPos = new THREE.Vector3();

    const updateShootingStar = (delta: number) => {
        // 1. Spawning lifecycle
        if (shootingStarProgress >= 1 && Math.random() < SHOOTING_STAR_TRIGGER_CHANCE) {
            shootingStarProgress = 0;
            shootingStarStart.set(
                (Math.random() - 0.5) * 40,
                (Math.random() - 0.5) * 20,
                -15 - Math.random() * 10,
            );
            shootingStarEnd
                .copy(shootingStarStart)
                .add(new THREE.Vector3(20 + Math.random() * 10, -10 - Math.random() * 10, 0));
            shootingStar.position.copy(shootingStarStart);
            shootingStar.lookAt(shootingStarEnd);
        }

        // 2. Trajectory animation
        if (shootingStarProgress < 1) {
            shootingStarProgress += delta * SHOOTING_STAR_SPEED;
            shootingStar.position.lerpVectors(
                shootingStarStart,
                shootingStarEnd,
                shootingStarProgress,
            );
            (shootingStar.material as THREE.MeshBasicMaterial).opacity = Math.sin(
                shootingStarProgress * Math.PI,
            );
        }

        // 3. Stardust explosion simulation
        if (burstProgress < 1) {
            burstProgress += delta / BURST_DURATION_SECONDS;
            burstMaterial.opacity = Math.max(0, 1 - burstProgress);

            for (let i = 0; i < BURST_PARTICLE_COUNT; i += 1) {
                burstPositions[i * 3] += burstVelocities[i].x * delta;
                burstPositions[i * 3 + 1] += burstVelocities[i].y * delta;
                burstPositions[i * 3 + 2] += burstVelocities[i].z * delta;
            }
            burstGeometry.attributes.position.needsUpdate = true;
        }
    };

    const checkCatch = (
        screenX: number,
        screenY: number,
        camera: THREE.Camera,
        clientWidth: number,
        clientHeight: number,
        isClick = false,
    ): ShootingStarCatchResult => {
        // Can only catch while active and visibly glowing
        if (shootingStarProgress <= 0.05 || shootingStarProgress >= 0.95) {
            return { caught: false };
        }

        tempScreenPos.copy(shootingStar.position).project(camera);
        if (tempScreenPos.z > 1) {
            return { caught: false };
        }

        const starPixelX = (tempScreenPos.x * 0.5 + 0.5) * clientWidth;
        const starPixelY = (-tempScreenPos.y * 0.5 + 0.5) * clientHeight;

        const deltaX = screenX - starPixelX;
        const deltaY = screenY - starPixelY;
        const distanceSq = deltaX * deltaX + deltaY * deltaY;

        const maxThreshold = isClick ? CATCH_RADIUS_CLICK_PX : CATCH_RADIUS_HOVER_PX;
        if (distanceSq <= maxThreshold * maxThreshold) {
            const worldPosition = shootingStar.position.clone();
            triggerBurst(worldPosition);

            // Despawn shooting star immediately
            shootingStarProgress = 1;
            (shootingStar.material as THREE.MeshBasicMaterial).opacity = 0;

            return { caught: true, worldPosition };
        }

        return { caught: false };
    };

    const dispose = () => {
        scene.remove(shootingStar);
        shootingStar.geometry.dispose();
        (shootingStar.material as THREE.Material).dispose();

        scene.remove(burstPoints);
        burstGeometry.dispose();
        burstMaterial.dispose();
    };

    return { shootingStar, updateShootingStar, checkCatch, dispose };
}
