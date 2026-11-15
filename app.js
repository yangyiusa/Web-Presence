const $ = (selector) => document.querySelector(selector);
const hero = $('#hero');
const paper = $('#paper');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let engine;
let reading = false;
let transitionTimer;

function showPaper() {
  if (reading) return;
  reading = true;
  clearTimeout(transitionTimer);
  hero.inert = true;
  paper.hidden = false;
  paper.inert = false;
  engine?.transition(true);
  transitionTimer = setTimeout(() => {
    paper.classList.add('visible');
    $('#paper-title').focus({ preventScroll: true });
    if (!engine) hero.hidden = true;
  }, engine ? 280 : 0);
}

function showHero() {
  if (!reading) return;
  reading = false;
  clearTimeout(transitionTimer);
  hero.hidden = false;
  paper.classList.remove('visible');
  paper.inert = true;
  engine?.transition(false);
  transitionTimer = setTimeout(() => {
    paper.hidden = true;
    hero.inert = false;
    $('[data-action="paper"]').focus({ preventScroll: true });
  }, engine ? 900 : 0);
}

document.querySelectorAll('[data-action]').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    showPaper();
  });
});
$('.brand').addEventListener('click', (event) => { event.preventDefault(); showHero(); });
$('#back').addEventListener('click', showHero);
window.addEventListener('keydown', (event) => { if (event.key === 'Escape') showHero(); });

function fallback(error) {
  if (error) console.warn('ShelfWise: using the static glass view.', error);
  document.body.classList.remove('webgl');
  $('#navigation').style.transform = '';
  $('#panel').style.transform = '';
  hero.style.opacity = '';
  $('#back').style.color = '';
  hero.inert = reading;
  if (reading) hero.hidden = true;
  engine = undefined;
}

if (!reducedMotion.matches) {
  try {
    const [THREE, { RoomEnvironment }] = await Promise.all([
      import('three'), import('three/addons/environments/RoomEnvironment.js'), document.fonts.ready,
    ]);
    engine = createGlass(THREE, RoomEnvironment);
  } catch (error) { fallback(error); }
}

