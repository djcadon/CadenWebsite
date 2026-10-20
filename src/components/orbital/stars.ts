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
const SUN_CAMERA_DELTA_Y = 32;       // Difference in Y between camera (22) and sun (-10)
const SUN_CAMERA_DELTA_Z = 18;       // Difference in Z between camera (18) and sun (0)
const SUN_CAMERA_DISTANCE_SQ = 1348; // 32^2 + 18^2 (squared length of the vector)
const SUN_CAMERA_DISTANCE = 36.715;  // Math.sqrt(1348) (Euclidean length of the vector)
const STAR_EXCLUSION_RADIUS = 5;     // Radius of the hollow cylinder cleared around the sightline

// =============================================================================
// SHOOTING STAR TUNING
// Controls the frequency, velocity, and visual elongation of occasional shooting stars.
// =============================================================================
const SHOOTING_STAR_TRIGGER_CHANCE = 0.003; // Probability per frame of spawning a shooting star
const SHOOTING_STAR_SPEED = 1.2;            // Linear traversal speed along its randomized trajectory
const SHOOTING_STAR_STRETCH_Z = 25;         // Z-axis mesh elongation factor to create the streak effect
const SHOOTING_STAR_RADIUS = 0.08;          // Base sphere radius before stretching

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

                const t = (SUN_CAMERA_DELTA_Y * (y + 10) + SUN_CAMERA_DELTA_Z * z) / SUN_CAMERA_DISTANCE_SQ;
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

export interface ShootingStarSystem {
    shootingStar: THREE.Mesh;
    updateShootingStar: (delta: number) => void;
}

export function createShootingStar(scene: THREE.Scene): ShootingStarSystem {
    const shootingStar = new THREE.Mesh(
        new THREE.SphereGeometry(SHOOTING_STAR_RADIUS, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 }),
    );
    shootingStar.scale.z = SHOOTING_STAR_STRETCH_Z;
    scene.add(shootingStar);

    let shootingStarProgress = 1;
    const shootingStarStart = new THREE.Vector3();
    const shootingStarEnd = new THREE.Vector3();

    const updateShootingStar = (delta: number) => {
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
        if (shootingStarProgress < 1) {
            shootingStarProgress += delta * SHOOTING_STAR_SPEED;
            shootingStar.position.lerpVectors(shootingStarStart, shootingStarEnd, shootingStarProgress);
            (shootingStar.material as THREE.MeshBasicMaterial).opacity = Math.sin(
                shootingStarProgress * Math.PI,
            );
        }
    };

    return { shootingStar, updateShootingStar };
}
