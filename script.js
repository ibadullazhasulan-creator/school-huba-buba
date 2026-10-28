import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.166.1/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.166.1/examples/jsm/controls/OrbitControls.js';

const roomData = {
  campus: {
    key: 'campus',
    name: 'Кампус орталығы',
    type: 'Main Hub',
    subtitle: 'CLASSVERSE негізгі аймағы. Осы жерден барлық бөлмеге өтесіз.',
    description: 'Кампус көрінісі — виртуалды мектептің жүрегі. Мұнда ашық неон атмосферасы, анимацияланған 3D объектілер және барлық бөлмелерге жылдам өту нүктелері бар.',
    features: ['Панорамалық 3D кампус', 'Барлық бөлмеге бір батырмамен өту', 'Интерактивті ғимараттарды басу', 'Ашық неон background және анимациялар'],
    actions: ['Orbit', 'Explore', 'Click Buildings', 'Return to Hub'],
    panelActions: []
  },
  classroom: {
    key: 'classroom',
    name: 'Smart Classroom',
    type: 'Academic Room',
    subtitle: 'Интерактивті сабақ өткізуге арналған цифрлық сынып.',
    description: 'Бұл бөлмеде тақта, үстелдер, неон жарық сызықтары және сабақ режиміне арналған футуристік интерьер бар. Камера ішке еніп, сынып атмосферасын көрсетеді.',
    features: ['Digital board', 'Student desks', 'Lesson focus mode', 'Quick teaching atmosphere'],
    actions: ['Сабақ кестесі', 'Тапсырма бастау', 'Фокус режимі'],
    panelActions: ['Кіру', 'Тақтаға өту', 'Кампусқа қайту']
  },
  lab: {
    key: 'lab',
    name: 'STEM / AI Lab',
    type: 'Innovation Room',
    subtitle: 'Тәжірибе, роботика және ЖИ идеяларына арналған зертхана.',
    description: 'Бұл кеңістікте зертханалық үстелдер, жарқыраған колбалар және техно орта бар. STEM сабақтарына, жобаларға және тәжірибелерге арналған.',
    features: ['Experiment benches', 'Glowing canisters', 'Innovation zone', 'Science project setup'],
    actions: ['Эксперимент режимі', 'AI бұрышы', 'Жоба бұрышы'],
    panelActions: ['Кіру', 'Зертханаға жақындау', 'Кампусқа қайту']
  },
  library: {
    key: 'library',
    name: 'Neon Library',
    type: 'Reading Room',
    subtitle: 'Оқу, зерттеу және тыныш жұмысқа арналған цифрлық кітапхана.',
    description: 'Кітап сөрелері, оқу үстелдері және жұмсақ жарығы бар кітапхана бөлімі. Бұл бөлме зерттеу мен тыныш жұмыстың символы.',
    features: ['Bookshelf walls', 'Reading desk', 'Silent focus', 'Research vibe'],
    actions: ['Оқу режимі', 'Тыныш фокус', 'Ресурс сілтемелері'],
    panelActions: ['Кіру', 'Оқу орнына өту', 'Кампусқа қайту']
  },
  hall: {
    key: 'hall',
    name: 'Event Hall',
    type: 'Presentation Room',
    subtitle: 'Презентация, жиналыс және іс-шараларға арналған зал.',
    description: 'Сахнасы, орындықтары және негізгі экран аймағы бар заманауи аудитория. Мектептік іс-шаралар мен қорғауларға ыңғайлы.',
    features: ['Stage area', 'Audience seats', 'Presentation zone', 'Event-ready view'],
    actions: ['Презентация режимі', 'Жиналыс режимі', 'Showtime'],
    panelActions: ['Кіру', 'Сахнаға өту', 'Кампусқа қайту']
  }
};

const quotes = [
  '«Білім – болашақтың ең жарық энергиясы.»',
  '«Арман мен еңбек қосылса, мектеп өмірі жаңа деңгейге көтеріледі.»',
  '«Жаңашыл сынып – жарқын ұрпақтың мекені.»',
  '«3D ойлау – заманауи білімнің жаңа кеңістігі.»'
];

