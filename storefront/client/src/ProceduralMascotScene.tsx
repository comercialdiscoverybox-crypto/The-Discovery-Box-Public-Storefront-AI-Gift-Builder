import { useEffect, useRef, useState, type CSSProperties } from 'react';
import * as THREE from 'three';

export type MascotName = 'sunny' | 'fox' | 'mochi' | 'panda' | 'milo';
export type MascotValue =
  | 'creativity'
  | 'discovery'
  | 'personalisation'
  | 'thoughtfulness'
  | 'quality';

export interface ProceduralMascotSceneProps {
  mascot: MascotName;
  value?: MascotValue | string;
  action?: string;
  className?: string;
  style?: CSSProperties;
  ariaLabel?: string;
}

export interface MascotShowcaseProps {
  actions?: Partial<Record<MascotName, string>>;
  className?: string;
  style?: CSSProperties;
  ariaLabel?: string;
}

type Activity = 'puzzle' | 'map' | 'gift' | 'heart' | 'magnifier';

const palette = {
  ink: '#332a32',
  white: '#fffaf1',
  cream: '#fff1dc',
  orange: '#ee8740',
  orangeDark: '#c75c2b',
  pink: '#f18ca6',
  pinkLight: '#ffc1cb',
  gold: '#ffc94d',
  sunflower: '#ffca43',
  leaf: '#75a968',
  leafDark: '#47794f',
  black: '#292a31',
  map: '#8bc9b4',
  blue: '#77bce3',
  purple: '#ac8bdd',
  red: '#f17d78',
} as const;

const mascotNames: Record<MascotName, string> = {
  sunny: 'Sunny',
  fox: 'Fox',
  mochi: 'Mochi',
  panda: 'Panda',
  milo: 'Milo',
};

function material(color: string, options: THREE.MeshStandardMaterialParameters = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.78, ...options });
}

function addSphere(
  parent: THREE.Object3D,
  color: string,
  position: [number, number, number],
  scale: [number, number, number],
  options: THREE.MeshStandardMaterialParameters = {},
) {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(1, 20, 16),
    material(color, options),
  );
  mesh.position.set(...position);
  mesh.scale.set(...scale);
  parent.add(mesh);
  return mesh;
}

function addBox(
  parent: THREE.Object3D,
  color: string,
  position: [number, number, number],
  size: [number, number, number],
  options: THREE.MeshStandardMaterialParameters = {},
) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(...size),
    material(color, options),
  );
  mesh.position.set(...position);
  parent.add(mesh);
  return mesh;
}

function addCone(
  parent: THREE.Object3D,
  color: string,
  position: [number, number, number],
  radius: number,
  height: number,
  options: THREE.MeshStandardMaterialParameters = {},
) {
  const mesh = new THREE.Mesh(
    new THREE.ConeGeometry(radius, height, 16),
    material(color, options),
  );
  mesh.position.set(...position);
  parent.add(mesh);
  return mesh;
}

function addTube(
  parent: THREE.Object3D,
  points: THREE.Vector3[],
  radius: number,
  color: string,
) {
  const curve = new THREE.CatmullRomCurve3(points);
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 20, radius, 8, false),
    material(color),
  );
  parent.add(mesh);
  return mesh;
}

function addEye(parent: THREE.Object3D, x: number, y: number, z: number) {
  addSphere(parent, palette.ink, [x, y, z], [0.045, 0.06, 0.035]);
  addSphere(parent, '#ffffff', [x - 0.012, y + 0.02, z + 0.03], [0.012, 0.014, 0.01]);
}

