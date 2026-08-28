const CELL = { width: 192, height: 208 };
const animations = {
  idle: { row: 0, frames: 6, fps: 7, loop: true },
  'running-right': { row: 1, frames: 8, fps: 12, loop: true },
  'running-left': { row: 2, frames: 8, fps: 12, loop: true },
  waving: { row: 3, frames: 4, fps: 8, loop: false },
  jumping: { row: 4, frames: 5, fps: 11, loop: false },
  failed: { row: 5, frames: 8, fps: 7, loop: false },
  waiting: { row: 6, frames: 6, fps: 6, loop: true },
  running: { row: 7, frames: 6, fps: 8, loop: true },
  review: { row: 8, frames: 6, fps: 7, loop: true }
};

const canvas = document.querySelector('#pet');
const ctx = canvas.getContext('2d');
const stage = document.querySelector('#stage');
const bubble = document.querySelector('#bubble');
const sheet = new Image();
sheet.src = '../../resources/pets/aoyin/spritesheet.webp';

let state = 'idle';
let frame = 0;
let lastFrameAt = performance.now();
let forcedUntil = 0;
let bubbleTimer;
let lastInteraction = Date.now();
let dragging = false;
let locked = false;
let dragOffset = { x: 0, y: 0 };
let previousPointerX = 0;
let dragDistance = 0;
let suppressClick = false;

function setState(nextState, duration = 0) {
  if (!animations[nextState]) return;
  state = nextState;
  frame = 0;
  lastFrameAt = performance.now();
  forcedUntil = duration ? Date.now() + duration : 0;
  lastInteraction = Date.now();
}

function draw(now) {
  const animation = animations[state];
  const frameInterval = 1000 / animation.fps;
  if (now - lastFrameAt >= frameInterval) {
    const advance = Math.floor((now - lastFrameAt) / frameInterval);
    frame += advance;
    lastFrameAt += advance * frameInterval;
    if (frame >= animation.frames) {
      if (animation.loop) frame %= animation.frames;
      else setState('idle');
    }
  }
  if (forcedUntil && Date.now() > forcedUntil && !dragging) setState('idle');
  ctx.clearRect(0, 0, CELL.width, CELL.height);
  if (sheet.complete && sheet.naturalWidth) {
    ctx.drawImage(sheet, frame * CELL.width, animation.row * CELL.height, CELL.width, CELL.height, 0, 0, CELL.width, CELL.height);
  }
  requestAnimationFrame(draw);
}

function say(text, duration = 2600) {
  clearTimeout(bubbleTimer);
  bubble.textContent = text;
  bubble.classList.add('visible');
  bubbleTimer = setTimeout(() => bubble.classList.remove('visible'), duration);
}

stage.addEventListener('contextmenu', (event) => {
  event.preventDefault();
  window.aoyinDesktop.contextMenu();
});

stage.addEventListener('pointerdown', (event) => {
  if (event.button !== 0 || locked) return;
  dragging = true;
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
  if (Math.abs(deltaX) > 1) setState(deltaX > 0 ? 'running-right' : 'running-left');
  previousPointerX = event.screenX;
  window.aoyinDesktop.move({ x: event.screenX - dragOffset.x, y: event.screenY - dragOffset.y });
});

stage.addEventListener('pointerup', (event) => {
  if (!dragging) return;
  dragging = false;
  suppressClick = dragDistance > 4;
  stage.classList.remove('dragging');
  stage.releasePointerCapture(event.pointerId);
  setState('idle');
});

stage.addEventListener('click', () => {
  if (dragging || suppressClick) {
    suppressClick = false;
    return;
  }
  setState('waving');
  say(['嗯。', '我在。', '别一直戳。'][Math.floor(Math.random() * 3)]);
});

stage.addEventListener('dblclick', () => {
  setState('jumping');
  say('看到你了。');
});

setInterval(() => {
  const idleMs = Date.now() - lastInteraction;
  if (!dragging && idleMs > 18 * 60 * 1000 && state === 'idle') {
    setState('failed', 6500);
    say('……我先眯一会儿。', 5000);
  }
}, 30000);

window.aoyinDesktop.onPlay(({ state: nextState, duration }) => setState(nextState, duration));
window.aoyinDesktop.onBubble(({ text, duration }) => say(text, duration));
window.aoyinDesktop.onLock((value) => { locked = value; });

sheet.addEventListener('load', () => requestAnimationFrame(draw));
sheet.addEventListener('error', () => say('宠物图集没有加载成功。', 8000));
