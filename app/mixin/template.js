import { BrowserWindow, app } from 'electron';

import path from 'path';

import fs from 'fs';

import { fileURLToPath } from 'url';

import nunjucks from 'nunjucks';

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

const IS_PROD = process.env.APP_ENV !== 'development';

const APP_DIR = path.join(__dirname, '..');

const VIEW_DIR = path.join(APP_DIR, 'view');

const PRELOAD_PATH = path.join(APP_DIR, 'config', 'preload.js');

const TEMP_DIR = path.join(app.getPath('temp'), 'deskivo-views');

const nunjucksEnv = nunjucks.configure(VIEW_DIR, {

    autoescape: true,

    noCache: !IS_PROD,
});

const MODULES_PATH = path.join(APP_DIR, '..', 'node_modules').replace(/\\/g, '/');

const ASSETS_PATH = path.join(VIEW_DIR, 'pages', 'assets').replace(/\\/g, '/');

nunjucksEnv.addGlobal('assets', ASSETS_PATH);

nunjucksEnv.addGlobal('modules', MODULES_PATH);

nunjucksEnv.addGlobal('appName', 'DESKIVO');

nunjucksEnv.addGlobal('isProd', IS_PROD);

if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
}

class Template {
    static #windows = new Map();
    static #defaults = {
        width: 1024,
        height: 680,
        minWidth: 480,
        minHeight: 360,
        show: false,
        center: true,
        backgroundColor: '#0f1318',
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
            devTools: !IS_PROD,
            preload: PRELOAD_PATH,
        }
    };

    static create(name, options = {}) {

        if (Template.#windows.has(name)) {

            const existing = Template.#windows.get(name);

            if (!existing.isDestroyed()) {

                existing.focus();

                return existing;
            }

            Template.#windows.delete(name);
        }

        const config = Template.#merge(options);

        const win = new BrowserWindow(config);

        Template.#windows.set(name, win);

        win.once('ready-to-show', () => {

            win.show();

            if (!IS_PROD) {

                win.webContents.openDevTools({ mode: 'detach' });
            }
        });

        win.on('closed', () => Template.#windows.delete(name));

        return win;
    }

    static loadView(win, viewName, data = {}) {

        const html = nunjucksEnv.render(`${viewName}.html`, data);

        const safeName = viewName.replace(/\//g, '-');

        const tempFile = path.join(TEMP_DIR, `${safeName}.html`);

        fs.writeFileSync(tempFile, html, 'utf8');

        win.loadFile(tempFile);
    }

    static get(name) {

        const win = Template.#windows.get(name);

        if (win && !win.isDestroyed()) return win;

        Template.#windows.delete(name);

        return null;
    }

    static close(name) {

        const win = Template.get(name);

        if (win) win.close();
    }

    static #merge(options) {

        const merged = { ...Template.#defaults, ...options };
    
        merged.webPreferences = {

            ...Template.#defaults.webPreferences,

            ...(options.webPreferences || {}),
        };

        return merged;
    }
    constructor() {
        throw new Error('Template é estática. Use Template.create()');
    }
}

export default Template;