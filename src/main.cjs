const { app, BrowserWindow, Menu, Tray, ipcMain, nativeImage, screen } = require('electron');
const path = require('node:path');
const { classifyEdge, randomBetween } = require('./behavior-policy.cjs');
const { resizeKeepingFeet } = require('./window-geometry.cjs');

let petWindow;
let tray;
let locked = false;
let petScale = 1;
let breakReminderEnabled = false;
let autonomyEnabled = true;
let breakReminderTimer;
let roamingTimer;

const BASE_SIZE = { width: 236, height: 278 };

function windowSize() {
  return {
    width: Math.round(BASE_SIZE.width * petScale),
    height: Math.round(BASE_SIZE.height * petScale)
  };
}

function placeAtBottomRight(win) {
  const display = screen.getPrimaryDisplay();
  const size = windowSize();
  const area = display.workArea;
  win.setBounds({
    width: size.width,
    height: size.height,
    x: area.x + area.width - size.width - 24,
    y: area.y + area.height - size.height - 16
  });
}

function showBubble(text, duration = 2600) {
  petWindow?.webContents.send('pet:bubble', { text, duration });
}

function play(state, duration) {
  petWindow?.webContents.send('pet:play', { state, duration });
}

function playCustom(name) {
  petWindow?.webContents.send('pet:custom', { name });
}

function currentEnvironment() {
  if (!petWindow) return null;
  const bounds = petWindow.getBounds();
  const display = screen.getDisplayMatching(bounds);
  return { bounds, workArea: display.workArea, edge: classifyEdge(bounds, display.workArea) };
}

function sendEnvironment(reason = 'update') {
  const environment = currentEnvironment();
  if (environment) petWindow.webContents.send('pet:environment', { ...environment, reason });
}

function setScale(nextScale) {
  if (!petWindow || petScale === nextScale) return;
  petScale = nextScale;
  const previous = petWindow.getBounds();
  const size = windowSize();
  // Preserve the character's feet and horizontal centre. Electron's animated
  // setBounds briefly stretches transparent windows on macOS, so resize atomically.
  petWindow.setBounds(resizeKeepingFeet(previous, size), false);
  petWindow.webContents.send('pet:scale', petScale);
  sendEnvironment('scale');
}

function stopRoam() {
  clearInterval(roamingTimer);
  roamingTimer = undefined;
}

function roam() {
  if (!petWindow || locked || roamingTimer) return;
  const start = petWindow.getBounds();
  const area = screen.getDisplayMatching(start).workArea;
  const maxX = area.x + area.width - start.width;
  const minX = area.x;
  const direction = start.x > area.x + area.width / 2 ? -1 : 1;
  const distance = Math.min(randomBetween(70, 180), direction > 0 ? maxX - start.x : start.x - minX);
  if (distance < 30) return;
  const duration = Math.max(1600, distance * 13);
  const startedAt = Date.now();
  petWindow.webContents.send('pet:roam-start', { direction, duration });
  roamingTimer = setInterval(() => {
    const progress = Math.min(1, (Date.now() - startedAt) / duration);
    const eased = 0.5 - Math.cos(progress * Math.PI) / 2;
    petWindow.setPosition(Math.round(start.x + direction * distance * eased), start.y);
    if (progress >= 1) {
      stopRoam();
      petWindow.webContents.send('pet:roam-end');
      sendEnvironment('roam');
    }
  }, 40);
}

function setBreakReminder(enabled) {
  breakReminderEnabled = enabled;
  clearInterval(breakReminderTimer);
  if (enabled) {
    breakReminderTimer = setInterval(() => {
      play('waiting');
      showBubble('歇一下眼睛，起来喝口水？', 8000);
    }, 45 * 60 * 1000);
    showBubble('好。四十五分钟后我提醒你。');
  } else {
    showBubble('提醒先关掉了。');
  }
  rebuildMenu();
}

