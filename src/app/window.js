/**
 * 管理程序的窗口
 */
const { app, BrowserWindow, Tray, Menu, dialog } = require('electron')
const path = require('path')
const url = require('url')

const MAIN_WINDOW_HEIGHT = 640
const MAIN_WINDOW_WIDTH = 1105
const MAIN_WINDOW_MIN_HEIGHT = 580
const MAIN_WINDOW_MIN_WIDTH = 800
const MAIN_WINDOW_TITLE = '豆坟'
const APP_ICON = path.join(__dirname, 'app.ico')
const SPLASH_WINDOW_HEIGHT = 309
const SPLASH_WINDOW_WIDTH = 500


let mainWindow
let systemTray


/**
 * 创建闪屏窗口
 * 
 * @returns {BrowserWindow}
 */
function splashScreen() {
    let win = new BrowserWindow({
        width: SPLASH_WINDOW_WIDTH,
        height: SPLASH_WINDOW_HEIGHT,
        frame: false,
        show: true,
        resizable: false,
        movable: false,
        icon: APP_ICON
    })
    win.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }))

    return win
}

/**
 * 创建程序主窗口
 * 
 * @returns {BrowserWindow}
 */
function createMainWindow() {
    let win = new BrowserWindow({
        width: MAIN_WINDOW_WIDTH,
        height: MAIN_WINDOW_HEIGHT,
        minWidth: MAIN_WINDOW_MIN_WIDTH,
        minHeight: MAIN_WINDOW_MIN_HEIGHT,
        title: MAIN_WINDOW_TITLE,
        show: false,
        icon: APP_ICON,
        webPreferences: {
            preload: path.join(__dirname, 'render.js')
        }
    })

    if (global.debugMode) {
        win.webContents.openDevTools()
    }

    win.on('closed', () => {
        if (systemTray) {
            systemTray.destroy()
        }
        mainWindow = systemTray = null
    })

    win.on('close', (event) => {
        dialog.showMessageBox(win, {
            type: 'question',
            buttons: ['是(&Y)', '否(&N)'],
            defaultId: 1,
            cancelId: 1,
            noLink: true,
            title: '确认',
            normalizeAccessKeys: true,
            message: '是否退出程序？'
        }, (result) => {
            if (result != 0) return
            win.destroy()
        })
        event.preventDefault()
    })

    win.on('page-title-updated', (event, title) => {
        event.preventDefault()
        win.setTitle(title.trim() != MAIN_WINDOW_TITLE ? `${MAIN_WINDOW_TITLE} - ${title}` : MAIN_WINDOW_TITLE)
    })

    win.on('minimize', (event) => {
        win.hide()
    })

    win.webContents.on('crashed', () => {
        const dialogOptions = {
            type: 'info',
            buttons: ['重新加载(&R)', '退出程序(&X)'],
            defaultId: 1,
            cancelId: 1,
            noLink: true,
            title: '信息',
            normalizeAccessKeys: true,
            message: '程序遇到崩溃。'
        }
        dialog.showMessageBox(dialogOptions, (result) => {
            if (result == 0) mainWindow.reload()
            else app.quit()
        })
    })

    return mainWindow = win
}


/**
 * 创建系统托盘
 * 
 * @returns {Tray}
 */
function createTray() {
    const toggleMainWindow = () => {
        mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show()
    }

    let tray = new Tray(APP_ICON)
    tray.setToolTip(MAIN_WINDOW_TITLE)
    tray.setContextMenu(Menu.buildFromTemplate([{
        label: '显示/隐藏窗口(&H)',
        click: toggleMainWindow
    },
    { type: 'separator' },
    {
        label: '退出(&X)',
        click() {
            mainWindow.close()
        }
    }
    ]))
    tray.on('double-click', toggleMainWindow)

    return systemTray = tray
}


/**
 * 获取主窗口
 * 
 * @returns {BrowserWindow | null}
 */
function getMainWindow() {
    if (!mainWindow || mainWindow.isDestroyed()) {
        mainWindow = null
    }
    return mainWindow
}


exports.splashScreen = splashScreen
exports.createMainWindow = createMainWindow
exports.getMainWindow = getMainWindow
exports.createTray = createTray
