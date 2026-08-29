const CELL = { width: 192, height: 208 };
const animations = {
  idle: { row: 0, frames: 6, fps: 0, loop: true, variableTiming: true },
  'running-right': { row: 1, frames: 8, fps: 6.5, loop: true },
  'running-left': { row: 2, frames: 8, fps: 6.5, loop: true },
  waving: { row: 3, frames: 4, fps: 7, loop: false },
  jumping: { row: 4, frames: 5, fps: 8, loop: false },
  failed: { row: 5, frames: 8, fps: 4.5, loop: false },
  waiting: { row: 6, frames: 6, fps: 4.5, loop: false },
  running: { row: 7, frames: 6, fps: 5, loop: false },
  review: { row: 8, frames: 6, fps: 4.5, loop: false }
};

const customActions = {
  'glasses-wipe': { src: '../../resources/pets/aoyin/actions/glasses-wipe.webp', frames: 6, duration: 4700 },
  'edge-peek': { src: '../../resources/pets/aoyin/actions/edge-peek.webp', frames: 6, duration: 4300, holdLastMs: 5200 },
  'tail-groom': { src: '../../resources/pets/aoyin/actions/tail-groom.webp', frames: 6, duration: 5200 },
  'wolf-transform': { src: '../../resources/pets/aoyin/actions/wolf-transform.webp', frames: 8, duration: 5200 },
  'wolf-idle': { src: '../../resources/pets/aoyin/actions/wolf-idle.webp', frames: 8, duration: 9400, holdLastMs: 12_000 }
};

const canvas = document.querySelector('#pet');
const ctx = canvas.getContext('2d');
const stage = document.querySelector('#stage');
const bubble = document.querySelector('#bubble');
const actionPet = document.querySelector('#action-pet');
const sheet = new Image();
sheet.src = '../../resources/pets/aoyin/spritesheet.webp';

let state = 'idle';
let frame = 0;
let lastFrameAt = performance.now();
let nextIdleFrameAt = performance.now() + 6500;
let bubbleTimer;
let dragging = false;
let roaming = false;
let locked = false;
let autonomyEnabled = true;
let dragOffset = { x: 0, y: 0 };
let previousPointerX = 0;
let dragDistance = 0;
let suppressClick = false;
let actionTimer;
let actionFrameTimer;
let activeCustomAction = null;
let nextAmbientAt = Date.now() + randomBetween(45_000, 90_000);
let nextGlassesAt = Date.now() + randomBetween(5 * 60_000, 11 * 60_000);
let nextWolfAt = Date.now() + randomBetween(15 * 60_000, 30 * 60_000);
let nextRoamAt = Date.now() + randomBetween(4 * 60_000, 9 * 60_000);
let lastSpeechAt = Date.now();
let idleBlinkStep = -1;

function randomBetween(min, max) { return Math.round(min + Math.random() * (max - min)); }
function pick(items) { return items[Math.floor(Math.random() * items.length)]; }

function setState(nextState) {
  if (!animations[nextState]) return;
  stopCustomAction();
  state = nextState;
  frame = 0;
  lastFrameAt = performance.now();
  if (nextState === 'idle') {
    idleBlinkStep = -1;
    nextIdleFrameAt = performance.now() + randomBetween(7000, 16_000);
  }
}

function advanceIdle(now) {
  if (now < nextIdleFrameAt) return;
  const sequence = [1, 2, 1, 0];
  idleBlinkStep = (idleBlinkStep + 1) % sequence.length;
  frame = sequence[idleBlinkStep];
  nextIdleFrameAt = now + (frame === 0 ? randomBetween(7000, 16_000) : 95);
}

function draw(now) {
  if (!activeCustomAction) {
    const animation = animations[state];
    if (animation.variableTiming) advanceIdle(now);
    else {
      const frameInterval = 1000 / animation.fps;
      if (now - lastFrameAt >= frameInterval) {
        frame += Math.floor((now - lastFrameAt) / frameInterval);
        lastFrameAt = now;
        if (frame >= animation.frames) {
          if (animation.loop || dragging || roaming) frame %= animation.frames;
          else setState('idle');
        }
      }
    }
    ctx.clearRect(0, 0, CELL.width, CELL.height);
    if (sheet.complete && sheet.naturalWidth) {
      ctx.drawImage(sheet, frame * CELL.width, animation.row * CELL.height, CELL.width, CELL.height, 0, 0, CELL.width, CELL.height);
    }
  }
  requestAnimationFrame(draw);
}

function stopCustomAction() {
  clearTimeout(actionTimer);
  clearInterval(actionFrameTimer);
  if (!activeCustomAction) return;
  activeCustomAction = null;
  stage.classList.remove('action-mode');
  actionPet.removeAttribute('src');
}

