import { Application, extensions } from 'pixi.js';
import spriteFrame from '../sprite-frame.cjs';

const { CELL, actionFrameIndex, horizontalFrameRect } = spriteFrame;
const DPR = Math.min(window.devicePixelRatio || 1, 2);
const BASE_ANIMATIONS = Object.freeze({
  idle: { row: 0, frames: 6, fps: 0, loop: true, variableTiming: true },
  'running-right': { row: 1, frames: 8, fps: 6.5, loop: true },
  'running-left': { row: 2, frames: 8, fps: 6.5, loop: true },
  waving: { row: 3, frames: 4, fps: 7, loop: false },
  jumping: { row: 4, frames: 5, fps: 8, loop: false },
  failed: { row: 5, frames: 8, fps: 4.5, loop: false },
  waiting: { row: 6, frames: 6, fps: 4.5, loop: false },
  running: { row: 7, frames: 6, fps: 5, loop: false },
  review: { row: 8, frames: 6, fps: 4.5, loop: false }
});
const STRIP_ACTIONS = Object.freeze({
  'glasses-wipe': { src: '../../resources/pets/aoyin/actions/glasses-wipe.webp', frames: 6, duration: 4700 },
  'edge-peek': { src: '../../resources/pets/aoyin/actions/edge-peek.webp', frames: 6, duration: 4300, holdLastMs: 5200 },
  'tail-groom': { src: '../../resources/pets/aoyin/actions/tail-groom.webp', frames: 6, duration: 5200 },
  'wolf-transform': { src: '../../resources/pets/aoyin/actions/wolf-transform.webp', frames: 8, duration: 5200 },
  'wolf-idle': { src: '../../resources/pets/aoyin/actions/wolf-idle.webp', frames: 8, duration: 9400, holdLastMs: 12000 }
});

const stage = document.querySelector('#stage');
const host = document.querySelector('#live2d-host');
const spriteCanvas = document.querySelector('#sprite-pet');
const spriteContext = spriteCanvas.getContext('2d', { alpha: true });
const bubble = document.querySelector('#bubble');
const sheet = new Image();
sheet.src = '../../resources/pets/aoyin/spritesheet.webp';

let renderer;
let state = 'idle';
let dragging = false;
let roaming = false;
let locked = false;
let autonomyEnabled = true;
let dragOffset = { x: 0, y: 0 };
let previousPointerX = 0;
let dragDistance = 0;
let suppressClick = false;
let bubbleTimer;
let edgeState = null;
let nextAmbientAt = Date.now() + randomBetween(55_000, 120_000);
let nextRoamAt = Date.now() + randomBetween(6 * 60_000, 12 * 60_000);
let nextGlassesAt = Date.now() + randomBetween(6 * 60_000, 14 * 60_000);
let nextWolfAt = Date.now() + randomBetween(18 * 60_000, 36 * 60_000);
let lastAmbient = null;
let lastSpeechAt = 0;

function randomBetween(min, max) { return Math.round(min + Math.random() * (max - min)); }
function pick(items) { return items[Math.floor(Math.random() * items.length)]; }

class SpriteRenderer {
  constructor() {
    this.frame = 0;
    this.lastFrameAt = performance.now();
    this.nextIdleFrameAt = performance.now() + randomBetween(8000, 18000);
    this.blinkStep = -1;
    this.action = null;
    this.actionStartedAt = 0;
    this.actionDone = null;
    this.images = new Map();
  }

  start() {
    stage.classList.add('sprite-mode');
    stage.classList.remove('live2d-mode');
    requestAnimationFrame((now) => this.draw(now));
  }

  setState(next) {
    if (!BASE_ANIMATIONS[next]) return;
    this.action = null;
    state = next;
    this.frame = 0;
    this.lastFrameAt = performance.now();
    if (next === 'idle') this.nextIdleFrameAt = performance.now() + randomBetween(8000, 18000);
  }

