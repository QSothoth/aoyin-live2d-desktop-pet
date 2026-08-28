const { app, BrowserWindow, Menu, Tray, ipcMain, nativeImage, screen } = require('electron');
const path = require('node:path');

let petWindow;
let tray;
let locked = false;
let petScale = 1.25;
let breakReminderEnabled = false;
let breakReminderTimer;

const BASE_SIZE = { width: 230, height: 270 };

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

function setScale(nextScale) {
  petScale = nextScale;
  const [x, y] = petWindow.getPosition();
  const size = windowSize();
  petWindow.setBounds({ x, y, ...size }, true);
  petWindow.webContents.send('pet:scale', petScale);
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
    { type: 'separator' },
    {
      label: '大小',
      submenu: [
        { label: '小巧', type: 'radio', checked: petScale === 0.95, click: () => setScale(0.95) },
        { label: '标准', type: 'radio', checked: petScale === 1.25, click: () => setScale(1.25) },
        { label: '大只', type: 'radio', checked: petScale === 1.55, click: () => setScale(1.55) }
      ]
    },
    { label: '锁定位置', type: 'checkbox', checked: locked, click: (item) => { locked = item.checked; petWindow.webContents.send('pet:lock', locked); rebuildMenu(); } },
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
    showBubble('我会安静待着。');
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
  if (!locked && petWindow) petWindow.setPosition(Math.round(x), Math.round(y));
});