function playCustom(name, onDone) {
  const action = customActions[name];
  if (!action || dragging || roaming) return false;
  stopCustomAction();
  activeCustomAction = name;
  stage.classList.add('action-mode');
  actionPet.src = action.src;
  let current = 0;
  actionPet.style.width = `${action.frames * 92}%`;
  actionPet.style.maxWidth = 'none';
  actionPet.style.left = '50%';
  actionPet.style.transform = `translateX(-${(current + 0.5) * 100 / action.frames}%)`;
  actionFrameTimer = setInterval(() => {
    current = Math.min(action.frames - 1, current + 1);
    actionPet.style.transform = `translateX(-${(current + 0.5) * 100 / action.frames}%)`;
  }, action.duration / action.frames);
  actionTimer = setTimeout(() => {
    stopCustomAction();
    setState('idle');
    onDone?.();
  }, action.duration + (action.holdLastMs || 0));
  return true;
}

function say(text, duration = 2600) {
  clearTimeout(bubbleTimer);
  bubble.textContent = text;
  bubble.classList.add('visible');
  bubbleTimer = setTimeout(() => bubble.classList.remove('visible'), duration);
  lastSpeechAt = Date.now();
}

function contextualSpeech() {
  if (Date.now() - lastSpeechAt < 10 * 60_000 || Math.random() > 0.22) return;
  say(pick(['别绷太紧。', '我在这边。', '刚才那段，值得再看一眼。', '水还热吗？']), 3200);
}

function playWolfSequence() {
  playCustom('wolf-transform', () => playCustom('wolf-idle'));
}

function ambientBehavior() {
  if (!autonomyEnabled || dragging || roaming || activeCustomAction || state !== 'idle') return;
  const roll = Math.random();
  if (Date.now() >= nextGlassesAt) {
    playCustom('glasses-wipe');
    nextGlassesAt = Date.now() + randomBetween(5 * 60_000, 11 * 60_000);
  } else if (Date.now() >= nextWolfAt) {
    playWolfSequence();
    nextWolfAt = Date.now() + randomBetween(15 * 60_000, 30 * 60_000);
  } else if (roll < 0.35) playCustom('tail-groom');
  else if (roll < 0.58) setState('review');
  else if (roll < 0.78) setState('running');
  else setState('waiting');
  contextualSpeech();
  nextAmbientAt = Date.now() + randomBetween(45_000, 110_000);
}

stage.addEventListener('contextmenu', (event) => {
  event.preventDefault();
  window.aoyinDesktop.contextMenu();
});

stage.addEventListener('pointerdown', (event) => {
  if (event.button !== 0 || locked) return;
  dragging = true;
  stopCustomAction();
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
  if (Math.abs(deltaX) > 4) setState(deltaX > 0 ? 'running-right' : 'running-left');
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
  if (y < 0.46) {
    setState('waving');
    if (Math.random() < 0.35) say(pick(['嗯。', '轻一点。', '耳朵别碰。']));
  } else {
    setState('jumping');
    if (Math.random() < 0.25) say('抓不到。');
  }
});

stage.addEventListener('dblclick', () => playCustom('tail-groom'));

setInterval(() => {
  const now = Date.now();
  if (autonomyEnabled && now >= nextAmbientAt) ambientBehavior();
  if (autonomyEnabled && now >= nextRoamAt && !dragging && !roaming && state === 'idle' && !activeCustomAction) {
    window.aoyinDesktop.requestRoam();
    nextRoamAt = now + randomBetween(4 * 60_000, 9 * 60_000);
  }
}, 1000);

window.aoyinDesktop.onPlay(({ state: nextState }) => setState(nextState));
window.aoyinDesktop.onCustom(({ name }) => name === 'wolf-sequence' ? playWolfSequence() : playCustom(name));
window.aoyinDesktop.onBubble(({ text, duration }) => say(text, duration));
window.aoyinDesktop.onLock((value) => { locked = value; });
window.aoyinDesktop.onAutonomy((value) => { autonomyEnabled = value; });
window.aoyinDesktop.onEnvironment(({ edge, reason }) => {
  if (reason === 'drop' && edge) setTimeout(() => playCustom('edge-peek'), 220);
});
window.aoyinDesktop.onRoamStart(({ direction }) => {
  roaming = true;
  setState(direction > 0 ? 'running-right' : 'running-left');
});
window.aoyinDesktop.onRoamEnd(() => { roaming = false; setState('idle'); });

sheet.addEventListener('load', () => requestAnimationFrame(draw));
sheet.addEventListener('error', () => say('角色素材没有加载成功。', 8000));