const roomList = document.getElementById('roomList');
const quoteText = document.getElementById('quoteText');
const liveClock = document.getElementById('liveClock');
const infoTitle = document.getElementById('infoTitle');
const infoSubtitle = document.getElementById('infoSubtitle');
const activeRoom = document.getElementById('activeRoom');
const viewMode = document.getElementById('viewMode');
const featureList = document.getElementById('featureList');
const quickActions = document.getElementById('quickActions');
const floatingPanel = document.getElementById('floatingPanel');
const floatingTitle = document.getElementById('floatingTitle');
const floatingDescription = document.getElementById('floatingDescription');
const floatingActions = document.getElementById('floatingActions');
const resetViewBtn = document.getElementById('resetViewBtn');
const closeFloating = document.getElementById('closeFloating');
const sceneContainer = document.getElementById('sceneContainer');

function renderRoomCards() {
  const keys = ['classroom', 'lab', 'library', 'hall'];
  roomList.innerHTML = keys.map((key, idx) => {
    const room = roomData[key];
    return `
      <article class="room-item">
        <div class="room-top">
          <span class="room-tag">0${idx + 1}</span>
          <span class="room-tag">${room.type}</span>
        </div>
        <h3>${room.name}</h3>
        <p>${room.subtitle}</p>
        <div class="room-actions">
          <button class="btn btn-primary" data-room="${key}" data-mode="enter">Кіру</button>
          <button class="btn btn-outline" data-room="${key}" data-mode="info">Ақпарат</button>
        </div>
      </article>
    `;
  }).join('');

  roomList.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', () => {
      const room = button.dataset.room;
      const mode = button.dataset.mode;
      if (mode === 'enter') {
        enterRoom(room);
      } else {
        openFloating(room);
      }
    });
  });
}

function updateClock() {
  const now = new Date();
  liveClock.textContent = now.toLocaleTimeString('kk-KZ', { hour12: false });
}
updateClock();
setInterval(updateClock, 1000);

quoteText.textContent = quotes[Math.floor(Math.random() * quotes.length)];
renderRoomCards();

function updateInfoPanel(key, mode = 'Explorer') {
  const room = roomData[key];
  infoTitle.textContent = room.name;
  infoSubtitle.textContent = room.subtitle;
  activeRoom.textContent = room.name;
  viewMode.textContent = mode;
  featureList.innerHTML = room.features.map(item => `<li>${item}</li>`).join('');
  quickActions.innerHTML = room.actions.map(item => `<span class="action-chip">${item}</span>`).join('');
}

function openFloating(key) {
  const room = roomData[key];
  floatingTitle.textContent = room.name;
  floatingDescription.textContent = room.description;
  floatingActions.innerHTML = `
    <button class="btn btn-primary" data-action="enter-room" data-room="${key}">Кіру</button>
    <button class="btn btn-outline" data-action="close-panel">Жабу</button>
  `;
  floatingPanel.classList.remove('hidden');
  floatingActions.querySelector('[data-action="enter-room"]').addEventListener('click', () => enterRoom(key));
  floatingActions.querySelector('[data-action="close-panel"]').addEventListener('click', () => floatingPanel.classList.add('hidden'));
  updateInfoPanel(key, 'Preview');
}

closeFloating.addEventListener('click', () => floatingPanel.classList.add('hidden'));
resetViewBtn.addEventListener('click', () => enterRoom('campus'));
updateInfoPanel('campus', 'Explorer');

// THREE.JS SCENE
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xdffcff);
scene.fog = new THREE.FogExp2(0xe7feff, 0.012);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(sceneContainer.clientWidth, sceneContainer.clientHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
sceneContainer.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(58, sceneContainer.clientWidth / sceneContainer.clientHeight, 0.1, 300);
camera.position.set(20, 18, 22);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 8;
controls.maxDistance = 50;
controls.target.set(0, 3, 0);
controls.maxPolarAngle = Math.PI / 2.05;

const ambient = new THREE.AmbientLight(0xffffff, 1.55);
scene.add(ambient);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.7);
dirLight.position.set(14, 22, 10);
scene.add(dirLight);

const cyanLight = new THREE.PointLight(0x7efcff, 30, 80, 2);
cyanLight.position.set(-10, 8, 10);
scene.add(cyanLight);

const greenLight = new THREE.PointLight(0x76ffb5, 20, 80, 2);
greenLight.position.set(12, 10, -8);
scene.add(greenLight);

function neonMaterial(color, emissiveIntensity = 0.7, transparent = false, opacity = 1) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity,
    metalness: 0.15,
    roughness: 0.28,
    transparent,
    opacity
  });
}

