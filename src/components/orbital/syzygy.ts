import * as THREE from "three";
import { destinations } from "../../constants/destinations";
import type { Planet } from "./planets";

// =============================================================================
// SYZYGY ALIGNMENT CONSTANTS
// Thresholds for detecting collinear planetary alignments across the solar system.
// =============================================================================
const SYZYGY_START_THRESHOLD = 0.975; // Collinear dot product threshold (~12.8 degrees)
const SYZYGY_PEAK_THRESHOLD = 0.995; // Collinear dot product threshold (~5.7 degrees)
const BEAM_SPAN_RADIUS = 14.0; // Distance the harmonic beam extends past the outermost orbit
const BEAM_CORE_RADIUS = 0.05; // Radius of the inner glowing laser filament
const BEAM_GLOW_RADIUS = 0.22; // Radius of the outer translucent plasma sheath
const BEAM_COLOR = 0xf1bd78; // Signature amber accent color
const PULSE_RING_SEGMENTS = 64; // Geometry resolution for the expanding harmonic wave ring

export interface SyzygyState {
    isSyzygy: boolean;
    isFullyAligned: boolean;
    alignmentScore: number;
    intensity: number;
    angle: number;
}

export interface SyzygySystem {
    updateSyzygy: (
        planets: Planet[],
        delta: number,
        elapsed: number,
        isBlackHoleActive: boolean,
    ) => SyzygyState;
    dispose: () => void;
}

