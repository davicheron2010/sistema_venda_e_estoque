import './app/config/env.js';
import { app } from 'electron';
import Template from './app/mixin/Template.js';

// Carrega as rotas IPC
import './app/route/route.js';

app.whenReady().then(() => {
    const win = Template.create('main', {
        width: 1280,
        height: 800,
        title: 'DESKIVO',
    });

    Template.loadView(win, 'pages/home');
    win.maximize();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});