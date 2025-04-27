import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

// 導入配置和控制器
import config from './config/index.js';
import routeController from './controllers/routeController.js';
import socketController from './controllers/socketController.js';
import conversationController from './controllers/conversationController.js';

// 初始化 Express 應用和 HTTP 服務器
const app = express();
const server = http.createServer(app);

// 添加中間件解析 JSON 和 URL-encoded 數據
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 初始化路由控制器
routeController.initialize(app);

// 初始化對話控制器
conversationController.initialize(app);

// 初始化 Socket.IO 控制器
socketController.initialize(server);

// 啓動服務器
server.listen(config.port, () =>
    console.log(`Server running at http://localhost:${config.port}`),
);
