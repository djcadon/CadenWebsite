import * as THREE from "three";

// =============================================================================
// SUN CORE GEOMETRY & ROTATION
// Controls the physical scale and axial rotation rate of the central star.
// =============================================================================
const SUN_RADIUS = 1.5;            // Physical radius of the central sun mesh
const SUN_ROTATION_SPEED = 0.1;    // Radians per second of axial rotation on the Y-axis

// =============================================================================
// ATMOSPHERIC HALO & PULSE DYNAMICS
// Configures the glowing spherical shell surrounding the sun and its gentle
// sine-wave pulsing animation.
// =============================================================================
const SUN_HALO_RADIUS = 1.75;                 // Base radius of the glowing atmospheric halo
const SUN_HALO_COLOR = 0xf1bd78;              // Warm amber glow color
const SUN_HALO_BASE_OPACITY = 0.08;           // Baseline transparency of the halo mesh
const SUN_HALO_PULSE_SPEED = 1.5;             // Sine-wave frequency for the breathing effect
const SUN_HALO_PULSE_SCALE_AMPLITUDE = 0.04;  // Peak geometric expansion (+/- 4% scale change)
const SUN_HALO_PULSE_OPACITY_AMPLITUDE = 0.03;// Peak opacity fluctuation (+/- 3% transparency)

export interface SunSystem {
    sun: THREE.Mesh;
    sunHalo: THREE.Mesh;
    updateSun: (elapsed: number) => void;
}

export function createSun(system: THREE.Group, isMobile: boolean): SunSystem {
    // Procedural gradient sun shader
    const sunUniforms = {
        time: { value: 0 },
    };

    const sunMaterial = new THREE.ShaderMaterial({
        uniforms: sunUniforms,
        vertexShader: `
            varying vec2 vUv;
            varying vec3 vPosition;
            void main() {
                vUv = uv;
                vPosition = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float time;
            varying vec2 vUv;
            varying vec3 vPosition;
            void main() {
                float noise = sin(vPosition.x * 2.0 + time * 0.5) * 
                              cos(vPosition.y * 2.0 + time * 0.4) * 
                              sin(vPosition.z * 2.0 - time * 0.3);
                
                float intensity = (noise + 1.0) * 0.5;
                vec3 baseColor = vec3(0.91, 0.66, 0.37);
                vec3 warmColor = vec3(0.8, 0.48, 0.13);
                vec3 color = mix(warmColor, baseColor, intensity);
                
                gl_FragColor = vec4(color, 1.0);
            }
        `,
    });

    const sun = new THREE.Mesh(
        new THREE.SphereGeometry(SUN_RADIUS, isMobile ? 32 : 48, isMobile ? 32 : 48),
        sunMaterial,
    );
    system.add(sun);

    const sunHalo = new THREE.Mesh(
        new THREE.SphereGeometry(SUN_HALO_RADIUS, isMobile ? 24 : 32, isMobile ? 24 : 32),
        new THREE.MeshBasicMaterial({
            color: SUN_HALO_COLOR,
            transparent: true,
            opacity: SUN_HALO_BASE_OPACITY,
            side: THREE.BackSide,
        }),
    );
    system.add(sunHalo);

    const updateSun = (elapsed: number) => {
        // Slowly rotate sun on Y axis and update shader time uniform
        sun.rotation.y = elapsed * SUN_ROTATION_SPEED;
        sunUniforms.time.value = elapsed;

        // Pulsing Sun Halo
        const pulse = Math.sin(elapsed * SUN_HALO_PULSE_SPEED);
        sunHalo.scale.setScalar(1 + pulse * SUN_HALO_PULSE_SCALE_AMPLITUDE);
        (sunHalo.material as THREE.MeshBasicMaterial).opacity =
            SUN_HALO_BASE_OPACITY + pulse * SUN_HALO_PULSE_OPACITY_AMPLITUDE;
    };

    return { sun, sunHalo, updateSun };
}