function addFace(parent: THREE.Object3D, muzzleColor: string = palette.cream) {
  addEye(parent, -0.19, 0.045, 0.53);
  addEye(parent, 0.19, 0.045, 0.53);
  addSphere(parent, muzzleColor, [-0.09, -0.13, 0.53], [0.15, 0.105, 0.095]);
  addSphere(parent, muzzleColor, [0.09, -0.13, 0.53], [0.15, 0.105, 0.095]);
  addSphere(parent, palette.orangeDark, [0, -0.09, 0.635], [0.055, 0.04, 0.035]);
  addTube(
    parent,
    [new THREE.Vector3(0, -0.12, 0.65), new THREE.Vector3(0, -0.19, 0.65), new THREE.Vector3(0.055, -0.21, 0.64)],
    0.012,
    palette.ink,
  );
  addTube(
    parent,
    [new THREE.Vector3(0, -0.19, 0.65), new THREE.Vector3(-0.055, -0.21, 0.64)],
    0.012,
    palette.ink,
  );
}

function addTail(root: THREE.Group, mascot: MascotName) {
  const tail = new THREE.Group();
  tail.position.set(0.35, 0.48, -0.18);
  root.add(tail);

  if (mascot === 'fox') {
    addSphere(tail, palette.orange, [0.42, 0.02, -0.02], [0.45, 0.3, 0.27]);
    addSphere(tail, palette.white, [0.76, 0.035, -0.015], [0.18, 0.2, 0.2]);
  } else if (mascot === 'milo') {
    addTube(
      tail,
      [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0.24, 0.08, 0),
        new THREE.Vector3(0.36, 0.31, 0),
        new THREE.Vector3(0.48, 0.52, 0),
      ],
      0.095,
      palette.orange,
    );
    addSphere(tail, palette.ink, [0.48, 0.52, 0], [0.1, 0.1, 0.1]);
  } else if (mascot === 'panda') {
    addSphere(tail, palette.white, [0.2, 0.04, 0], [0.13, 0.13, 0.13]);
  } else if (mascot === 'mochi') {
    addSphere(tail, palette.white, [0.18, 0.04, 0], [0.14, 0.14, 0.14]);
  } else {
    addTube(
      tail,
      [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.2, 0.12, 0), new THREE.Vector3(0.34, 0.3, 0)],
      0.065,
      palette.leafDark,
    );
  }

  return tail;
}

