import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  getLiveToken,
  sendInvoicePacket,
  inquireInvoiceByUid,
  testNetworkConnectivity,
  getServerInformation,
  getDirectSubmissionObstacles,
  OFFICIAL_TAX_ORG_PUBLIC_KEY,
} from './src/server/moadianService';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // میدل‌ویر پارس بدنه JSON با حجم مناسب برای پکت‌های صورتحساب و کلیدها
  app.use(express.json({ limit: '10mb' }));

  // ۱. روت بررسی سلامت سرور
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'moadian-api-bridge',
      timestamp: new Date().toISOString(),
    });
  });

  // ۲. تست اتصال شبکه و پینگ به درگاه سامانه مودیان (tp.tax.gov.ir)
  app.get('/api/moadian/network-status', async (req, res) => {
    const targetUrl = (req.query.targetUrl as string) || 'https://tp.tax.gov.ir';
    try {
      const result = await testNetworkConnectivity(targetUrl);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ۳. متد اول: دریافت توکن احراز هویت زنده (GET_TOKEN)
  app.post('/api/moadian/get-token', async (req, res) => {
    try {
      const { memoryId, privateKeyPem, apiUrl, environment, allowSimulatorFallback } = req.body;
      if (!memoryId || !privateKeyPem) {
        return res.status(400).json({
          success: false,
          error: 'شناسه حافظه (memoryId) و کلید خصوصی (privateKeyPem) الزامی هستند.',
        });
      }

      const result = await getLiveToken({
        memoryId,
        privateKeyPem,
        apiUrl,
        environment,
        allowSimulatorFallback: allowSimulatorFallback !== false,
      });

      res.status(result.httpStatus || 200).json(result);
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: `خطای سیستمی در دریافت توکن: ${err.message}`,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // ۴. متد دوم: ارسال بسته صورتحساب الکترونیکی (SEND_INVOICE)
  app.post('/api/moadian/send-invoice', async (req, res) => {
    try {
      const { invoice, config } = req.body;
      if (!invoice || !config?.memoryId || !config?.privateKeyPem) {
        return res.status(400).json({
          success: false,
          error: 'اطلاعات کامل صورتحساب و پیکربندی مودی الزامی است.',
        });
      }

      const result = await sendInvoicePacket(invoice, config);
      res.status(result.httpStatus || 200).json(result);
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: `خطای ارسال بسته صورتحساب: ${err.message}`,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // ۵. متد سوم: استعلام وضعیت صورتحساب از کارپوشه (INQUIRY_BY_UID)
  app.post('/api/moadian/inquiry', async (req, res) => {
    try {
      const { uids, config } = req.body;
      if (!uids || !Array.isArray(uids) || !config?.memoryId || !config?.privateKeyPem) {
        return res.status(400).json({
          success: false,
          error: 'فهرست شناسه‌های پیگیری UID و اطلاعات پیکربندی مودی الزامی است.',
        });
      }

      const result = await inquireInvoiceByUid(uids, config);
      res.status(result.httpStatus || 200).json(result);
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: `خطای استعلام از وب‌سرویس: ${err.message}`,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // ۶. دریافت کلیدهای عمومی سرور سازمان (GET_SERVER_INFORMATION)
  app.post('/api/moadian/server-information', async (req, res) => {
    try {
      const config = req.body || {};
      const result = await getServerInformation(config);
      res.status(result.httpStatus || 200).json(result);
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: `خطای دریافت کلیدهای سرور: ${err.message}`,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // ۷. پایش و تحلیل کامل موانع ارسال مستقیم به کارپوشه (Direct Diagnostics)
  app.post('/api/moadian/direct-diagnostics', async (req, res) => {
    try {
      const config = req.body || {};
      const result = await getDirectSubmissionObstacles(config);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: `خطای ارزیابی موانع ارسال مستقیم: ${err.message}`,
      });
    }
  });

  // تنظیم میدل‌ویر Vite در حالت توسعه (Dev) یا فایل‌های استاتیک در حالت پروداکشن
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Moadian Server] Running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Moadian Server] Failed to start:', err);
});
