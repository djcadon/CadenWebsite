import * as THREE from "three";
import { destinations, type DestinationId } from "../../constants/destinations";

// =============================================================================
// STORAGE IDENTIFIERS
// Session storage key used to persist orbital angles across page navigations.
// =============================================================================
export const PLANET_POSITION_STORAGE_KEY = "caden-orbital-planet-positions";

// =============================================================================
// ORBITAL PATH GEOMETRY & INCLINATION
// Defines the resolution and subtle off-axis tilt for each orbital ring.
// =============================================================================
const ORBIT_POINT_COUNT = 128;          // Line resolution for desktop orbit rings
const MOBILE_ORBIT_POINT_COUNT = 96;    // Lower line segment count for mobile performance
const ORBIT_INCLINATION_X_STEP = 0.08;  // Per-orbit stagger along the X axis
const ORBIT_INCLINATION_Z_STEP = 0.04;  // Per-orbit stagger along the Z axis
const ORBIT_LINE_COLOR = 0x555a61;      // Muted slate gray for orbital tracks
const ORBIT_LINE_OPACITY = 0.4;         // Subtle line transparency

// =============================================================================
// PLANET MATERIAL & INTERACTION
// PBR physics values and interactive raycast boundary multipliers.
// =============================================================================
const PLANET_ROUGHNESS = 0.72;             // Surface roughness for realistic light diffusion
const PLANET_METALNESS = 0.05;             // Subtle metallic specular sheen
const HITBOX_RADIUS_MULTIPLIER = 2;        // Multiplier expanding click/touch target size
const DEFAULT_PLANET_ANGLE_SPACING = 1.55; // Radians between planets if no saved angles exist

// =============================================================================
// AXIAL ROTATION & GYROSCOPIC WOBBLE
// Configures each planet's unique spin and slight off-axis wobble to showcase
// the procedural noise textures dynamically.
// =============================================================================
const BASE_AXIAL_SPEED = 0.15;   // Base Y-axis rotational velocity
const AXIAL_SPEED_STEP = 0.2;    // Incremental rotation speed added per planet index
const TILT_WOBBLE_X_BASE = 0.02; // Subtle off-axis pitch oscillation base
const TILT_WOBBLE_X_STEP = 0.03; // Pitch oscillation increment per index
const TILT_WOBBLE_Z_BASE = 0.01; // Subtle off-axis roll oscillation base
const TILT_WOBBLE_Z_STEP = 0.01; // Roll oscillation increment per index

export type Planet = {
    mesh: THREE.Mesh;
    hitbox: THREE.Mesh;
    angle: number;
    distance: number;
    speed: number;
};

export function readSavedPlanetAngles(): Partial<Record<DestinationId, number>> {
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

export function savePlanetAngles(planets: Planet[], elapsed: number): void {
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
}

export interface PlanetSystem {
    planets: Planet[];
    planetHitboxes: THREE.Mesh[];
}

export function createPlanetSystem(
    system: THREE.Group,
    isMobile: boolean,
    savedPlanetAngles: Partial<Record<DestinationId, number>>,
): PlanetSystem {
    const planets: Planet[] = destinations.map((destination, index) => {
        const orbitFrame = new THREE.Group();
        orbitFrame.rotation.x = (index - 1.5) * ORBIT_INCLINATION_X_STEP;
        orbitFrame.rotation.z = (index - 1.5) * ORBIT_INCLINATION_Z_STEP;
        system.add(orbitFrame);

        // Build a circular orbit line loop
        const pointCount = isMobile ? MOBILE_ORBIT_POINT_COUNT : ORBIT_POINT_COUNT;
        const orbit = new THREE.LineLoop(
            new THREE.BufferGeometry().setFromPoints(
                Array.from({ length: pointCount }, (_, point) => {
                    const angle = (point / pointCount) * Math.PI * 2;
                    return new THREE.Vector3(
                        Math.cos(angle) * destination.distance,
                        0,
                        Math.sin(angle) * destination.distance,
                    );
                }),
            ),
            new THREE.LineBasicMaterial({
                color: ORBIT_LINE_COLOR,
                transparent: true,
                opacity: ORBIT_LINE_OPACITY,
            }),
        );
        orbitFrame.add(orbit);

        const planetFrame = new THREE.Group();
        planetFrame.rotation.copy(orbitFrame.rotation);
        system.add(planetFrame);

        const material = new THREE.MeshStandardMaterial({
            color: destination.color,
            roughness: PLANET_ROUGHNESS,
            metalness: PLANET_METALNESS,
        });

        // Injected 3D procedural noise via .onBeforeCompile to retain PBR lighting physics
        material.onBeforeCompile = (shader) => {
            shader.uniforms.seed = { value: index * 13.37 };

            shader.vertexShader =
                `
                varying vec3 vObjPos;
            ` + shader.vertexShader;

            shader.vertexShader = shader.vertexShader.replace(
                "#include <begin_vertex>",
                `
                #include <begin_vertex>
                vObjPos = position;
                `,
            );

            shader.fragmentShader =
                `
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
                "vec4 diffuseColor = vec4( diffuse, opacity );",
                `
                // Combine layers of noise for a marbled look
                float n1 = noise(vObjPos * 3.0 + seed);
                float n2 = noise(vObjPos * 6.0 - seed);
                float finalNoise = (n1 * 0.7) + (n2 * 0.3);
                
                // Darken or lighten base color slightly based on noise
                vec3 patternColor = mix(diffuse * 0.5, diffuse * 1.5, finalNoise);
                vec4 diffuseColor = vec4( patternColor, opacity );
                `,
            );
        };

        const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(destination.size, isMobile ? 32 : 48, isMobile ? 32 : 48),
            material,
        );
        mesh.userData = { id: destination.id };
        planetFrame.add(mesh);

        const hitbox = new THREE.Mesh(
            new THREE.SphereGeometry(destination.size * HITBOX_RADIUS_MULTIPLIER, 12, 12),
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
            angle: savedPlanetAngles[destination.id] ?? index * DEFAULT_PLANET_ANGLE_SPACING,
            distance: destination.distance,
            speed: destination.speed,
        };
    });

    const planetHitboxes = planets.map(({ hitbox }) => hitbox);

    return { planets, planetHitboxes };
}

export function updatePlanets(planets: Planet[], elapsed: number): void {
    planets.forEach(({ mesh, hitbox, angle, distance, speed }, index) => {
        mesh.position.set(
            Math.cos(angle + elapsed * speed) * distance,
            0,
            Math.sin(angle + elapsed * speed) * distance,
        );
        hitbox.position.copy(mesh.position);

        // Axial Rotation
        mesh.rotation.y = elapsed * (BASE_AXIAL_SPEED + index * AXIAL_SPEED_STEP);
        // Off-axis tilt wobble so patterns look dynamic
        mesh.rotation.x = elapsed * (TILT_WOBBLE_X_BASE + index * TILT_WOBBLE_X_STEP);
        mesh.rotation.z = elapsed * (TILT_WOBBLE_Z_BASE + index * TILT_WOBBLE_Z_STEP);
    });
}