  async playAction(name, onDone) {
    const action = STRIP_ACTIONS[name];
    if (!action) return false;
    let image = this.images.get(name);
    if (!image) {
      image = new Image();
      image.src = action.src;
      await image.decode();
      this.images.set(name, image);
    }
    this.action = { name, ...action, image };
    this.actionStartedAt = performance.now();
    this.actionDone = onDone;
    return true;
  }

  stopAction() { this.action = null; this.actionDone = null; }

  draw(now) {
    let source = sheet;
    let sourceX = 0;
    let sourceY = 0;
    if (this.action) {
      const elapsed = now - this.actionStartedAt;
      const current = actionFrameIndex(elapsed, this.action.duration, this.action.frames);
      const rect = horizontalFrameRect(current);
      source = this.action.image;
      sourceX = rect.x;
      const keepEdgePose = edgeState && this.action.name === 'edge-peek';
      if (!keepEdgePose && elapsed >= this.action.duration + (this.action.holdLastMs || 0)) {
        const done = this.actionDone;
        this.action = null;
        this.actionDone = null;
        state = 'idle';
        done?.();
      }
    } else {
      const animation = BASE_ANIMATIONS[state];
      if (animation.variableTiming && now >= this.nextIdleFrameAt) {
        const sequence = [1, 2, 1, 0];
        this.blinkStep = (this.blinkStep + 1) % sequence.length;
        this.frame = sequence[this.blinkStep];
        this.nextIdleFrameAt = now + (this.frame === 0 ? randomBetween(8000, 18000) : 90);
      } else if (!animation.variableTiming && now - this.lastFrameAt >= 1000 / animation.fps) {
        this.frame += Math.floor((now - this.lastFrameAt) / (1000 / animation.fps));
        this.lastFrameAt = now;
        if (this.frame >= animation.frames) {
          if (animation.loop || dragging || roaming) this.frame %= animation.frames;
          else this.setState('idle');
        }
      }
      sourceX = this.frame * CELL.width;
      sourceY = animation.row * CELL.height;
    }
    spriteContext.clearRect(0, 0, spriteCanvas.width, spriteCanvas.height);
    if (source.complete && source.naturalWidth) {
      spriteContext.drawImage(source, sourceX, sourceY, CELL.width, CELL.height, 0, 0, spriteCanvas.width, spriteCanvas.height);
    }
    requestAnimationFrame((time) => this.draw(time));
  }
}

class CubismRenderer {
  constructor(app, model, manifest) {
    this.app = app;
    this.model = model;
    this.manifest = manifest;
    this.motionToken = 0;
  }

  static async create() {
    const manifestUrl = '../../resources/live2d/aoyin/pet.live2d.json';
    const response = await fetch(manifestUrl);
    if (!response.ok) throw new Error(`Live2D manifest unavailable (${response.status})`);
    const manifest = await response.json();
    await loadCubismCore(manifest.runtime || '../runtime/live2dcubismcore.min.js', manifestUrl);
    // The Cubism engine validates the proprietary Core at module evaluation
    // time. Import it only after Core is present so the sprite fallback remains usable.
    const { Live2DModel, Live2DPlugin } = await import('untitled-pixi-live2d-engine/cubism');
    extensions.add(Live2DPlugin);
    const app = new Application();
    await app.init({
      resizeTo: host,
      backgroundAlpha: 0,
      antialias: true,
      autoDensity: true,
      resolution: DPR,
      preference: 'webgl'
    });
    host.appendChild(app.canvas);
    const modelUrl = new URL(manifest.model, new URL(manifestUrl, window.location.href)).href;
    const model = await Live2DModel.from(modelUrl, { textureOptions: { lod: 'full' } });
    model.anchor.set(manifest.fit?.anchorX ?? 0.5, manifest.fit?.anchorY ?? 1);
    app.stage.addChild(model);
    const instance = new CubismRenderer(app, model, manifest);
    instance.fit();
    window.addEventListener('resize', () => instance.fit());
    stage.classList.add('live2d-mode');
    stage.classList.remove('sprite-mode');
    return instance;
  }