function createMascot(mascot: MascotName) {
  const root = new THREE.Group();
  const body = new THREE.Group();
  const head = new THREE.Group();
  const arms: THREE.Group[] = [];
  root.add(body, head);

  const bodyColor = mascot === 'sunny' ? palette.leaf : mascot === 'panda' ? palette.white : mascot === 'mochi' ? palette.white : palette.orange;
  const limbColor = mascot === 'panda' ? palette.black : bodyColor;
  addSphere(body, bodyColor, [0, 0.88, 0], [0.46, 0.61, 0.34]);
  addSphere(body, mascot === 'fox' || mascot === 'milo' ? palette.white : mascot === 'sunny' ? palette.gold : palette.cream, [0, 0.85, 0.298], [0.29, 0.42, 0.08]);

  for (const side of [-1, 1]) {
    addSphere(root, limbColor, [side * 0.23, 0.29, 0], [0.17, 0.29, 0.2]);
    addSphere(root, mascot === 'panda' ? palette.white : bodyColor, [side * 0.25, 0.08, 0.08], [0.21, 0.12, 0.26]);

    const arm = new THREE.Group();
    arm.position.set(side * 0.36, 1.09, 0.02);
    root.add(arm);
    addSphere(arm, limbColor, [side * 0.1, -0.2, 0], [0.15, 0.31, 0.17]);
    addSphere(arm, mascot === 'panda' ? palette.black : bodyColor, [side * 0.17, -0.37, 0.05], [0.16, 0.13, 0.16]);
    arms.push(arm);
  }

  head.position.y = 1.65;
  const headColor = mascot === 'panda' || mascot === 'mochi' ? palette.white : mascot === 'sunny' ? palette.gold : palette.orange;

  if (mascot === 'sunny') {
    for (let i = 0; i < 12; i += 1) {
      const angle = (i / 12) * Math.PI * 2;
      const petal = addSphere(
        head,
        palette.sunflower,
        [Math.sin(angle) * 0.48, Math.cos(angle) * 0.48, 0],
        [0.18, 0.32, 0.14],
      );
      petal.rotation.z = -angle;
    }
    addSphere(head, '#a45a32', [0, 0, 0.12], [0.43, 0.43, 0.23]);
    addSphere(head, palette.gold, [0, 0, 0.26], [0.36, 0.36, 0.16]);
    addFace(head, '#fff0c8');
    addSphere(body, palette.leafDark, [-0.38, 0.81, 0.12], [0.24, 0.12, 0.08]).rotation.z = 0.48;
    addSphere(body, palette.leafDark, [0.38, 0.81, 0.12], [0.24, 0.12, 0.08]).rotation.z = -0.48;
  } else {
    addSphere(head, headColor, [0, 0, 0], [0.58, 0.56, 0.46]);

    if (mascot === 'fox') {
      for (const side of [-1, 1]) {
        const ear = addCone(head, palette.orangeDark, [side * 0.38, 0.48, -0.02], 0.25, 0.62);
        ear.rotation.z = side * 0.18;
        addCone(head, palette.white, [side * 0.38, 0.44, 0.16], 0.14, 0.42);
      }
      addSphere(head, palette.white, [0, -0.14, 0.35], [0.4, 0.24, 0.24]);
      addFace(head, palette.white);
      addSphere(head, palette.orangeDark, [0, 0.28, 0.4], [0.11, 0.1, 0.055]);
    } else if (mascot === 'mochi') {
      for (const side of [-1, 1]) {
        const ear = addSphere(head, palette.white, [side * 0.31, 0.67, 0], [0.17, 0.57, 0.13]);
        ear.rotation.z = side * -0.12;
        const inner = addSphere(head, palette.pink, [side * 0.31, 0.68, 0.11], [0.095, 0.41, 0.045]);
        inner.rotation.z = side * -0.12;
      }
      addFace(head);
      addSphere(head, palette.pinkLight, [-0.31, -0.13, 0.43], [0.09, 0.055, 0.025]);
      addSphere(head, palette.pinkLight, [0.31, -0.13, 0.43], [0.09, 0.055, 0.025]);
    } else if (mascot === 'panda') {
      for (const side of [-1, 1]) {
        addSphere(head, palette.black, [side * 0.42, 0.42, 0], [0.2, 0.2, 0.18]);
        const patch = addSphere(head, palette.black, [side * 0.2, 0.04, 0.37], [0.15, 0.2, 0.09]);
        patch.rotation.z = side * -0.28;
      }
      addSphere(head, palette.white, [0, -0.16, 0.43], [0.27, 0.2, 0.15]);
      addEye(head, -0.2, 0.045, 0.47);
      addEye(head, 0.2, 0.045, 0.47);
      addSphere(head, palette.black, [0, -0.12, 0.59], [0.06, 0.045, 0.035]);
      addTube(head, [new THREE.Vector3(0, -0.16, 0.62), new THREE.Vector3(0, -0.22, 0.62)], 0.012, palette.black);
    } else {
      for (const side of [-1, 1]) {
        const ear = addCone(head, palette.orangeDark, [side * 0.39, 0.43, -0.02], 0.23, 0.54);
        ear.rotation.z = side * 0.2;
        addCone(head, palette.pink, [side * 0.39, 0.4, 0.14], 0.12, 0.35);
      }
      addFace(head, palette.white);
      for (const side of [-1, 1]) {
        addSphere(head, palette.orangeDark, [side * 0.19, 0.34, 0.39], [0.05, 0.13, 0.045]).rotation.z = side * -0.28;
        addSphere(head, palette.orangeDark, [side * 0.38, 0.04, 0.34], [0.12, 0.045, 0.045]).rotation.z = side * -0.3;
      }
      addSphere(head, palette.orangeDark, [0, 0.42, 0.37], [0.055, 0.12, 0.04]);
    }
  }

  const tail = addTail(root, mascot);
  return { root, head, arms, tail };
}