export function createSyzygy(system: THREE.Group, isMobile: boolean): SyzygySystem {
    const syzygyGroup = new THREE.Group();
    syzygyGroup.visible = false;
    system.add(syzygyGroup);

    // 1. Core Harmonic Laser Beam (passes through Sun from -BEAM_SPAN_RADIUS to +BEAM_SPAN_RADIUS)
    const beamLength = BEAM_SPAN_RADIUS * 2;
    // Default Three.js cylinder is oriented along the Y axis (-beamLength/2 to +beamLength/2)
    const coreGeometry = new THREE.CylinderGeometry(
        BEAM_CORE_RADIUS,
        BEAM_CORE_RADIUS,
        beamLength,
        isMobile ? 8 : 16,
    );

    const coreMaterial = new THREE.MeshBasicMaterial({
        color: BEAM_COLOR,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });
    const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
    syzygyGroup.add(coreMesh);

    // 2. Translucent Plasma Sheath (outer glowing aura around the laser)
    const glowGeometry = new THREE.CylinderGeometry(
        BEAM_GLOW_RADIUS,
        BEAM_GLOW_RADIUS,
        beamLength,
        isMobile ? 8 : 16,
    );

    const glowMaterial = new THREE.MeshBasicMaterial({
        color: BEAM_COLOR,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    });
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    syzygyGroup.add(glowMesh);

    // 3. Gravitational Harmonic Ripple Ring
    const ringGeometry = new THREE.RingGeometry(1.6, 1.72, PULSE_RING_SEGMENTS);
    ringGeometry.rotateX(-Math.PI / 2);
    const ringMaterial = new THREE.MeshBasicMaterial({
        color: BEAM_COLOR,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
    });
    const rippleRing = new THREE.Mesh(ringGeometry, ringMaterial);
    syzygyGroup.add(rippleRing);

    let currentIntensity = 0;
    let hasLoggedSyzygy = false;

    // Cache destination colors for planet emissive pulsing
    const destinationColors = destinations.map((d) => new THREE.Color(d.color));

    // Reusable math vectors to avoid garbage collection allocations per frame
    const tempWorldPos = new THREE.Vector3();
    const planetDirs: THREE.Vector3[] = destinations.map(() => new THREE.Vector3());
    const alignmentAxis = new THREE.Vector3();
    const cylinderDefaultAxis = new THREE.Vector3(0, 1, 0);

    const updateSyzygy = (
        planets: Planet[],
        delta: number,
        elapsed: number,
        isBlackHoleActive: boolean,
    ): SyzygyState => {
        // Suppress syzygy during black hole singularity mode or if planets are missing
        if (isBlackHoleActive || planets.length < 2) {
            currentIntensity = 0;
            syzygyGroup.visible = false;
            coreMaterial.opacity = 0;
            glowMaterial.opacity = 0;
            rippleRing.scale.setScalar(1);
            ringMaterial.opacity = 0;
            planets.forEach(({ mesh }) => {
                const material = mesh.material as THREE.MeshStandardMaterial;
                if (material.emissiveIntensity > 0) {
                    material.emissiveIntensity = 0;
                }
            });
            return {
                isSyzygy: false,
                isFullyAligned: false,
                alignmentScore: 0,
                intensity: 0,
                angle: 0,
            };
        }

        // 1. Compute exact 3D direction vectors from the Sun to each planet in system space
        for (let i = 0; i < planets.length; i++) {
            planets[i].mesh.getWorldPosition(tempWorldPos);
            system.worldToLocal(tempWorldPos);
            planetDirs[i].copy(tempWorldPos).normalize();
        }

        // 2. Outermost planet (Contact) defines the primary reference axis
        const outermostIndex = planets.length - 1;
        alignmentAxis.copy(planetDirs[outermostIndex]);

        // 3. Compute collinearity score |u · v| for every other planet
        let minCollinearity = 1.0;
        for (let i = 0; i < outermostIndex; i++) {
            const dot = Math.abs(alignmentAxis.dot(planetDirs[i]));
            if (dot < minCollinearity) {
                minCollinearity = dot;
            }
        }

        // 4. Smoothly calculate alignment intensity based on actual collinearity
        let targetIntensity = 0;
        if (minCollinearity >= SYZYGY_START_THRESHOLD) {
            targetIntensity = THREE.MathUtils.clamp(
                (minCollinearity - SYZYGY_START_THRESHOLD) /
                    (SYZYGY_PEAK_THRESHOLD - SYZYGY_START_THRESHOLD),
                0,
                1,
            );
        }

        const lerpRate = targetIntensity > currentIntensity ? delta * 6.0 : delta * 4.0;
        currentIntensity = THREE.MathUtils.lerp(currentIntensity, targetIntensity, lerpRate);

        const isSyzygyActive = currentIntensity > 0.1;
        const currentAngle = Math.atan2(alignmentAxis.z, alignmentAxis.x);

        if (currentIntensity > 0.005) {
            syzygyGroup.visible = true;

            // Orient the beam cylinder directly along the actual alignment axis of the planets
            syzygyGroup.quaternion.setFromUnitVectors(cylinderDefaultAxis, alignmentAxis);

            // Animate laser beam opacity with subtle high-energy fluctuation
            const pulse = 0.85 + 0.15 * Math.sin(elapsed * 12.0);
            coreMaterial.opacity = currentIntensity * 0.9 * pulse;
            glowMaterial.opacity = currentIntensity * 0.35 * pulse;

            // Animate gravitational ripple ring expanding outward from the sun
            const rippleProgress = (elapsed * 1.8) % 1.0;
            const ringScale = 1.0 + rippleProgress * 6.5;
            rippleRing.scale.setScalar(ringScale);
            ringMaterial.opacity = currentIntensity * 0.45 * (1.0 - rippleProgress);

            // Planetary bioluminescent resonance glow
            planets.forEach(({ mesh }, index) => {
                const material = mesh.material as THREE.MeshStandardMaterial;
                material.emissive = destinationColors[index];
                material.emissiveIntensity = currentIntensity * 0.85 * pulse;
            });

            // Log telemetry milestone on first entry into full syzygy lock
            if (currentIntensity >= 0.75 && !hasLoggedSyzygy) {
                hasLoggedSyzygy = true;
                console.log(
                    "%c[TELEMETRY] Orbital Syzygy Detected: Gravitational harmonic resonance locked across all planetary vectors.",
                    "color: #f1bd78; font-family: monospace; font-size: 12px; font-weight: bold;",
                );
            }
        } else {
            syzygyGroup.visible = false;
            hasLoggedSyzygy = false;
            planets.forEach(({ mesh }) => {
                const material = mesh.material as THREE.MeshStandardMaterial;
                if (material.emissiveIntensity > 0) {
                    material.emissiveIntensity = 0;
                }
            });
        }

        const isFullyAligned = minCollinearity >= 0.99 || currentIntensity >= 0.85;

        return {
            isSyzygy: isSyzygyActive,
            isFullyAligned,
            alignmentScore: minCollinearity,
            intensity: currentIntensity,
            angle: currentAngle,
        };
    };

    const dispose = () => {
        coreGeometry.dispose();
        coreMaterial.dispose();
        glowGeometry.dispose();
        glowMaterial.dispose();
        ringGeometry.dispose();
        ringMaterial.dispose();
        system.remove(syzygyGroup);
    };

    return {
        updateSyzygy,
        dispose,
    };
}
