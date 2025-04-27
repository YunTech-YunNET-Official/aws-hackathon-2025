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

        // 獲取單個客戶資料的 API
        router.get('/api/customers/:id', async (req, res) => {
            try {
                const customer = await prisma.customer.findUnique({
                    where: {
                        id: parseInt(req.params.id)
                    },
                    include: {
                        attributes: true
                    }
                });
                
                if (!customer) {
                    return res.status(404).json({ error: '找不到客戶資料' });
                }
                
                res.json(customer);
            } catch (error) {
                console.error('獲取客戶資料失敗:', error);
                res.status(500).json({ error: '獲取客戶資料失敗' });
            }
        });

        // 新增客戶的 API
        router.post('/api/customers', express.json(), async (req, res) => {
            try {
                const { attributes } = req.body;
                
                if (!attributes || !Array.isArray(attributes) || attributes.length === 0) {
                    return res.status(400).json({ error: '缺少有效的客戶屬性資料' });
                }
                
                // 新增客戶
                const customer = await prisma.customer.create({
                    data: {}
                });
                
                // 新增客戶屬性
                const customerAttributes = attributes.map(attr => ({
                    customerId: customer.id,
                    attribute: attr.attribute,
                    value: attr.value
                }));
                
                await prisma.customerAttribute.createMany({
                    data: customerAttributes
                });
                
                // 獲取剛創建的客戶資料，包括屬性
                const createdCustomer = await prisma.customer.findUnique({
                    where: { id: customer.id },
                    include: { attributes: true }
                });
                
                res.status(201).json({ success: true, message: '客戶新增成功', customer: createdCustomer });
            } catch (error) {
                console.error('新增客戶資料失敗:', error);
                res.status(500).json({ error: '新增客戶資料失敗' });
            }
        });

        // 更新客戶資料的 API
        router.put('/api/customers/:id', express.json(), async (req, res) => {
            try {
                const customerId = parseInt(req.params.id);
                const { attributes } = req.body;
                
                if (!attributes || !Array.isArray(attributes)) {
                    return res.status(400).json({ error: '缺少有效的客戶屬性資料' });
                }
                
                // 確認客戶存在
                const customer = await prisma.customer.findUnique({
                    where: { id: customerId }
                });
                
                if (!customer) {
                    return res.status(404).json({ error: '找不到客戶資料' });
                }
                
                // 刪除所有現有屬性
                await prisma.customerAttribute.deleteMany({
                    where: { customerId }
                });
                
                // 新增更新後的屬性
                const customerAttributes = attributes.map(attr => ({
                    customerId,
                    attribute: attr.attribute,
                    value: attr.value
                }));
                
                await prisma.customerAttribute.createMany({
                    data: customerAttributes
                });
                
                // 獲取更新後的客戶資料
                const updatedCustomer = await prisma.customer.findUnique({
                    where: { id: customerId },
                    include: { attributes: true }
                });
                
                res.json({ success: true, message: '客戶資料更新成功', customer: updatedCustomer });
            } catch (error) {
                console.error('更新客戶資料失敗:', error);
                res.status(500).json({ error: '更新客戶資料失敗' });
            }
        });

        // 刪除客戶資料的 API
        router.delete('/api/customers/:id', async (req, res) => {
            try {
                const customerId = parseInt(req.params.id);
                
                // 確認客戶存在
                const customer = await prisma.customer.findUnique({
                    where: { id: customerId }
                });
                
                if (!customer) {
                    return res.status(404).json({ error: '找不到客戶資料' });
                }
                
                // 首先刪除所有相關屬性（因為外鍵約束）
                await prisma.customerAttribute.deleteMany({
                    where: { customerId }
                });
                
                // 然後刪除客戶
                await prisma.customer.delete({
                    where: { id: customerId }
                });
                
                res.json({ success: true, message: '客戶資料刪除成功' });
            } catch (error) {
                console.error('刪除客戶資料失敗:', error);
                res.status(500).json({ error: '刪除客戶資料失敗' });
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