function resolveActivity(value?: string, action?: string): Activity {
  const selected = (action?.trim() || value || 'creativity').toLowerCase();
  if (/quality|inspect|magnif|review/.test(selected)) return 'magnifier';
  if (/thought|heart|kind|offer/.test(selected)) return 'heart';
  if (/personal|gift|custom/.test(selected)) return 'gift';
  if (/discover|map|explor/.test(selected)) return 'map';
  return 'puzzle';
}

function createActivity(activity: Activity) {
  const group = new THREE.Group();
  group.position.set(0.9, 1.47, 0.35);

  if (activity === 'puzzle') {
    addBox(group, palette.purple, [0, 0, 0], [0.38, 0.38, 0.16]);
    addSphere(group, palette.purple, [0, 0.21, 0], [0.12, 0.12, 0.1]);
    addSphere(group, palette.purple, [0.21, 0, 0], [0.12, 0.12, 0.1]);
    addBox(group, palette.gold, [-0.32, -0.28, 0.03], [0.23, 0.23, 0.14]);
    addSphere(group, palette.gold, [-0.32, -0.15, 0.03], [0.09, 0.09, 0.08]);
  } else if (activity === 'map') {
    addBox(group, '#fff5de', [0, 0, 0], [0.76, 0.56, 0.08]);
    addTube(
      group,
      [
        new THREE.Vector3(-0.27, -0.17, 0.06),
        new THREE.Vector3(-0.1, 0.04, 0.06),
        new THREE.Vector3(0.08, -0.08, 0.06),
        new THREE.Vector3(0.27, 0.18, 0.06),
      ],
      0.025,
      palette.map,
    );
    addSphere(group, palette.red, [0.19, 0.13, 0.12], [0.07, 0.07, 0.04]);
    addCone(group, palette.red, [0.19, 0.02, 0.1], 0.07, 0.19);
  } else if (activity === 'gift') {
    addBox(group, palette.red, [0, -0.04, 0], [0.48, 0.4, 0.34]);
    addBox(group, palette.gold, [0, -0.04, 0.18], [0.09, 0.4, 0.025]);
    addBox(group, palette.gold, [0, -0.04, 0.18], [0.48, 0.08, 0.025]);
    addBox(group, palette.pink, [0, 0.2, 0], [0.54, 0.1, 0.4]);
    const bowLeft = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.045, 8, 16), material(palette.gold));
    bowLeft.position.set(-0.1, 0.31, 0.06);
    bowLeft.rotation.y = Math.PI / 2;
    group.add(bowLeft);
    const bowRight = bowLeft.clone();
    bowRight.position.x = 0.1;
    group.add(bowRight);
  } else if (activity === 'heart') {
    const shape = new THREE.Shape();
    shape.moveTo(0, -0.27);
    shape.bezierCurveTo(-0.1, -0.14, -0.37, 0.02, -0.37, 0.24);
    shape.bezierCurveTo(-0.37, 0.48, -0.05, 0.5, 0, 0.29);
    shape.bezierCurveTo(0.05, 0.5, 0.37, 0.48, 0.37, 0.24);
    shape.bezierCurveTo(0.37, 0.02, 0.1, -0.14, 0, -0.27);
    const heart = new THREE.Mesh(
      new THREE.ExtrudeGeometry(shape, { depth: 0.1, bevelEnabled: true, bevelSegments: 2, bevelSize: 0.025, bevelThickness: 0.025 }),
      material(palette.red),
    );
    heart.position.z = -0.04;
    group.add(heart);
    addSphere(group, palette.pinkLight, [-0.13, 0.28, 0.08], [0.08, 0.035, 0.025]);
  } else {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.06, 12, 24), material(palette.blue));
    group.add(ring);
    const glass = new THREE.Mesh(
      new THREE.CircleGeometry(0.19, 24),
      material('#d5f4f4', { transparent: true, opacity: 0.42, metalness: 0.08 }),
    );
    glass.position.z = 0.015;
    group.add(glass);
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.07, 0.35, 12), material(palette.orangeDark));
    handle.position.set(0.22, -0.34, 0);
    handle.rotation.z = -0.58;
    group.add(handle);
  }
  return group;
}

