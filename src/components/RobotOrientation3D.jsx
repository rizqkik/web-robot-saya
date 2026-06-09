import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const toRadians = (degrees = 0) => (degrees * Math.PI) / 180;
const damp = 0.08;

const makeBox = (size, color, position, options = {}) => {
  const geometry = new THREE.BoxGeometry(size[0], size[1], size[2]);
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.55,
    metalness: options.metalness ?? 0.08,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(position[0], position[1], position[2]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
};

const makeWheel = (x, z) => {
  const group = new THREE.Group();
  group.position.set(x, -0.16, z);

  const tire = new THREE.Mesh(
    new THREE.CylinderGeometry(0.36, 0.36, 0.32, 40, 1),
    new THREE.MeshStandardMaterial({ color: '#050816', roughness: 0.72, metalness: 0.12 }),
  );
  tire.rotation.z = Math.PI / 2;
  tire.castShadow = true;
  tire.receiveShadow = true;
  group.add(tire);

  const rim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.22, 0.34, 32, 1),
    new THREE.MeshStandardMaterial({ color: '#0ea5e9', roughness: 0.4, metalness: 0.45 }),
  );
  rim.rotation.z = Math.PI / 2;
  rim.castShadow = true;
  group.add(rim);

  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.09, 0.36, 24, 1),
    new THREE.MeshStandardMaterial({ color: '#94a3b8', roughness: 0.35, metalness: 0.6 }),
  );
  hub.rotation.z = Math.PI / 2;
  hub.castShadow = true;
  group.add(hub);

  return group;
};

const makeSpring = (x, z) => {
  const curve = new THREE.CatmullRomCurve3(
    Array.from({ length: 42 }, (_, index) => {
      const t = index / 41;
      const angle = t * Math.PI * 9;
      return new THREE.Vector3(
        x + Math.cos(angle) * 0.055,
        -0.08 + t * 0.66,
        z + Math.sin(angle) * 0.055,
      );
    }),
  );

  const spring = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 64, 0.012, 8, false),
    new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.28, metalness: 0.7 }),
  );
  spring.castShadow = true;
  return spring;
};

const buildRobot = () => {
  const robot = new THREE.Group();

  robot.add(makeBox([2.75, 0.22, 1.55], '#0b1020', [0, 0.18, 0]));
  robot.add(makeBox([1.3, 0.2, 1.1], '#f59e0b', [0.28, 0.0, 0.02], { roughness: 0.5 }));
  robot.add(makeBox([1.45, 0.35, 0.82], '#030712', [-0.38, -0.25, 0], { roughness: 0.62 }));

  const middlePlate = makeBox([2.15, 0.1, 1.25], '#64748b', [0, 0.78, 0]);
  robot.add(middlePlate);

  const topPlate = makeBox([1.92, 0.1, 1.08], '#94a3b8', [0.08, 1.42, 0], { metalness: 0.15 });
  robot.add(topPlate);

  robot.add(makeBox([1.22, 0.07, 0.74], '#16a34a', [-0.12, 0.91, 0.02], { roughness: 0.42 }));
  robot.add(makeBox([1.38, 0.08, 0.82], '#2563eb', [0.12, 1.55, -0.01], { roughness: 0.38 }));

  const chipPositions = [
    [-0.36, 1.64, 0.18],
    [0.12, 1.65, -0.2],
    [0.45, 1.65, 0.19],
    [-0.45, 0.99, -0.23],
    [0.25, 0.99, 0.18],
  ];
  chipPositions.forEach((position, index) => {
    robot.add(makeBox([0.24, 0.08, 0.18], index % 2 ? '#475569' : '#1e293b', position));
  });

  const posts = [
    [-1.04, 0.35, -0.56],
    [1.04, 0.35, -0.56],
    [-1.04, 0.35, 0.56],
    [1.04, 0.35, 0.56],
  ];

  posts.forEach(([x, y, z]) => {
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.035, 0.035, 1.25, 16),
      new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.28, metalness: 0.75 }),
    );
    post.position.set(x, y + 0.45, z);
    post.castShadow = true;
    robot.add(post);
  });

  [
    [-1.45, -0.78],
    [1.45, -0.78],
    [-1.45, 0.78],
    [1.45, 0.78],
  ].forEach(([x, z]) => {
    robot.add(makeWheel(x, z));
    robot.add(makeSpring(x * 0.76, z * 0.72));
  });

  const bumper = new THREE.Mesh(
    new THREE.TorusGeometry(0.62, 0.035, 10, 48, Math.PI),
    new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.36, metalness: 0.55 }),
  );
  bumper.position.set(-1.16, -0.08, 0);
  bumper.rotation.y = Math.PI / 2;
  bumper.rotation.z = Math.PI / 2;
  robot.add(bumper);

  robot.rotation.y = -0.62;
  robot.rotation.x = 0.08;
  return robot;
};

const RobotOrientation3D = ({ pitch = 0, roll = 0, yaw = 0 }) => {
  const mountRef = useRef(null);
  const robotRef = useRef(null);
  const frameRef = useRef(null);
  const attitudeRef = useRef({ pitch, roll, yaw });

  useEffect(() => {
    attitudeRef.current = { pitch, roll, yaw };
  }, [pitch, roll, yaw]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(4.2, 3.2, 5.1);
    camera.lookAt(0, 0.45, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight('#ffffff', 1.4);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight('#ffffff', 1.8);
    keyLight.position.set(3.5, 5, 4);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight('#67e8f9', 0.55);
    fillLight.position.set(-3, 2, -4);
    scene.add(fillLight);

    const grid = new THREE.GridHelper(5.2, 12, '#38bdf8', '#64748b');
    grid.position.y = -0.65;
    grid.material.transparent = true;
    grid.material.opacity = 0.22;
    scene.add(grid);

    const robot = buildRobot();
    robotRef.current = robot;
    scene.add(robot);

    const resize = () => {
      const { width, height } = mount.getBoundingClientRect();
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    const animate = () => {
      if (robotRef.current) {
        const attitude = attitudeRef.current;
        const baseYaw = -0.62;
        const targetPitch = 0.08 + toRadians(attitude.pitch) * -0.7;
        const targetRoll = toRadians(attitude.roll) * 0.85;
        const targetYaw = baseYaw + toRadians(attitude.yaw);

        robotRef.current.rotation.x += (targetPitch - robotRef.current.rotation.x) * damp;
        robotRef.current.rotation.z += (targetRoll - robotRef.current.rotation.z) * damp;
        robotRef.current.rotation.y += (targetYaw - robotRef.current.rotation.y) * damp;
      }

      renderer.render(scene, camera);
      frameRef.current = requestAnimationFrame(animate);
    };

    resize();
    window.addEventListener('resize', resize);
    frameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      renderer.dispose();
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
      mount.removeChild(renderer.domElement);
      robotRef.current = null;
    };
  }, []);

  return <div ref={mountRef} className="h-full w-full" aria-label="Live robot 3D orientation" />;
};

export default RobotOrientation3D;