const campus = new THREE.Group();
scene.add(campus);

const ground = new THREE.Mesh(
  new THREE.CylinderGeometry(20, 22, 1.6, 64),
  new THREE.MeshPhysicalMaterial({
    color: 0xf0ffff,
    metalness: 0.1,
    roughness: 0.4,
    transparent: true,
    opacity: 0.95,
    transmission: 0.05,
    thickness: 0.8
  })
);
ground.position.y = -0.8;
campus.add(ground);

const groundRing = new THREE.Mesh(
  new THREE.TorusGeometry(16.5, 0.24, 16, 100),
  neonMaterial(0x00e5ff, 0.9)
);
groundRing.rotation.x = Math.PI / 2;
groundRing.position.y = 0.05;
campus.add(groundRing);

const pathMat = new THREE.MeshStandardMaterial({ color: 0xe6faff, emissive: 0xb8ffff, emissiveIntensity: 0.18, roughness: 0.25 });
function addPath(x, z, w, d) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, 0.12, d), pathMat);
  mesh.position.set(x, 0.08, z);
  campus.add(mesh);
}
addPath(0, 0, 18, 2.2);
addPath(0, 0, 2.2, 18);

function createTree(x, z) {
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 1.4, 12), new THREE.MeshStandardMaterial({ color: 0x9f8c74 }));
  trunk.position.set(x, 0.7, z);
  const crown = new THREE.Mesh(new THREE.SphereGeometry(0.85, 18, 18), neonMaterial(0x74ffb4, 0.28));
  crown.position.set(x, 1.8, z);
  campus.add(trunk, crown);
}
[[-8, -8], [8, -8], [8, 8], [-8, 8], [-10, 4], [10, -2]].forEach(([x, z]) => createTree(x, z));

function addWindowStrip(group, width, floors, side = 1) {
  const spacing = width / 5;
  for (let f = 0; f < floors; f++) {
    for (let i = -2; i <= 2; i++) {
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.45, 0.08), neonMaterial(0x00e5ff, 1.5));
      win.position.set(i * spacing * 0.72, 1.1 + f * 0.95, side * 1.52);
      group.add(win);
    }
  }
}

const interactive = [];
const buildingMap = new Map();

function buildClassroom() {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(6, 3.8, 4), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.25, transmission: 0.15, transparent: true, opacity: 0.8 }));
  group.add(body);
  addWindowStrip(group, 6, 2, 1);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.25, 4.4), neonMaterial(0x6d7cff, 0.6, true, 0.88));
  roof.position.y = 2.15;
  group.add(roof);

  const board = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.1, 0.08), neonMaterial(0x74ffb4, 1.2));
  board.position.set(0, 1.4, -1.76);
  group.add(board);

  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 3; c++) {
      const desk = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.32, 0.55), new THREE.MeshStandardMaterial({ color: 0xfafcff, emissive: 0x93fff1, emissiveIntensity: 0.14 }));
      desk.position.set(-1.7 + c * 1.65, 0.55, -0.45 + r * 1.2);
      group.add(desk);
    }
  }

  group.position.set(-8, 1.9, 0);
  group.userData.key = 'classroom';
  interactive.push(body);
  buildingMap.set(body.uuid, group);
  campus.add(group);
  return group;
}

function buildLab() {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(5.8, 4, 4.8), new THREE.MeshPhysicalMaterial({ color: 0xfdffff, roughness: 0.22, transmission: 0.16, transparent: true, opacity: 0.82 }));
  group.add(body);
  addWindowStrip(group, 5.8, 2, 1);
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 3.8, 24), neonMaterial(0x00e5ff, 0.85, true, 0.88));
  tower.position.set(2.45, 1.9, -1.3);
  group.add(tower);

  for (let i = 0; i < 3; i++) {
    const bench = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.35, 0.7), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x7efcff, emissiveIntensity: 0.18 }));
    bench.position.set(-1.8 + i * 1.8, 0.62, 0.6);
    group.add(bench);

    const flask = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.24, 0.5, 18), neonMaterial(0x74ffb4, 1.7, true, 0.92));
    flask.position.set(-1.8 + i * 1.8, 1.06, 0.6);
    group.add(flask);
  }

  group.position.set(8, 2, 0);
  group.userData.key = 'lab';
  interactive.push(body);
  buildingMap.set(body.uuid, group);
  campus.add(group);
  return group;
}