function MascotCanvas({ mascot, value, action, ariaLabel }: Omit<ProceduralMascotSceneProps, 'className' | 'style'>) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [isNearViewport, setIsNearViewport] = useState(false);
  const [failure, setFailure] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    if (!('IntersectionObserver' in window)) {
      setIsNearViewport(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: '120px', threshold: 0.01 },
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !isNearViewport) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    } catch {
      setFailure(true);
      return;
    }

    let isMounted = true;
    let frame = 0;
    const scene = new THREE.Scene();
    scene.add(new THREE.AmbientLight('#ffffff', 2.1));
    const keyLight = new THREE.DirectionalLight('#fff2dc', 2.5);
    keyLight.position.set(-3, 5, 6);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight('#b8d9ff', 0.75);
    fillLight.position.set(4, 2, 3);
    scene.add(fillLight);

    const rig = createMascot(mascot);
    const activity = createActivity(resolveActivity(value, action));
    scene.add(rig.root, activity);
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.setAttribute('role', 'img');
    renderer.domElement.setAttribute('aria-label', ariaLabel ?? `${mascotNames[mascot]} ${resolveActivity(value, action)} scene`);
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.outline = 'none';
    host.appendChild(renderer.domElement);

    const camera = new THREE.OrthographicCamera(-1.8, 1.8, 1.8, -1.8, 0.1, 30);
    camera.position.set(0, 1.35, 7);
    camera.lookAt(0, 1.32, 0);

    const resize = () => {
      if (!host.isConnected) return;
      const width = Math.max(1, host.clientWidth || 320);
      const height = Math.max(1, host.clientHeight || 320);
      const aspect = width / height;
      const viewHeight = Math.max(3.5, 3.1 / aspect);
      camera.left = -(viewHeight * aspect) / 2;
      camera.right = (viewHeight * aspect) / 2;
      camera.top = viewHeight / 2;
      camera.bottom = -viewHeight / 2;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      renderer.render(scene, camera);
    };

    const reducedMotionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    let reducedMotion = reducedMotionQuery?.matches ?? false;
    const stopAnimation = () => {
      if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    };
    const renderStatic = () => {
      rig.root.position.y = 0;
      rig.root.rotation.set(0, 0, 0);
      rig.arms.forEach((arm, index) => {
        arm.rotation.z = index === 0 ? 0.14 : -0.14;
      });
      rig.tail.rotation.z = 0;
      activity.rotation.set(0, 0, 0);
      renderer.render(scene, camera);
    };
    const animate = (now: number) => {
      if (!isMounted) return;
      const seconds = now / 1000;
      rig.root.position.y = Math.sin(seconds * 2.2) * 0.055;
      rig.root.rotation.y = Math.sin(seconds * 0.9) * 0.09;
      rig.root.rotation.z = Math.sin(seconds * 1.5) * 0.025;
      rig.arms.forEach((arm, index) => {
        const side = index === 0 ? -1 : 1;
        arm.rotation.z = side * (0.14 + Math.sin(seconds * 3 + index * Math.PI) * 0.16);
      });
      rig.tail.rotation.z = Math.sin(seconds * 2.4) * 0.18;
      activity.position.y = 1.47 + Math.sin(seconds * 2.5 + 0.7) * 0.075;
      activity.rotation.z = Math.sin(seconds * 1.4) * 0.055;
      activity.rotation.y = Math.sin(seconds * 1.1) * 0.12;
      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };
    const updateMotionPreference = () => {
      reducedMotion = reducedMotionQuery?.matches ?? false;
      stopAnimation();
      if (reducedMotion) renderStatic();
      else frame = requestAnimationFrame(animate);
    };
    const onContextLost = (event: Event) => {
      event.preventDefault();
      stopAnimation();
      renderer.domElement.style.display = 'none';
      if (isMounted) setFailure(true);
    };

    const resizeObserver = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(resize);
    resizeObserver?.observe(host);
    window.addEventListener('resize', resize);
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    reducedMotionQuery?.addEventListener('change', updateMotionPreference);
    resize();
    if (reducedMotion) renderStatic();
    else frame = requestAnimationFrame(animate);

    return () => {
      isMounted = false;
      stopAnimation();
      resizeObserver?.disconnect();
      window.removeEventListener('resize', resize);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      reducedMotionQuery?.removeEventListener('change', updateMotionPreference);
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          geometries.add(object.geometry);
          const meshMaterials = Array.isArray(object.material) ? object.material : [object.material];
          meshMaterials.forEach((item) => materials.add(item));
        }
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((item) => item.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [action, ariaLabel, isNearViewport, mascot, value]);

  return (
    <div
      ref={hostRef}
      aria-label={ariaLabel ?? `${mascot} character scene`}
      style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}
    >
      {failure && (
        <div
          role="img"
          aria-label={`${mascot} illustration unavailable`}
          style={{
            width: '100%',
            height: '100%',
            display: 'grid',
            placeItems: 'center',
            color: palette.ink,
            font: '600 1rem/1.4 system-ui, sans-serif',
            textAlign: 'center',
          }}
        >
          <span>{mascotNames[mascot]} is ready to join your adventure.</span>
        </div>
      )}
    </div>
  );
}

