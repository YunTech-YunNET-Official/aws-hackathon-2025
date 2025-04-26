import path from 'path';
import express from 'express';
import config from '../config/index.js';
import adminController from './adminController.js';

class RouteController {
    /**
     * 初始化 Express 路由
     * @param {Object} app Express 應用實例
     */
    initialize(app) {
        this.setupStaticFiles(app);
        this.setupRoutes(app);
        
        // 初始化 Admin 控制器
        adminController.initialize(app);
    }

    /**
     * 設置靜態文件服務
     * @param {Object} app Express 應用實例
     */
    setupStaticFiles(app) {
        app.use(express.static(config.paths.static));
    }

    /**
     * 設置路由
     * @param {Object} app Express 應用實例
     */
    setupRoutes(app) {
        app.get('/', (req, res) => {
            res.sendFile(path.join(config.paths.templates, 'index.html'));
        });
    }
}

export default new RouteController();