function interactionMenu() {
  return [
    { label: '喂一口罐头', click: () => { play('jumping'); showBubble('……还不错。'); } },
    { label: '摸摸头', click: () => { play('waving'); showBubble('只准摸一下。'); } },
    { label: '陪我工作', click: () => { play('running'); showBubble('专心。我在。', 3600); } },
    { label: '帮我审阅', click: () => { play('review'); showBubble('给我看看。'); } },
    { label: '需要我回应', click: () => { play('waiting'); showBubble('嗯？我听着。'); } },
    { label: '擦擦眼镜', click: () => playCustom('glasses-wipe') },
    { label: '变成狼', click: () => playCustom('wolf-sequence') },
    { label: '去走走', click: () => roam() },
    { type: 'separator' },
    {
      label: '大小',
      submenu: [
        { label: '小巧', type: 'radio', checked: petScale === 0.85, click: () => setScale(0.85) },
        { label: '标准', type: 'radio', checked: petScale === 1, click: () => setScale(1) },
        { label: '大只', type: 'radio', checked: petScale === 1.2, click: () => setScale(1.2) }
      ]
    },
    { label: '锁定位置', type: 'checkbox', checked: locked, click: (item) => { locked = item.checked; petWindow.webContents.send('pet:lock', locked); rebuildMenu(); } },
    { label: '自主活动', type: 'checkbox', checked: autonomyEnabled, click: (item) => { autonomyEnabled = item.checked; petWindow.webContents.send('pet:autonomy', autonomyEnabled); rebuildMenu(); } },
    { label: '45 分钟休息提醒', type: 'checkbox', checked: breakReminderEnabled, click: (item) => setBreakReminder(item.checked) },
    { label: '开机启动', type: 'checkbox', checked: app.getLoginItemSettings().openAtLogin, click: (item) => app.setLoginItemSettings({ openAtLogin: item.checked }) },
    { type: 'separator' },
    { label: '回到右下角', click: () => placeAtBottomRight(petWindow) },
    { label: '暂时藏起来', click: () => petWindow.hide() },
    { label: '退出敖隐', click: () => app.quit() }
  ];
}

function rebuildMenu() {
  const menu = Menu.buildFromTemplate(interactionMenu());
  tray?.setContextMenu(menu);
  petWindow?.webContents.send('pet:menu-updated');
}

function createWindow() {
  const size = windowSize();
  petWindow = new BrowserWindow({
    ...size,
    transparent: true,
    useContentSize: true,
    frame: false,
    resizable: false,
    hasShadow: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  petWindow.setAlwaysOnTop(true, 'floating');
  petWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  petWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  petWindow.once('ready-to-show', () => {
    placeAtBottomRight(petWindow);
    petWindow.showInactive();
    sendEnvironment('launch');
  });
  petWindow.on('closed', () => { petWindow = undefined; });
}

function createTray() {
  const trayIconPath = path.join(__dirname, '..', 'resources', 'icon.png');
  const icon = nativeImage.createFromPath(trayIconPath).resize({ width: 22, height: 22 });
  tray = new Tray(icon);
  tray.setToolTip('敖隐桌宠');
  tray.on('click', () => {
    if (!petWindow) return;
    petWindow.isVisible() ? petWindow.hide() : petWindow.showInactive();
  });
  rebuildMenu();
}

app.whenReady().then(() => {
  createWindow();
  createTray();
  app.on('activate', () => petWindow?.show());
});

// Tray applications intentionally stay alive when their only window is hidden.
app.on('window-all-closed', () => {});

ipcMain.on('pet:context-menu', () => Menu.buildFromTemplate(interactionMenu()).popup({ window: petWindow }));
ipcMain.on('pet:drag-start', () => petWindow?.webContents.send('pet:lock', locked));
ipcMain.on('pet:move', (_event, { x, y }) => {
  if (!locked && petWindow) {
    stopRoam();
    petWindow.setPosition(Math.round(x), Math.round(y));
  }
});
ipcMain.on('pet:drag-end', () => sendEnvironment('drop'));
ipcMain.on('pet:request-roam', () => roam());
ipcMain.handle('pet:get-environment', () => currentEnvironment());