export function MascotScene(props: ProceduralMascotSceneProps) {
  const { className, style, ...sceneProps } = props;
  return (
    <div className={className} style={{ width: '100%', height: 360, ...style }}>
      <MascotCanvas {...sceneProps} />
    </div>
  );
}

export const ProceduralMascotScene = MascotScene;
export default MascotScene;

const showcaseEntries: Array<{ mascot: MascotName; value: MascotValue }> = [
  { mascot: 'sunny', value: 'creativity' },
  { mascot: 'fox', value: 'discovery' },
  { mascot: 'mochi', value: 'personalisation' },
  { mascot: 'panda', value: 'thoughtfulness' },
  { mascot: 'milo', value: 'quality' },
];

function MascotShowcaseCanvas({ actions, ariaLabel }: Omit<MascotShowcaseProps, 'className' | 'style'>) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [isNearViewport, setIsNearViewport] = useState(false);
  const [failure, setFailure] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    if (!('IntersectionObserver' in window)) {
      setIsNearViewport(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: '120px', threshold: 0.01 },
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !isNearViewport) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    } catch {
      setFailure(true);
      return;
    }

    let isMounted = true;
    let frame = 0;
    const scene = new THREE.Scene();
    scene.add(new THREE.AmbientLight('#ffffff', 2.1));
    const keyLight = new THREE.DirectionalLight('#fff2dc', 2.5);
    keyLight.position.set(-3, 5, 6);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight('#b8d9ff', 0.75);
    fillLight.position.set(4, 2, 3);
    scene.add(fillLight);

    const rigs = showcaseEntries.map(({ mascot, value }, index) => {
      const rig = createMascot(mascot);
      const slot = new THREE.Group();
      slot.position.x = (index - 2) * 1.62;
      rig.root.scale.setScalar(0.78);
      rig.root.position.x = -0.14;
      const activity = createActivity(resolveActivity(value, actions?.[mascot]));
      activity.scale.setScalar(0.78);
      activity.position.x = 0.7;
      activity.position.y = 1.26;
      activity.position.z = 0.35;
      slot.add(rig.root, activity);
      scene.add(slot);
      return { ...rig, slot, activity };
    });

    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.setAttribute('role', 'img');
    renderer.domElement.setAttribute(
      'aria-label',
      ariaLabel ?? 'Sunny, Fox, Mochi, Panda, and Milo mascot showcase',
    );
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.outline = 'none';
    host.appendChild(renderer.domElement);

    const camera = new THREE.OrthographicCamera(-4.2, 4.2, 1.8, -1.8, 0.1, 30);
    camera.position.set(0, 1.3, 7);
    camera.lookAt(0, 1.3, 0);
    const resize = () => {
      if (!host.isConnected) return;
      const width = Math.max(1, host.clientWidth || 640);
      const height = Math.max(1, host.clientHeight || 280);
      const aspect = width / height;
      const viewWidth = Math.max(8.4, 3.55 * aspect);
      const viewHeight = viewWidth / aspect;
      camera.left = -viewWidth / 2;
      camera.right = viewWidth / 2;
      camera.top = viewHeight / 2;
      camera.bottom = -viewHeight / 2;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      renderer.render(scene, camera);
    };

    const reducedMotionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    let reducedMotion = reducedMotionQuery?.matches ?? false;
    const stopAnimation = () => {
      if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    };
    const renderStatic = () => {
      rigs.forEach(({ root, arms, tail, activity }) => {
        root.position.y = 0;
        root.rotation.set(0, 0, 0);
        arms.forEach((arm, index) => {
          arm.rotation.z = index === 0 ? 0.14 : -0.14;
        });
        tail.rotation.z = 0;
        activity.rotation.set(0, 0, 0);
      });
      renderer.render(scene, camera);
    };
    const animate = (now: number) => {
      if (!isMounted) return;
      const seconds = now / 1000;
      rigs.forEach(({ root, arms, tail, activity }, index) => {
        const offset = index * 0.55;
        root.position.y = Math.sin(seconds * 2.2 + offset) * 0.045;
        root.rotation.y = Math.sin(seconds * 0.9 + offset) * 0.075;
        root.rotation.z = Math.sin(seconds * 1.5 + offset) * 0.02;
        arms.forEach((arm, armIndex) => {
          const side = armIndex === 0 ? -1 : 1;
          arm.rotation.z = side * (0.14 + Math.sin(seconds * 3 + offset + armIndex * Math.PI) * 0.15);
        });
        tail.rotation.z = Math.sin(seconds * 2.4 + offset) * 0.17;
        activity.position.y = 1.26 + Math.sin(seconds * 2.5 + offset + 0.7) * 0.06;
        activity.rotation.z = Math.sin(seconds * 1.4 + offset) * 0.05;
        activity.rotation.y = Math.sin(seconds * 1.1 + offset) * 0.1;
      });
      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };
    const updateMotionPreference = () => {
      reducedMotion = reducedMotionQuery?.matches ?? false;
      stopAnimation();
      if (reducedMotion) renderStatic();
      else frame = requestAnimationFrame(animate);
    };
    const onContextLost = (event: Event) => {
      event.preventDefault();
      stopAnimation();
      renderer.domElement.style.display = 'none';
      if (isMounted) setFailure(true);
    };
    const resizeObserver = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(resize);
    resizeObserver?.observe(host);
    window.addEventListener('resize', resize);
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);
    reducedMotionQuery?.addEventListener('change', updateMotionPreference);
    resize();
    if (reducedMotion) renderStatic();
    else frame = requestAnimationFrame(animate);

    return () => {
      isMounted = false;
      stopAnimation();
      resizeObserver?.disconnect();
      window.removeEventListener('resize', resize);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      reducedMotionQuery?.removeEventListener('change', updateMotionPreference);
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          geometries.add(object.geometry);
          const meshMaterials = Array.isArray(object.material) ? object.material : [object.material];
          meshMaterials.forEach((item) => materials.add(item));
        }
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((item) => item.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [actions, ariaLabel, isNearViewport]);

  return (
    <div
      ref={hostRef}
      aria-label={ariaLabel ?? 'Five mascot showcase'}
      style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}
    >
      {failure && (
        <div
          role="img"
          aria-label="Mascot showcase illustration unavailable"
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-evenly',
            color: palette.ink,
            font: '600 0.9rem/1.4 system-ui, sans-serif',
          }}
        >
          {showcaseEntries.map(({ mascot }) => <span key={mascot}>{mascotNames[mascot]}</span>)}
        </div>
      )}
    </div>
  );
}

export function MascotShowcase(props: MascotShowcaseProps) {
  const { className, style, ...showcaseProps } = props;
  return (
    <div className={className} style={{ width: '100%', height: 280, ...style }}>
      <MascotShowcaseCanvas {...showcaseProps} />
    </div>
  );
}
