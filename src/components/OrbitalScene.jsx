import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { destinations } from "../constants/destinations";

function OrbitalScene({ onSelect }) {
  // The Three.js canvas is mounted into this container after the component renders.
  const mountRef = useRef(null);
  // These refs let the animation loop position HTML labels over their planets.
  const labelRefs = useRef({});
  const descriptionRefs = useRef({});
  const [isZooming, setIsZooming] = useState(false);
  // Keep the latest callback available to the one-time Three.js effect.
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    const mount = mountRef.current;
    // Create the scene and camera used by the orbital visualization.
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 22, 18);
    camera.lookAt(0, 0, 0);

    // Render with transparency so the surrounding page background remains visible.
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    // Ambient light fills the scene while the point light gives the sun and
    // planets their highlights.
    scene.add(new THREE.AmbientLight(0x9da6b5, 0.42));
    const sunLight = new THREE.PointLight(0xffd39b, 32, 35, 2);
    scene.add(sunLight);

    // The system group lets the whole solar system share a slight tilt.
    const system = new THREE.Group();
    system.rotation.x = 0.15;
    scene.add(system);

    // Several point-cloud layers create stars with varied brightness and size.
    const starGroups = [
      { count: 900, size: 0.044 },
      { count: 280, size: 0.084 },
      { count: 45, size: 0.15 },
    ];
    starGroups.forEach(({ count, size }) => {
      const starGeometry = new THREE.BufferGeometry();
      const starPositions = new Float32Array(count * 3);
      const starColors = new Float32Array(count * 3);
      for (let i = 0; i < count; i += 1) {
        const position = i * 3;
        const brightness = 0.16 + Math.random() * 0.48;
        // Spread stars through a shallow box around the orbital plane.
        starPositions[position] = (Math.random() - 0.5) * 42;
        starPositions[position + 1] = (Math.random() - 0.5) * 24;
        starPositions[position + 2] = (Math.random() - 0.5) * 42;
        starColors[position] = brightness;
        starColors[position + 1] = brightness * 0.98;
        starColors[position + 2] = brightness * 0.9;
      }
      starGeometry.setAttribute(
        "position",
        new THREE.BufferAttribute(starPositions, 3),
      );
      starGeometry.setAttribute(
        "color",
        new THREE.BufferAttribute(starColors, 3),
      );
      scene.add(
        new THREE.Points(
          starGeometry,
          new THREE.PointsMaterial({
            size,
            vertexColors: true,
            transparent: true,
            opacity: 0.75,
            sizeAttenuation: true,
          }),
        ),
      );
    });

    // The sun is composed of a lit core and a transparent outer halo.
    const sun = new THREE.Mesh(
      new THREE.SphereGeometry(1.1, 48, 48),
      new THREE.MeshStandardMaterial({
        color: 0xe8a95e,
        emissive: 0x9d4c1c,
        emissiveIntensity: 1.4,
        roughness: 0.7,
      }),
    );
    system.add(sun);

    const sunHalo = new THREE.Mesh(
      new THREE.SphereGeometry(1.42, 32, 32),
      new THREE.MeshBasicMaterial({
        color: 0xf1bd78,
        transparent: true,
        opacity: 0.08,
        side: THREE.BackSide,
      }),
    );
    system.add(sunHalo);

    // Each destination gets an orbit ring and a planet mesh. The returned
    // metadata is used later to animate and raycast the planets.
    const planets = destinations.map((destination, index) => {
      const orbitGroup = new THREE.Group();
      orbitGroup.rotation.x = (index - 1.5) * 0.08;
      orbitGroup.rotation.z = (index - 1.5) * 0.04;
      system.add(orbitGroup);

      // Build a circle from line segments so its size follows the destination.
      const orbit = new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints(
          Array.from({ length: 128 }, (_, point) => {
            const angle = (point / 128) * Math.PI * 2;
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
      orbitGroup.add(orbit);

      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(destination.size, 32, 32),
        new THREE.MeshStandardMaterial({
          color: destination.color,
          roughness: 0.72,
          metalness: 0.05,
        }),
      );
      mesh.userData = { id: destination.id };
      orbitGroup.add(mesh);
      return {
        mesh,
        angle: index * 1.55,
        distance: destination.distance,
        speed: destination.speed,
      };
    });

    // Pointer coordinates are normalized for Three.js raycasting.
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const updatePointer = (event) => {
      const bounds = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
    };
    // Show only the description belonging to the currently hovered planet.
    const setHoveredLabel = (id) => {
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
    // Raycast against planet meshes so orbit lines and the sun do not trigger
    // hover or selection states.
    const handlePointerMove = (event) => {
      updatePointer(event);
      raycaster.setFromCamera(pointer, camera);
      const hovered = raycaster.intersectObjects(
        planets.map(({ mesh }) => mesh),
      )[0]?.object;
      renderer.domElement.style.cursor = hovered ? "pointer" : "default";
      setHoveredLabel(hovered?.userData.id);
    };
    // Zoom state is tied to the animation clock and current Three.js object.
    let zoomTarget = null;
    let zoomStartedAt = 0;
    let zoomStartPosition = null;
    let zoomStartTarget = null;
    let zoomFinished = false;
    const handleClick = (event) => {
      updatePointer(event);
      raycaster.setFromCamera(pointer, camera);
      const selected = raycaster.intersectObjects(
        planets.map(({ mesh }) => mesh),
      )[0]?.object;
      if (selected && !zoomTarget) {
        zoomTarget = selected;
        zoomStartedAt = timer.getElapsed();
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
    window.addEventListener("resize", resize);
    resize();

    // THREE.Timer provides elapsed time for smooth, frame-rate-independent motion.
    const timer = new THREE.Timer();
    timer.connect(document);
    let frame;
    const animate = (timestamp) => {
      timer.update(timestamp);
      const elapsed = timer.getElapsed();
      // Move each planet and project its 3D position into screen coordinates
      // so its HTML label follows it.
      planets.forEach(({ mesh, angle, distance, speed }) => {
        mesh.position.set(
          Math.cos(angle + elapsed * speed) * distance,
          0,
          Math.sin(angle + elapsed * speed) * distance,
        );
        mesh.rotation.y = elapsed * speed;
        const projected = mesh
          .getWorldPosition(new THREE.Vector3())
          .project(camera);
        const label = labelRefs.current[mesh.userData.id];
        if (label) {
          label.style.left = `${(projected.x * 0.5 + 0.5) * 100}%`;
          label.style.top = `${(-projected.y * 0.5 + 0.5) * 100}%`;
        }
      });
      // Interpolate the camera toward the selected planet using cubic easing,
      // then notify the parent once the transition has completed.
      if (zoomTarget) {
        const progress = Math.min((elapsed - zoomStartedAt) / 0.9, 1);
        const easedProgress = 1 - (1 - progress) ** 3;
        const targetPosition = zoomTarget.getWorldPosition(new THREE.Vector3());
        const zoomDirection = zoomStartPosition
          .clone()
          .sub(zoomStartTarget)
          .normalize();
        const endPosition = targetPosition
          .clone()
          .add(zoomDirection.multiplyScalar(1.35));
        camera.position.lerpVectors(
          zoomStartPosition,
          endPosition,
          easedProgress,
        );
        camera.lookAt(targetPosition);
        if (progress === 1 && !zoomFinished) {
          zoomFinished = true;
          onSelectRef.current(zoomTarget.userData.id);
        }
      }
      // Slowly rotate the sun while rendering the current frame.
      sun.rotation.y = elapsed * 0.1;
      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      // Stop the loop and detach listeners before releasing WebGL resources.
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      renderer.domElement.removeEventListener("pointermove", handlePointerMove);
      renderer.domElement.removeEventListener("click", handleClick);
      renderer.domElement.removeEventListener(
        "pointerleave",
        handlePointerLeave,
      );
      timer.dispose();
      renderer.dispose();
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
            className="absolute -translate-x-1/2 translate-y-6 whitespace-nowrap text-center font-mono"
            key={destination.id}
            ref={(element) => {
              labelRefs.current[destination.id] = element;
            }}
          >
            <strong className="block text-[11px] uppercase tracking-[.14em] text-text">
              {destination.label}
            </strong>
            <span
              className="mt-1 block text-[10px] text-muted opacity-0 transition-opacity duration-200"
              ref={(element) => {
                descriptionRefs.current[destination.id] = element;
              }}
            >
              {destination.description}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default OrbitalScene;
