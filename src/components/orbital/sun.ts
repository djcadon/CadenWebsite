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

// =============================================================================
// BLACK HOLE & ACCRETION DISK CONFIGURATION
// Dimensions, rotational velocity, and photon ring tuning for event horizon mode.
// =============================================================================
const ACCRETION_INNER_RADIUS = 1.7;           // Inner radius of the swirling relativistic matter ring
const ACCRETION_OUTER_RADIUS = 4.2;           // Outer boundary of the glowing accretion disk
const ACCRETION_ROTATION_SPEED = 0.35;        // Angular velocity of the accretion disk plasma filaments

export interface SunSystem {
    sun: THREE.Mesh;
    sunHitbox: THREE.Mesh;
    sunHalo: THREE.Mesh;
    accretionDisk: THREE.Mesh;
    updateSun: (elapsed: number, blackHoleProgress?: number) => void;
    dispose: () => void;
}

export function createSun(system: THREE.Group, isMobile: boolean): SunSystem {
    // Procedural gradient sun shader with black hole event horizon transition
    const sunUniforms = {
        time: { value: 0 },
        blackHoleProgress: { value: 0 },
    };

    const sunMaterial = new THREE.ShaderMaterial({
        uniforms: sunUniforms,
        vertexShader: `
            varying vec2 vUv;
            varying vec3 vPosition;
            varying vec3 vNormal;
            varying vec3 vViewPosition;

            void main() {
                vUv = uv;
                vPosition = position;
                vNormal = normalize(normalMatrix * normal);
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                vViewPosition = -mvPosition.xyz;
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            uniform float time;
            uniform float blackHoleProgress;
            varying vec2 vUv;
            varying vec3 vPosition;
            varying vec3 vNormal;
            varying vec3 vViewPosition;

            void main() {
                float noise = sin(vPosition.x * 2.0 + time * 0.5) * 
                              cos(vPosition.y * 2.0 + time * 0.4) * 
                              sin(vPosition.z * 2.0 - time * 0.3);
                
                float intensity = (noise + 1.0) * 0.5;
                vec3 baseColor = vec3(0.91, 0.66, 0.37);
                vec3 warmColor = vec3(0.8, 0.48, 0.13);
                vec3 sunColor = mix(warmColor, baseColor, intensity);
                
                // Pure void event horizon
                vec3 blackHoleColor = vec3(0.005, 0.005, 0.005);
                vec3 baseFinal = mix(sunColor, blackHoleColor, blackHoleProgress);
                
                // Gravitational lensing photon ring (glowing edge at the Schwarzschild boundary)
                vec3 viewDir = normalize(vViewPosition);
                vec3 normal = normalize(vNormal);
                float rim = clamp(1.0 - max(0.0, dot(viewDir, normal)), 0.0, 1.0);
                float photonRing = pow(rim, 6.0) * 3.5;
                vec3 photonColor = vec3(1.0, 0.9, 0.72) * photonRing;
                
                vec3 finalColor = baseFinal + photonColor * blackHoleProgress;
                gl_FragColor = vec4(finalColor, 1.0);
            }
        `,
    });

    const sun = new THREE.Mesh(
        new THREE.SphereGeometry(SUN_RADIUS, isMobile ? 32 : 48, isMobile ? 32 : 48),
        sunMaterial,
    );
    system.add(sun);

    // Invisible expanded touch hitbox for reliable mobile and mouse interaction
    const sunHitbox = new THREE.Mesh(
        new THREE.SphereGeometry(isMobile ? 2.8 : 2.4, 12, 12),
        new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0,
            depthWrite: false,
        }),
    );
    system.add(sunHitbox);

    const sunHaloMaterial = new THREE.MeshBasicMaterial({
        color: SUN_HALO_COLOR,
        transparent: true,
        opacity: SUN_HALO_BASE_OPACITY,
        side: THREE.BackSide,
    });

    const sunHalo = new THREE.Mesh(
        new THREE.SphereGeometry(SUN_HALO_RADIUS, isMobile ? 24 : 32, isMobile ? 24 : 32),
        sunHaloMaterial,
    );
    system.add(sunHalo);

    // Accretion Disk around the event horizon
    const accretionUniforms = {
        time: { value: 0 },
        opacity: { value: 0 },
    };

    const accretionMaterial = new THREE.ShaderMaterial({
        uniforms: accretionUniforms,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        vertexShader: `
            varying vec2 vLocalPos;
            void main() {
                vLocalPos = position.xy;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float time;
            uniform float opacity;
            varying vec2 vLocalPos;

            // Simple 2D procedural noise for plasma filaments
            float hash(vec2 p) {
                return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
            }

            float noise(vec2 p) {
                vec2 i = floor(p);
                vec2 f = fract(p);
                vec2 u = f * f * (3.0 - 2.0 * f);
                return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
                           mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
            }

            void main() {
                float r = length(vLocalPos);
                if (r < 1.65 || r > 4.25) {
                    discard;
                }

                // Radial boundary fades (inner event horizon boundary & outer interstellar void)
                float innerFade = smoothstep(1.7, 2.05, r);
                float outerFade = 1.0 - smoothstep(3.2, 4.2, r);
                float radialMask = innerFade * outerFade;

                // Twist coordinates continuously based on radius and time (smooth Archimedean spiral)
                // Using Cartesian rotation eliminates the atan branch-cut discontinuity (no seam/slit!)
                float rot = r * 2.8 - time * 2.2;
                float c = cos(rot);
                float s = sin(rot);
                vec2 swirled = vec2(
                    vLocalPos.x * c - vLocalPos.y * s,
                    vLocalPos.x * s + vLocalPos.y * c
                );

                // Seamless multi-octave 2D procedural plasma filaments
                float filament = noise(swirled * 1.5);
                float detail = noise(swirled * 3.4);
                float plasma = filament * 0.7 + detail * 0.3;

                // Relativistic Doppler beaming (smooth Cartesian projection)
                vec2 dir = normalize(vLocalPos);
                float doppler = (dir.x * 0.92 + dir.y * 0.39) * 0.35 + 0.65;

                // Amber/orange thermal emission spectrum matching site theme
                vec3 coreColor = vec3(1.0, 0.95, 0.85);  // Hot white-amber inner rim
                vec3 midColor = vec3(0.95, 0.74, 0.47);   // Site accent amber
                vec3 edgeColor = vec3(0.55, 0.22, 0.05);  // Cool edge red-orange

                float t = smoothstep(1.8, 3.8, r);
                vec3 color = mix(mix(coreColor, midColor, t), edgeColor, t * t);
                color *= (plasma * 0.8 + 0.6) * doppler * 1.5;

                float alpha = radialMask * opacity * (plasma * 0.6 + 0.4);
                gl_FragColor = vec4(color, alpha);
            }
        `,
    });

    const accretionGeometry = new THREE.RingGeometry(
        ACCRETION_INNER_RADIUS,
        ACCRETION_OUTER_RADIUS,
        isMobile ? 64 : 96,
        4,
    );

    const accretionDisk = new THREE.Mesh(accretionGeometry, accretionMaterial);
    // Align with the orbital plane
    accretionDisk.rotation.x = Math.PI / 2;
    accretionDisk.visible = false;
    system.add(accretionDisk);

    const updateSun = (elapsed: number, blackHoleProgress = 0) => {
        // Slowly rotate sun on Y axis and update shader uniforms
        sun.rotation.y = elapsed * SUN_ROTATION_SPEED;
        sunUniforms.time.value = elapsed;
        sunUniforms.blackHoleProgress.value = blackHoleProgress;

        // Pulsing Sun Halo (attenuated when falling into singularity)
        const pulse = Math.sin(elapsed * SUN_HALO_PULSE_SPEED);
        const haloScaleBase = 1 + pulse * SUN_HALO_PULSE_SCALE_AMPLITUDE;
        sunHalo.scale.setScalar(haloScaleBase * (1 - blackHoleProgress * 0.3));
        sunHaloMaterial.opacity =
            (SUN_HALO_BASE_OPACITY + pulse * SUN_HALO_PULSE_OPACITY_AMPLITUDE) *
            (1 - blackHoleProgress);

        // Accretion disk animation
        if (blackHoleProgress > 0.001) {
            accretionDisk.visible = true;
            accretionDisk.rotation.z = elapsed * ACCRETION_ROTATION_SPEED;
            accretionUniforms.time.value = elapsed;
            accretionUniforms.opacity.value = blackHoleProgress;
        } else {
            accretionDisk.visible = false;
        }
    };

    const dispose = () => {
        system.remove(sun);
        sun.geometry.dispose();
        sunMaterial.dispose();

        system.remove(sunHitbox);
        sunHitbox.geometry.dispose();
        (sunHitbox.material as THREE.Material).dispose();

        system.remove(sunHalo);
        sunHalo.geometry.dispose();
        sunHaloMaterial.dispose();

        system.remove(accretionDisk);
        accretionGeometry.dispose();
        accretionMaterial.dispose();
    };

    return { sun, sunHitbox, sunHalo, accretionDisk, updateSun, dispose };
}
