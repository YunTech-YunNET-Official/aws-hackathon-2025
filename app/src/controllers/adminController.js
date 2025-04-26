import path from 'path';
import express from 'express';
import multer from 'multer';
import fs from 'fs';
import { createReadStream } from 'fs';
import csv from 'csv-parser';
import config from '../config/index.js';
import { PrismaClient } from '../generated/prisma/index.js';

const prisma = new PrismaClient();

// 設定 multer 存放上傳檔案的資料夾
const upload = multer({ dest: path.join(config.paths.root, 'uploads/') });

class AdminController {
    /**
     * 初始化 Admin 路由
     * @param {Object} app Express 應用實例
     */
    initialize(app) {
        this.setupAdminRoutes(app);
    }

    /**
     * 設置 Admin 路由
     * @param {Object} app Express 應用實例
     */
    setupAdminRoutes(app) {
        const router = express.Router();
        
        // Admin 面板首頁
        router.get('/', (req, res) => {
            res.sendFile(path.join(config.paths.templates, 'admin/index.html'));
        });

        // 獲取所有客戶資料的 API
        router.get('/api/customers', async (req, res) => {
            try {
                const customers = await prisma.customer.findMany({
                    include: {
                        attributes: true
                    }
                });
                res.json(customers);
            } catch (error) {
                console.error('獲取客戶資料失敗:', error);
                res.status(500).json({ error: '獲取客戶資料失敗' });
            }
        });

        // 上傳 CSV 檔案的 API
        router.post('/api/upload', upload.single('file'), async (req, res) => {
            if (!req.file) {
                return res.status(400).json({ error: '未選擇任何檔案' });
            }

            const rows = [];
            
            createReadStream(req.file.path)
                .pipe(csv())  // 移除選項，讓csv-parser自動處理header
                .on('data', (data) => rows.push(data))
                .on('end', async () => {
                    try {
                        // 逐筆處理每個客戶
                        for (const row of rows) {
                            // 建立 Customer
                            const customer = await prisma.customer.create({
                                data: {}
                            });

                            // 將每個欄位當作屬性寫入 CustomerAttribute，確保使用列標題作為屬性名稱
                            const attrs = Object.entries(row)
                                .filter(([header, value]) => value !== '' && value != null && header.trim() !== '')
                                .map(([header, value]) => ({
                                    customerId: customer.id,
                                    attribute: header.trim(),  // 使用CSV的標題作為屬性名稱
                                    value: value.toString().trim(),
                                }));

                            if (attrs.length) {
                                await prisma.customerAttribute.createMany({
                                    data: attrs
                                });
                            }
                        }

                        // 刪除暫存檔
                        fs.unlinkSync(req.file.path);

                        res.json({ success: true, message: '檔案上傳並成功寫入資料庫' });
                    } catch (error) {
                        console.error('寫入資料庫時發生錯誤:', error);
                        res.status(500).json({ error: '寫入資料庫時發生錯誤' });
                    }
                });
        });

        // 將所有 admin 路由掛載到 /admin 路徑下
        app.use('/admin', router);
    }
}

export default new AdminController();