  fit() {
    const naturalWidth = Math.max(1, this.model.width / Math.max(this.model.scale.x, 0.0001));
    const naturalHeight = Math.max(1, this.model.height / Math.max(this.model.scale.y, 0.0001));
    const scale = Math.min(
      (this.app.screen.width * (this.manifest.fit?.widthRatio ?? 0.94)) / naturalWidth,
      (this.app.screen.height * (this.manifest.fit?.heightRatio ?? 0.98)) / naturalHeight
    );
    this.model.scale.set(scale);
    this.model.position.set(
      this.app.screen.width * (this.manifest.fit?.x ?? 0.5),
      this.app.screen.height * (this.manifest.fit?.y ?? 1)
    );
  }

  motionCandidates(name) { return this.manifest.motions?.[name] || []; }

  async setState(name) {
    state = name;
    const candidate = pick(this.motionCandidates(name));
    if (!candidate) return false;
    try {
      return await this.model.motion(candidate.group, candidate.index ?? 0, candidate.priority ?? 1);
    } catch (error) {
      console.warn(`[aoyin] Motion group unavailable for ${name}:`, error.message);
      return false;
    }
  }

  async playAction(name, onDone) {
    const candidate = pick(this.motionCandidates(name));
    if (!candidate) return false;
    const token = ++this.motionToken;
    try {
      if (candidate.holdLast) {
        return await this.model.motionLastFrame(candidate.group, candidate.index ?? 0, {
          expression: candidate.expression
        });
      }
      return await this.model.motion(candidate.group, candidate.index ?? 0, candidate.priority ?? 3, {
        expression: candidate.expression,
        loop: candidate.loop,
        onFinish: () => { if (token === this.motionToken) onDone?.(); }
      });
    } catch (error) {
      console.warn(`[aoyin] Custom motion unavailable for ${name}:`, error.message);
      return false;
    }
  }

  stopAction() {
    this.motionToken += 1;
    this.model.internalModel?.motionManager?.stopAllMotions();
  }
}

function loadCubismCore(relativePath, manifestUrl) {
  if (window.Live2DCubismCore) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = new URL(relativePath, new URL(manifestUrl, window.location.href)).href;
    script.onload = resolve;
    script.onerror = () => reject(new Error('Live2D Cubism Core is not installed'));
    document.head.appendChild(script);
  });
}

function setState(next) { renderer?.setState(next); }

async function playCustom(name, onDone) {
  if (dragging || roaming) return false;
  renderer?.stopAction();
  return renderer?.playAction(name, () => { if (!edgeState) setState('idle'); onDone?.(); });
}

function say(text, duration = 2600) {
  clearTimeout(bubbleTimer);
  bubble.textContent = text;
  bubble.classList.add('visible');
  bubbleTimer = setTimeout(() => bubble.classList.remove('visible'), duration);
  lastSpeechAt = Date.now();
}

function playWolfSequence() { playCustom('wolf-transform', () => playCustom('wolf-idle')); }

function ambientBehavior() {
  if (!autonomyEnabled || dragging || roaming || edgeState || state !== 'idle') return;
  let action;
  const now = Date.now();
  if (now >= nextGlassesAt) {
    action = 'glasses-wipe';
    nextGlassesAt = now + randomBetween(6 * 60_000, 14 * 60_000);
  } else if (now >= nextWolfAt) {
    action = 'wolf-transform';
    nextWolfAt = now + randomBetween(18 * 60_000, 36 * 60_000);
  } else {
    const choices = ['tail-groom', 'review', 'waiting', 'waving'].filter((item) => item !== lastAmbient);
    action = pick(choices);
  }
  lastAmbient = action;
  if (action === 'wolf-transform') playWolfSequence();
  else if (STRIP_ACTIONS[action]) playCustom(action);
  else setState(action);
  if (now - lastSpeechAt > 12 * 60_000 && Math.random() < 0.16) {
    say(pick(['别绷太紧。', '我在这边。', '水还热吗？']), 3000);
  }
  nextAmbientAt = now + randomBetween(55_000, 130_000);
}