function buildLibrary() {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(5.4, 3.6, 4.4), new THREE.MeshPhysicalMaterial({ color: 0xfeffff, roughness: 0.25, transmission: 0.12, transparent: true, opacity: 0.85 }));
  group.add(body);
  addWindowStrip(group, 5.4, 2, 1);
  const roof = new THREE.Mesh(new THREE.ConeGeometry(3.7, 1.2, 4), neonMaterial(0x74ffb4, 0.75, true, 0.84));
  roof.position.y = 2.35;
  roof.rotation.y = Math.PI / 4;
  group.add(roof);

  for (let i = 0; i < 3; i++) {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(1, 1.8, 0.35), new THREE.MeshStandardMaterial({ color: 0xfbffff, emissive: 0x72ffe6, emissiveIntensity: 0.12 }));
    shelf.position.set(-1.7 + i * 1.7, 1, -1.25);
    group.add(shelf);
  }
  const table = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.15, 24), neonMaterial(0x00e5ff, 0.75, true, 0.82));
  table.position.set(0, 0.85, 0.75);
  group.add(table);

  group.position.set(0, 1.8, -8);
  group.userData.key = 'library';
  interactive.push(body);
  buildingMap.set(body.uuid, group);
  campus.add(group);
  return group;
}

function buildHall() {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(6.8, 3.9, 4.8), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.23, transmission: 0.15, transparent: true, opacity: 0.82 }));
  group.add(body);
  addWindowStrip(group, 6.8, 2, 1);
  const stage = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.45, 1.3), neonMaterial(0x6d7cff, 1.1));
  stage.position.set(0, 0.35, -1.35);
  group.add(stage);
  for (let i = 0; i < 8; i++) {
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.42), neonMaterial(0x74ffb4, 0.4, true, 0.9));
    seat.position.set(-1.6 + (i % 4) * 1.05, 0.42, 0.45 + Math.floor(i / 4) * 0.9);
    group.add(seat);
  }

  group.position.set(0, 1.95, 8);
  group.userData.key = 'hall';
  interactive.push(body);
  buildingMap.set(body.uuid, group);
  campus.add(group);
  return group;
}

const roomGroups = {
  classroom: buildClassroom(),
  lab: buildLab(),
  library: buildLibrary(),
  hall: buildHall()
};

function addLabel(text, position) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(255,255,255,0.0)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.font = '700 42px Inter';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#0f4469';
  ctx.fillText(text, canvas.width / 2, 64);
  ctx.strokeStyle = '#00dfff';
  ctx.lineWidth = 2.5;
  ctx.strokeText(text, canvas.width / 2, 64);
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.position.copy(position);
  sprite.scale.set(4.5, 1.15, 1);
  campus.add(sprite);
}
addLabel('Smart Classroom', new THREE.Vector3(-8, 5.1, 0));
addLabel('STEM / AI Lab', new THREE.Vector3(8, 5.2, 0));
addLabel('Library', new THREE.Vector3(0, 4.9, -8));
addLabel('Event Hall', new THREE.Vector3(0, 5.15, 8));

// Decorative rings and particles
const rings = [];
for (let i = 0; i < 3; i++) {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(2.5 + i * 1.3, 0.03, 8, 80),
    neonMaterial(i % 2 === 0 ? 0x00e5ff : 0x74ffb4, 1.1, true, 0.75)
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.28 + i * 0.3;
  campus.add(ring);
  rings.push(ring);
}

const particlesGeometry = new THREE.BufferGeometry();
const particleCount = 650;
const positions = new Float32Array(particleCount * 3);
for (let i = 0; i < particleCount; i++) {
  positions[i * 3] = (Math.random() - 0.5) * 70;
  positions[i * 3 + 1] = Math.random() * 30;
  positions[i * 3 + 2] = (Math.random() - 0.5) * 70;
}
particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
const particlesMaterial = new THREE.PointsMaterial({
  color: 0x5ef2ff,
  size: 0.18,
  transparent: true,
  opacity: 0.65,
  depthWrite: false
});
const particles = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particles);