function createGlass(T, RoomEnvironment) {
  const renderer = new T.WebGLRenderer({ canvas: $('#glass'), antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor('#050507');
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(30, innerWidth / innerHeight, 10, 15000);
  const pmrem = new T.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, .04);
  scene.environment = environment.texture;
  scene.environmentIntensity = .42;
  room.dispose();
  pmrem.dispose();
  const key = new T.DirectionalLight('#e4e8ff', 2.7);
  key.position.set(-800, 1000, 1200);
  scene.add(key);
  const fill = new T.DirectionalLight('#a6a0bb', .3);
  fill.position.set(900, -400, 600);
  scene.add(fill);
  const slab = new T.Group();
  scene.add(slab);
  const raycaster = new T.Raycaster();
  const pointer = new T.Vector2(5, 5);
  const pointerWorld = new T.Vector3(1e5, 1e5, 0);
  const pointerLocal = new T.Vector3();
  const plane = new T.Plane(new T.Vector3(0, 0, 1), 0);
  const glow = { value: 0 };
  const glowRadius = { value: 300 };
  let inside = false;
  let width, height, blockWidth, blockHeight, navHeight, panelHeight, panelTop, scale, depth, portrait;
  let hovered = null;
  let lastTime = performance.now();
  let lastGeometry = -1;
  let dirtyPrint = true;
  let materialIridescence = .55;
  let phase = 'enter';
  let phaseStart = performance.now() / 1000;
  let pointerElement = null;
  let disposed = false;
  let frame;
  const textureRecords = new Map();
  const originalColors = new Map([...document.querySelectorAll('[data-print], .description')].map((el) => [el, getComputedStyle(el).color]));
  const parts = [];
  const corners = [[0, 0], [1, 0], [1, 1], [0, 1]];
  const cellNames = [['TL', 'tAB', 'J0', 'bAD', 'BL'], ['tAB', 'tBC', 'J1', 'J0'], ['tBC', 'tCE', 'J2', 'J1'], ['J0', 'J1', 'J2', 'bDE', 'bAD'], ['tCE', 'TR', 'BR', 'bDE', 'J2']];
  const basePoints = { TL: [0, 0], TR: [1, 0], BR: [1, 1], BL: [0, 1], tAB: [.22, 0], tBC: [.515, 0], tCE: [.84, 0], bAD: [.34, 1], bDE: [.865, 1], J0: [.385, .72], J1: [.48, .62], J2: [.716, .49] };
  const seeds = Object.fromEntries(Object.keys(basePoints).map((name, i) => [name, { phase: i * 2.399, period: 10 + (i * 3.17) % 10 }]));

  function glassMaterial(glowing = true) {
    const material = new T.MeshPhysicalMaterial({
      color: '#17171b', roughness: .36, metalness: 0, clearcoat: .7,
      clearcoatRoughness: .12, specularIntensity: .7, iridescence: glowing ? .55 : .35,
      iridescenceIOR: 1.3, iridescenceThicknessRange: [250, 650], envMapIntensity: 1,
    });
    if (glowing) {
      material.onBeforeCompile = (shader) => {
        shader.uniforms.uPointer = { value: pointerWorld };
        shader.uniforms.uGlow = glow;
        shader.uniforms.uRadius = glowRadius;
        shader.vertexShader = 'varying vec3 vFacetWorld;\n' + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvFacetWorld = (modelMatrix * vec4(position, 1.0)).xyz;');
        shader.fragmentShader = 'varying vec3 vFacetWorld;\nuniform vec3 uPointer;\nuniform float uGlow;\nuniform float uRadius;\n' + shader.fragmentShader;
        shader.fragmentShader = shader.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\nfloat facetD = length(vFacetWorld.xy - uPointer.xy) / uRadius;\ntotalEmissiveRadiance += vec3(.42,.37,.62) * .16 * exp(-1.6 * facetD * facetD) * uGlow;');
      };
      material.customProgramCacheKey = () => 'facet-cursor-emission-v1';
    }
    return material;
  }

  function printTexture(root) {
    const canvas = document.createElement('canvas');
    const texture = new T.CanvasTexture(canvas);
    texture.colorSpace = T.SRGBColorSpace;
    texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
    texture.generateMipmaps = false;
    texture.minFilter = T.LinearFilter;
    const record = { root, canvas, texture };
    textureRecords.set(root, record);
    return record;
  }
  const panelPrint = printTexture($('#panel'));
  const navPrint = printTexture($('#navigation'));
  const printMaterial = (texture) => new T.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false, side: T.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });

  function makePart(index) {
    const group = new T.Group();
    const material = glassMaterial();
    const mesh = new T.Mesh(new T.BufferGeometry(), material);
    const print = new T.Mesh(new T.BufferGeometry(), printMaterial(index === 0 ? navPrint.texture : panelPrint.texture));
    const rim = new T.LineLoop(new T.BufferGeometry(), new T.LineBasicMaterial({ color: '#88878f', transparent: true, opacity: .30 }));
    group.add(mesh, print, rim);
    slab.add(group);
    const axis = new T.Vector3(Math.sin(index * 3.7 + .6), Math.cos(index * 1.9), .25).normalize();
    const part = { index, group, mesh, print, rim, material, center: new T.Vector2(), lift: 0, velocity: 0, tip: new T.Vector2(), hover: 0, axis, tumble: 2 + index * .31, flight: new T.Vector3(), progress: 1 };
    mesh.userData.part = part;
    parts.push(part);
    return part;
  }
  for (let i = 0; i < 6; i++) makePart(i);

  const backGroup = new T.Group();
  const backGlass = new T.Mesh(new T.BufferGeometry(), glassMaterial(false));
  const backRim = new T.LineLoop(new T.BufferGeometry(), new T.LineBasicMaterial({ color: '#a3a0b0', transparent: true, opacity: .48 }));
  const backCanvas = document.createElement('canvas');
  const backTexture = new T.CanvasTexture(backCanvas);
  backTexture.colorSpace = T.SRGBColorSpace;
  const backPrint = new T.Mesh(new T.BufferGeometry(), printMaterial(backTexture));
  backGroup.add(backGlass, backRim, backPrint);
  backGroup.scale.setScalar(.0001);
  scene.add(backGroup);
  let backCenter = new T.Vector2();
  let backHover = 0;
  let backVisible = 0;

  // Convex polygon offsets keep a constant black seam even at acute junctions.
  function insetPolygon(points, distance) {
    const area = points.reduce((sum, a, i) => { const b = points[(i + 1) % points.length]; return sum + a.x * b.y - b.x * a.y; }, 0);
    const sign = Math.sign(area);
    return points.map((p, i) => {
      const prev = points[(i + points.length - 1) % points.length];
      const next = points[(i + 1) % points.length];
      const a = p.clone().sub(prev).normalize();
      const b = next.clone().sub(p).normalize();
      const n1 = new T.Vector2(-a.y, a.x).multiplyScalar(sign);
      const n2 = new T.Vector2(-b.y, b.x).multiplyScalar(sign);
      return p.clone().addScaledVector(n1.add(n2), distance / Math.max(.04, 1 + a.dot(b)));
    });
  }

  function roundedShape(points, radius) {
    const shape = new T.Shape();
    const rounded = points.map((p, i) => {
      const prev = points[(i + points.length - 1) % points.length];
      const next = points[(i + 1) % points.length];
      const a = prev.clone().sub(p); const b = next.clone().sub(p);
      const angle = Math.acos(T.MathUtils.clamp(a.clone().normalize().dot(b.clone().normalize()), -1, 1));
      const offset = Math.min(radius / Math.tan(angle / 2), a.length() * .25, b.length() * .25);
      return { p, entry: p.clone().add(a.normalize().multiplyScalar(offset)), exit: p.clone().add(b.normalize().multiplyScalar(offset)) };
    });
    shape.moveTo(rounded[0].entry.x, rounded[0].entry.y);
    for (const corner of rounded) {
      shape.lineTo(corner.entry.x, corner.entry.y);
      shape.quadraticCurveTo(corner.p.x, corner.p.y, corner.exit.x, corner.exit.y);
    }
    shape.closePath();
    return shape;
  }

  function replaceGeometry(mesh, geometry) { mesh.geometry.dispose(); mesh.geometry = geometry; }

  function updatePartGeometry(part, points, rootHeight) {
    const inset = insetPolygon(points, 7 * scale + 2.6 * scale);
    const local = inset.map((p) => new T.Vector2(p.x - part.center.x, -(p.y - part.center.y)));
    const shape = roundedShape(local, 20 * scale);
    const top = depth + 2.6 * scale;
    replaceGeometry(part.mesh, new T.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: 2.6 * scale, bevelSize: 2.6 * scale, bevelSegments: 3, steps: 1, curveSegments: 5 }));
    const surface = new T.ShapeGeometry(shape, 5);
    const position = surface.attributes.position;
    const uv = surface.attributes.uv;
    for (let i = 0; i < position.count; i++) {
      uv.setXY(i, (position.getX(i) + part.center.x) / blockWidth, 1 - (part.center.y - position.getY(i)) / rootHeight);
    }
    surface.translate(0, 0, top + .8);
    replaceGeometry(part.print, surface);
    replaceGeometry(part.rim, new T.BufferGeometry().setFromPoints(shape.getPoints(5).map((p) => new T.Vector3(p.x, p.y, top + .05))));
  }

  function livePoints(time) {
    const px = pointerLocal.x / blockWidth + .5;
    const py = (blockHeight / 2 - panelTop - pointerLocal.y) / panelHeight;
    const result = {};
    for (const [name, base] of Object.entries(basePoints)) {
      let [x, y] = base;
      const seed = seeds[name];
      const fixedCorner = ['TL', 'TR', 'BR', 'BL'].includes(name);
      if (!fixedCorner) {
        x += .03 * Math.sin(time * Math.PI * 2 / seed.period + seed.phase);
        if (name[0] === 'J') y += .05 * Math.sin(time * Math.PI * 2 / (seed.period + 2) + seed.phase * .8);
      }
      if (portrait) [x, y] = [y, x];
      if (inside && !reading && !fixedCorner) {
        const dx = x - px, dy = y - py, d = Math.hypot(dx, dy);
        const push = .05 * Math.pow(Math.max(0, 1 - d / .6), 2) * glow.value;
        const shiftX = dx / Math.max(d, .001) * push;
        const shiftY = dy / Math.max(d, .001) * push;
        if (base[0] !== 0 && base[0] !== 1 && (!portrait || name[0] === 'J')) x += shiftX;
        if (name[0] === 'J' || portrait) y += shiftY;
      }
      result[name] = new T.Vector2(x * blockWidth, y * panelHeight);
    }
    return result;
  }

  function rebuild(time) {
    const points = livePoints(time);
    for (let i = 1; i < parts.length; i++) updatePartGeometry(parts[i], cellNames[i - 1].map((name) => points[name]), panelHeight);
  }

  function localOffset(el, root) {
    let x = 0, y = 0, item = el;
    while (item && item !== root) {
      x += item.offsetLeft; y += item.offsetTop;
      if (item.classList.contains('nav-links')) x -= item.offsetWidth / 2;
      item = item.offsetParent;
    }
    return { x, y };
  }

  function linkUnderPointer() {
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(parts.filter((part) => part.group.visible).map((part) => part.print), false)[0];
    if (!hit?.uv) return null;
    const nav = hit.object === parts[0].print;
    const root = nav ? $('#navigation') : $('#panel');
    const x = hit.uv.x * blockWidth;
    const y = (1 - hit.uv.y) * (nav ? navHeight : panelHeight);
    return [...root.querySelectorAll('a')].find((link) => {
      const offset = localOffset(link, root);
      return x >= offset.x && x <= offset.x + link.offsetWidth && y >= offset.y && y <= offset.y + link.offsetHeight;
    }) ?? null;
  }

  function drawText(ctx, text, el, x, y, color) {
    const style = getComputedStyle(el);
    const size = parseFloat(style.fontSize);
    const lineHeight = parseFloat(style.lineHeight) || size * 1.2;
    ctx.font = `${style.fontWeight} ${size}px Inter`;
    ctx.letterSpacing = style.letterSpacing === 'normal' ? '0px' : style.letterSpacing;
    ctx.fillStyle = color;
    ctx.fillText(text, x + (parseFloat(style.paddingLeft) || 0), y + (parseFloat(style.paddingTop) || 0) + (lineHeight - size) / 2 + size * .79);
  }

  function drawPrint(record, w, h) {
    const { canvas, root, texture } = record;
    const dpr = Math.max(1.5, Math.min(devicePixelRatio, 2));
    const cw = Math.ceil(w * dpr), ch = Math.ceil(h * dpr);
    if (canvas.width !== cw || canvas.height !== ch) {
      canvas.width = cw; canvas.height = ch;
      // WebGL texture storage must be reallocated when a canvas changes size.
      texture.dispose();
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    for (const el of root.querySelectorAll('[data-print]')) {
      if (el.closest('.description')) continue;
      const { x, y } = localOffset(el, root);
      let color = originalColors.get(el);
      if (el.parentElement.tagName === 'H1') {
        const gradient = ctx.createLinearGradient(0, y, 0, y + el.offsetHeight);
        gradient.addColorStop(0, '#dcdce0'); gradient.addColorStop(1, '#bdbdc3'); color = gradient;
      }
      const hot = el === pointerElement || el === document.activeElement;
      if (el.classList.contains('studio-button')) {
        ctx.fillStyle = hot ? '#36d67e' : '#dcdce0';
        ctx.beginPath(); ctx.roundRect(x, y, el.offsetWidth, el.offsetHeight, portrait ? 5 : 6 * scale); ctx.fill();
        const style = getComputedStyle(el);
        ctx.font = `${style.fontWeight} ${style.fontSize} Inter`;
        ctx.letterSpacing = '0px';
        const tx = x + (el.offsetWidth - ctx.measureText(el.textContent).width) / 2;
        const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.2;
        const ty = y + (el.offsetHeight - lineHeight) / 2;
        drawText(ctx, el.textContent, el, tx, ty, '#19191c');
      } else {
        if (hot && el.tagName === 'A') color = '#f2f2f6';
        drawText(ctx, el.textContent, el, x, y, color);
        if (hot && el.classList.contains('paper-link')) {
          ctx.fillStyle = '#b8b8c0'; ctx.fillRect(x, y + el.offsetHeight - 8, el.offsetWidth, .7);
        }
      }
    }
    if (root.id === 'panel') {
      const el = $('.description');
      const { x, y } = localOffset(el, root);
      const style = getComputedStyle(el);
      ctx.font = `${style.fontWeight} ${style.fontSize} Inter`; ctx.letterSpacing = '0px';
      const lines = [];
      if (!portrait) lines.push(...[...el.children].map((span) => span.textContent));
      else {
        let line = '';
        for (const word of [...el.children].map((span) => span.textContent).join(' ').split(/\s+/)) {
          const next = line ? `${line} ${word}` : word;
          if (ctx.measureText(next).width > el.clientWidth && line) { lines.push(line); line = word; } else line = next;
        }
        if (line) lines.push(line);
      }
      lines.forEach((line, i) => drawText(ctx, line, el, x, y + i * parseFloat(style.lineHeight), originalColors.get(el)));
    } else {
      const mark = $('.brand-mark'); const { x, y } = localOffset(mark, root);
      ctx.fillStyle = '#dddde2'; ctx.beginPath(); ctx.roundRect(x, y, mark.offsetWidth, mark.offsetHeight, 1); ctx.fill();
      ctx.strokeStyle = '#17171c'; ctx.lineWidth = 1; ctx.beginPath();
      ctx.moveTo(x + mark.offsetWidth * .22, y + mark.offsetHeight * .36);
      ctx.lineTo(x + mark.offsetWidth * .78, y + mark.offsetHeight * .36);
      ctx.moveTo(x + mark.offsetWidth * .22, y + mark.offsetHeight * .65);
      ctx.lineTo(x + mark.offsetWidth * .78, y + mark.offsetHeight * .65); ctx.stroke();
    }
    texture.needsUpdate = true;
  }

  function buildBack() {
    const k = width / 1918;
    const coords = portrait ? [[.11,.243],[.37,.169],[.46,.277],[.12,.258]] : [[.147,.243],[.252,.169],[.287,.277],[.151,.258]];
    const points = coords.map(([x, y]) => new T.Vector2(x * width, y * height));
    const labelX = (portrait ? .26 : .219) * width, labelY = .238 * height;
    backCenter.set(labelX, labelY);
    const shape = roundedShape(points.map((p) => new T.Vector2(p.x - labelX, labelY - p.y)), Math.max(2, 4 * k));
    const thick = Math.max(3, 11 * k), bevel = Math.max(.8, 1.4 * k);
    replaceGeometry(backGlass, new T.ExtrudeGeometry(shape, { depth: thick, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 5 }));
    const z = thick + bevel + .2;
    replaceGeometry(backRim, new T.BufferGeometry().setFromPoints(shape.getPoints(5).map((p) => new T.Vector3(p.x,p.y,z))));
    const font = portrait ? 11 : width * .0066;
    backCanvas.width = Math.ceil(font * 14); backCanvas.height = Math.ceil(font * 5);
    backTexture.dispose();
    const geometry = new T.PlaneGeometry(backCanvas.width / 2, backCanvas.height / 2);
    geometry.translate(0, 0, z + .2); replaceGeometry(backPrint, geometry);
    backGroup.position.set(labelX - width / 2, height / 2 - labelY, 0);
    drawBack(false);
  }

  function drawBack(hot) {
    const ctx = backCanvas.getContext('2d');
    ctx.clearRect(0, 0, backCanvas.width, backCanvas.height);
    ctx.font = `500 ${(portrait ? 11 : width * .0066) * 2}px Inter`;
    ctx.fillStyle = hot ? '#b9abff' : '#ffffff';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('← Back', backCanvas.width / 2, backCanvas.height / 2);
    backTexture.needsUpdate = true;
  }

  function resize() {
    width = innerWidth; height = innerHeight; portrait = height > width;
    blockWidth = portrait ? width - 32 : width * .89;
    blockHeight = portrait ? height - 32 : height * .83;
    scale = blockWidth / 1730; depth = 13 * scale;
    navHeight = blockHeight * (portrait ? .09 : .108);
    panelTop = navHeight + 14; panelHeight = blockHeight - panelTop;
    const root = document.documentElement.style;
    root.setProperty('--s', scale);
    root.setProperty('--nav-h', `${navHeight}px`);
    root.setProperty('--panel-h', `${panelHeight}px`);
    root.setProperty('--panel-w', `${blockWidth}px`);
    if (!portrait) {
      root.setProperty('--inset', `${blockWidth * .056}px`);
      root.setProperty('--display', `${Math.min(blockWidth * .078, panelHeight * .2)}px`);
      root.setProperty('--copy', `${17 * scale}px`);
      root.setProperty('--small', `${11 * scale}px`);
    } else {
      root.setProperty('--inset', '26px'); root.setProperty('--display', `${Math.max(46, Math.min(80, width * .12))}px`);
      root.setProperty('--copy', '12px'); root.setProperty('--small', '8px');
    }
    camera.aspect = width / height;
    camera.position.z = height / (2 * Math.tan(T.MathUtils.degToRad(15)));
    camera.near = 10; camera.far = camera.position.z + 12000; camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    glowRadius.value = 300 * scale;
    parts.forEach((part, i) => {
      if (i === 0) part.center.set(blockWidth / 2, navHeight / 2);
      else {
        const points = cellNames[i - 1].map((name) => basePoints[name]).map(([x, y]) => new T.Vector2((portrait ? y : x) * blockWidth, (portrait ? x : y) * panelHeight));
        part.center.copy(points.reduce((sum, p) => sum.add(p), new T.Vector2()).divideScalar(points.length));
      }
      const cx = part.center.x / blockWidth - .5;
      part.flight.set((cx * 1500 + Math.sin(i * 4) * 220) * scale, -(260 + i * 47) * scale, (420 + i * 76) * scale);
    });
    updatePartGeometry(parts[0], corners.map(([x, y]) => new T.Vector2(x * blockWidth, y * navHeight)), navHeight);
    rebuild(performance.now() / 1000);
    buildBack(); dirtyPrint = true;
  }

  // Projective mapping from a DOM rectangle to the plane's four screen corners.
  function mapDOM(el, parent, x, y, w, h) {
    const q = corners.map(([u,v]) => {
      const point = new T.Vector3(x + u * w, y - v * h, depth + 2.6 * scale + .2);
      parent.localToWorld(point); point.project(camera);
      return { x: (point.x + 1) * width / 2, y: (1 - point.y) * height / 2 };
    });
    const [p0,p1,p2,p3] = q;
    const dx1=p1.x-p2.x, dx2=p3.x-p2.x, dx3=p0.x-p1.x+p2.x-p3.x;
    const dy1=p1.y-p2.y, dy2=p3.y-p2.y, dy3=p0.y-p1.y+p2.y-p3.y;
    const determinant=dx1*dy2-dx2*dy1;
    const g=(dx3*dy2-dx2*dy3)/determinant, hq=(dx1*dy3-dx3*dy1)/determinant;
    const a=p1.x-p0.x+g*p1.x, b=p3.x-p0.x+hq*p3.x;
    const d=p1.y-p0.y+g*p1.y, e=p3.y-p0.y+hq*p3.y;
    el.style.transform=`matrix3d(${a/w},${d/w},0,${g/w},${b/h},${e/h},0,${hq/h},0,0,1,0,${p0.x},${p0.y},0,1)`;
  }

  const easeOutBack = (t) => 1 + 2.70158 * Math.pow(t - 1, 3) + 1.70158 * Math.pow(t - 1, 2);
  function flightAmount(part, now) {
    const elapsed = now - phaseStart;
    if (phase === 'out') return Math.pow(T.MathUtils.clamp((elapsed - part.index * .025) / .72, 0, 1), 3);
    if (phase === 'in' || phase === 'enter') return 1 - easeOutBack(T.MathUtils.clamp((elapsed - part.index * .03) / .72, 0, 1));
    return phase === 'paper' ? 1 : 0;
  }

  function animate(timestamp) {
    if (disposed) return;
    frame = requestAnimationFrame(animate);
    const now = timestamp / 1000;
    const dt = Math.min((timestamp - lastTime) / 1000, 1 / 30); lastTime = timestamp;
    if (document.hidden) return;
    const smoothing = 1 - Math.exp(-dt / .3);
    const targetX = inside && !reading ? -pointer.y * -.096 + .014 : .014;
    const targetY = inside && !reading ? pointer.x * .122 - .021 : -.021;
    slab.rotation.x += (targetX - slab.rotation.x) * smoothing;
    slab.rotation.y += (targetY - slab.rotation.y) * smoothing;
    glow.value += ((inside && !reading ? 1 : 0) - glow.value) * (1 - Math.exp(-dt * 7));
    scene.updateMatrixWorld(true);
    raycaster.setFromCamera(pointer, camera);
    raycaster.ray.intersectPlane(plane, pointerWorld);
    pointerLocal.copy(pointerWorld); slab.worldToLocal(pointerLocal);
    if (!reading && phase === 'idle' && inside) {
      const hit = raycaster.intersectObjects(parts.map((part) => part.mesh), false)[0];
      hovered = hit?.object.userData.part ?? null;
    } else hovered = null;
    if ((phase === 'idle' || phase === 'enter' || phase === 'in') && now - lastGeometry > 1 / 45) { rebuild(now); lastGeometry = now; }
    for (const part of parts) {
      const hot = hovered === part;
      part.hover += ((hot ? 1 : 0) - part.hover) * (1 - Math.exp(-dt * 9));
      const liftTarget = hot ? (part.index === 0 ? 32 : 50) * scale : 0;
      part.velocity += (170 * (liftTarget - part.lift) - 19 * part.velocity) * dt;
      part.lift += part.velocity * dt;
      const centerY = blockHeight / 2 - (part.index === 0 ? 0 : panelTop) - part.center.y;
      const tipX = hot ? -T.MathUtils.clamp((pointerLocal.y - centerY) / (panelHeight * .35), -1, 1) * .24 : 0;
      const tipY = hot ? T.MathUtils.clamp((pointerLocal.x - (part.center.x - blockWidth / 2)) / (blockWidth * .25), -1, 1) * .24 : 0;
      part.tip.x += (tipX - part.tip.x) * (1 - Math.exp(-dt * 8));
      part.tip.y += (tipY - part.tip.y) * (1 - Math.exp(-dt * 8));
      part.material.iridescence = materialIridescence + (1 - materialIridescence) * part.hover;
      part.material.envMapIntensity = 1 + .9 * part.hover;
      const f = flightAmount(part, now); part.progress = f;
      part.group.position.set(part.center.x - blockWidth / 2, centerY, part.lift);
      part.group.position.addScaledVector(part.flight, f);
      part.group.position.y -= 460 * scale * f * f;
      const rotation = new T.Quaternion().setFromEuler(new T.Euler(part.tip.x, part.tip.y, 0));
      part.group.quaternion.setFromAxisAngle(part.axis, part.tumble * f).multiply(rotation);
      part.group.visible = f < .995;
    }
    if (phase === 'out' && now - phaseStart > .9) phase = 'paper';
    if ((phase === 'enter' || phase === 'in') && now - phaseStart > .92) { phase = 'idle'; hero.inert = false; }
    const backTarget = reading ? T.MathUtils.smoothstep(now - phaseStart, .3, .75) : 0;
    backVisible += (backTarget - backVisible) * (1 - Math.exp(-dt * 12));
    const backHot = reading && ($('#back').matches(':hover') || document.activeElement === $('#back'));
    const backHit = reading && inside ? raycaster.intersectObject(backGlass)[0] : null;
    const bh = backHot || !!backHit;
    if (Boolean(backHover > .5) !== bh) drawBack(bh);
    backHover += ((bh ? 1 : 0) - backHover) * (1 - Math.exp(-dt * 9));
    backGroup.scale.setScalar(Math.max(.0001, backVisible));
    backGroup.rotation.set(.08 + Math.sin(now * 1.1) * .03 + backHover * pointer.y * .14, -.16 + Math.sin(now * .9) * .04 + backHover * pointer.x * .14, 0);
    backGroup.visible = backVisible > .005;
    $('#back').style.color = 'transparent';
    scene.updateMatrixWorld(true);
    const nextLink = inside && !reading ? linkUnderPointer() : null;
    if (nextLink !== pointerElement) { pointerElement = nextLink; dirtyPrint = true; }
    document.body.style.cursor = nextLink ? 'pointer' : '';
    if (dirtyPrint) { drawPrint(panelPrint, blockWidth, panelHeight); drawPrint(navPrint, blockWidth, navHeight); dirtyPrint = false; }
    mapDOM($('#panel'), slab, -blockWidth / 2, blockHeight / 2 - panelTop, blockWidth, panelHeight);
    mapDOM($('#navigation'), parts[0].group, -blockWidth / 2, navHeight / 2, blockWidth, navHeight);
    hero.style.opacity = reading ? '0' : '1';
    renderer.render(scene, camera);
  }

  function onPointer(event) {
    pointer.set(event.clientX / width * 2 - 1, 1 - event.clientY / height * 2);
    inside = event.pointerType !== 'touch';
  }
  window.addEventListener('pointermove', onPointer, { passive: true });
  // UV hit testing keeps activation attached to ink on a lifted or tipped shard.
  document.addEventListener('click', (event) => {
    if (disposed || !event.isTrusted || event.detail === 0 || reading || phase !== 'idle') return;
    pointer.set(event.clientX / width * 2 - 1, 1 - event.clientY / height * 2);
    const link = linkUnderPointer();
    if (link || event.target.closest('#hero a')) {
      event.preventDefault(); event.stopImmediatePropagation();
      link?.click();
    }
  }, true);
  document.addEventListener('pointerleave', () => { inside = false; pointerElement = null; dirtyPrint = true; });
  window.addEventListener('blur', () => { inside = false; });
  document.addEventListener('focusin', () => { dirtyPrint = true; });
  document.addEventListener('focusout', () => { dirtyPrint = true; });
  window.addEventListener('resize', resize, { passive: true });
  $('#glass').addEventListener('webglcontextlost', (event) => {
    event.preventDefault(); disposed = true; cancelAnimationFrame(frame); fallback();
  });
  reducedMotion.addEventListener('change', (event) => {
    if (event.matches) { disposed = true; cancelAnimationFrame(frame); renderer.dispose(); fallback(); }
  });
  document.body.classList.add('webgl');
  resize();
  hero.inert = true;
  frame = requestAnimationFrame(animate);
  return {
    transition(out) { phase = out ? 'out' : 'in'; phaseStart = performance.now() / 1000; hovered = null; },
  };
}

if (location.hash === '#paper') showPaper();