stage.addEventListener('contextmenu', (event) => { event.preventDefault(); window.aoyinDesktop.contextMenu(); });
stage.addEventListener('pointerdown', (event) => {
  if (event.button !== 0 || locked) return;
  dragging = true;
  renderer?.stopAction();
  stage.classList.add('dragging');
  dragOffset = { x: event.screenX - window.screenX, y: event.screenY - window.screenY };
  previousPointerX = event.screenX;
  dragDistance = 0;
  stage.setPointerCapture(event.pointerId);
  window.aoyinDesktop.dragStart();
});
stage.addEventListener('pointermove', (event) => {
  if (!dragging || locked) return;
  const deltaX = event.screenX - previousPointerX;
  dragDistance += Math.abs(deltaX);
  if (Math.abs(deltaX) > 5) setState(deltaX > 0 ? 'running-right' : 'running-left');
  previousPointerX = event.screenX;
  window.aoyinDesktop.move({ x: event.screenX - dragOffset.x, y: event.screenY - dragOffset.y });
});
stage.addEventListener('pointerup', (event) => {
  if (!dragging) return;
  dragging = false;
  suppressClick = dragDistance > 8;
  stage.classList.remove('dragging');
  stage.releasePointerCapture(event.pointerId);
  setState('idle');
  window.aoyinDesktop.dragEnd();
});
stage.addEventListener('click', (event) => {
  if (dragging || suppressClick) { suppressClick = false; return; }
  const y = event.offsetY / stage.clientHeight;
  if (y < 0.44) {
    playCustom('head-pat').then((played) => { if (!played) setState('waving'); });
    if (Math.random() < 0.22) say(pick(['嗯。', '轻一点。', '耳朵别碰。']));
  } else {
    playCustom('body-poke').then((played) => { if (!played) setState('jumping'); });
    if (Math.random() < 0.18) say('抓不到。');
  }
});
stage.addEventListener('dblclick', () => playCustom('tail-groom'));

setInterval(() => {
  const now = Date.now();
  if (autonomyEnabled && now >= nextAmbientAt) ambientBehavior();
  if (autonomyEnabled && now >= nextRoamAt && !dragging && !roaming && !edgeState && state === 'idle') {
    window.aoyinDesktop.requestRoam();
    nextRoamAt = now + randomBetween(6 * 60_000, 12 * 60_000);
  }
}, 1000);

window.aoyinDesktop.onPlay(({ state: next }) => setState(next));
window.aoyinDesktop.onCustom(({ name }) => name === 'wolf-sequence' ? playWolfSequence() : playCustom(name));
window.aoyinDesktop.onBubble(({ text, duration }) => say(text, duration));
window.aoyinDesktop.onLock((value) => { locked = value; });
window.aoyinDesktop.onAutonomy((value) => { autonomyEnabled = value; });
window.aoyinDesktop.onEnvironment(({ edge, reason }) => {
  if (edge && edge !== edgeState && ['drop', 'roam', 'scale', 'launch'].includes(reason)) {
    edgeState = edge;
    playCustom(`edge-${edge}`).then((played) => { if (!played) playCustom('edge-peek'); });
  } else if (!edge && edgeState) {
    edgeState = null;
    setState('idle');
  }
});
window.aoyinDesktop.onRoamStart(({ direction }) => { roaming = true; setState(direction > 0 ? 'running-right' : 'running-left'); });
window.aoyinDesktop.onRoamEnd(() => { roaming = false; setState('idle'); });

(async () => {
  try {
    renderer = await CubismRenderer.create();
    await renderer.setState('idle');
  } catch (error) {
    console.info('[aoyin] Live2D unavailable; using stable sprite fallback:', error.message);
    renderer = new SpriteRenderer();
    renderer.start();
  }
})();