const hoverGlow = new THREE.Mesh(
  new THREE.RingGeometry(0.9, 1.3, 40),
  neonMaterial(0x00e5ff, 1.5, true, 0.85)
);
hoverGlow.rotation.x = -Math.PI / 2;
hoverGlow.position.y = 0.12;
hoverGlow.visible = false;
campus.add(hoverGlow);

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hovered = null;
let currentRoom = 'campus';
let currentFocus = new THREE.Vector3(0, 3, 0);

const cameraViews = {
  campus: { pos: new THREE.Vector3(20, 18, 22), target: new THREE.Vector3(0, 3, 0), mode: 'Explorer' },
  classroom: { pos: new THREE.Vector3(-8, 2.4, 5.2), target: new THREE.Vector3(-8, 1.8, 0), mode: 'Inside Room' },
  lab: { pos: new THREE.Vector3(8, 2.8, 5.8), target: new THREE.Vector3(8, 1.9, 0), mode: 'Inside Room' },
  library: { pos: new THREE.Vector3(0, 2.5, -3.2), target: new THREE.Vector3(0, 1.8, -8), mode: 'Inside Room' },
  hall: { pos: new THREE.Vector3(0, 2.8, 12.5), target: new THREE.Vector3(0, 1.8, 8), mode: 'Inside Room' }
};

let transition = null;
function startTransition(nextPos, nextTarget, mode, roomKey) {
  transition = {
    startPos: camera.position.clone(),
    endPos: nextPos.clone(),
    startTarget: controls.target.clone(),
    endTarget: nextTarget.clone(),
    start: performance.now(),
    duration: 1400,
    mode,
    roomKey
  };
}

function enterRoom(key) {
  const data = roomData[key];
  currentRoom = key;
  const view = cameraViews[key];
  startTransition(view.pos, view.target, view.mode, key);
  updateInfoPanel(key, view.mode);
  floatingPanel.classList.add('hidden');
}

window.enterRoom = enterRoom;

function onPointerMove(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function handleClick() {
  if (!hovered) return;
  const group = buildingMap.get(hovered.uuid);
  if (!group) return;
  const key = group.userData.key;
  openFloating(key);
}

renderer.domElement.addEventListener('pointermove', onPointerMove);
renderer.domElement.addEventListener('click', handleClick);

function updateHover() {
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(interactive, false);
  if (hits.length > 0) {
    const first = hits[0].object;
    hovered = first;
    renderer.domElement.style.cursor = 'pointer';
    const group = buildingMap.get(first.uuid);
    if (group) {
      hoverGlow.visible = true;
      hoverGlow.position.set(group.position.x, 0.11, group.position.z);
      hoverGlow.scale.set(1 + Math.sin(performance.now() * 0.006) * 0.08, 1, 1 + Math.sin(performance.now() * 0.006) * 0.08);
    }
  } else {
    hovered = null;
    renderer.domElement.style.cursor = 'grab';
    hoverGlow.visible = false;
  }
}

function animate() {
  requestAnimationFrame(animate);
  const t = performance.now() * 0.001;

  if (transition) {
    const elapsed = (performance.now() - transition.start) / transition.duration;
    const p = Math.min(elapsed, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    camera.position.lerpVectors(transition.startPos, transition.endPos, ease);
    controls.target.lerpVectors(transition.startTarget, transition.endTarget, ease);
    if (p >= 1) {
      currentFocus.copy(transition.endTarget);
      viewMode.textContent = transition.mode;
      transition = null;
    }
  }

  rings.forEach((ring, i) => {
    ring.rotation.z += 0.003 + i * 0.0015;
    ring.position.y = 0.2 + i * 0.28 + Math.sin(t * 1.4 + i) * 0.03;
  });

  roomGroups.classroom.rotation.y = Math.sin(t * 0.6) * 0.02;
  roomGroups.lab.rotation.y = Math.sin(t * 0.8 + 1.2) * 0.025;
  roomGroups.library.rotation.y = Math.sin(t * 0.5 + 2.4) * 0.02;
  roomGroups.hall.rotation.y = Math.sin(t * 0.7 + 0.5) * 0.02;

  cyanLight.position.x = Math.sin(t * 0.7) * 13;
  cyanLight.position.z = Math.cos(t * 0.4) * 10;
  greenLight.position.x = Math.cos(t * 0.6) * 11;
  greenLight.position.z = Math.sin(t * 0.5) * 9;

  particles.rotation.y += 0.0009;
  updateHover();
  controls.update();
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
  const w = sceneContainer.clientWidth;
  const h = sceneContainer.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
