import React, { useState, useEffect } from 'react';
import {
  getStoredConfig,
  saveStoredConfig,
  getStoredInvoices,
  saveInvoiceToStorage,
  saveInvoicesList,
  deleteInvoiceFromStorage,
  resetToSampleData,
} from './utils/storage';
import { TaxInvoice, TaxpayerConfig, InvoiceSubject, InvoiceStatus } from './types';
import { HeaderNav, ActiveTab } from './components/HeaderNav';
import { DashboardView } from './components/DashboardView';
import { InvoiceBuilderView } from './components/InvoiceBuilderView';
import { InvoiceListView } from './components/InvoiceListView';
import { TaxIdCalculatorView } from './components/TaxIdCalculatorView';
import { MoadianApiView } from './components/MoadianApiView';
import { StuffCatalogView } from './components/StuffCatalogView';
import { SettingsView } from './components/SettingsView';
import { RulesGuideView } from './components/RulesGuideView';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function App() {
  const [config, setConfig] = useState<TaxpayerConfig>(getStoredConfig());
  const [invoices, setInvoices] = useState<TaxInvoice[]>(getStoredInvoices());
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [editingInvoice, setEditingInvoice] = useState<TaxInvoice | null>(null);

  // پیام اعلان (Toast)
  const [toast, setToast] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // ذخیره صورتحساب
  const handleSaveInvoice = (invoice: TaxInvoice, andSend?: boolean) => {
    const nowIso = new Date().toISOString();

    if (andSend) {
      const generatedUid = 'UID-140306-' + Math.floor(100000000 + Math.random() * 900000000);
      const generatedRef = 'REF-' + Math.floor(100000000 + Math.random() * 900000000);
      invoice.status = 'in_progress';
      invoice.uid = generatedUid;
      invoice.referenceNumber = generatedRef;
      invoice.cartable = {
        isUploadedToTax: true,
        isInTaxCartable: false, // ابتدا در صف پردازش وب‌سرویس سازمان قرار می‌گیرد
        uid: generatedUid,
        referenceNumber: generatedRef,
        lastInquiryDate: nowIso,
        buyerActionStatus: 'pending',
      };
      invoice.apiLogs = [
        ...(invoice.apiLogs || []),
        {
          timestamp: nowIso,
          action: 'ارسال بسته صورتحساب به سامانه مودیان',
          success: true,
          message: `بسته با موفقیت امضا و به درگاه ارسال شد. کد رهگیری: ${generatedUid}. در انتظار تایید و استقرار در کارپوشه.`,
        },
      ];
    } else {
      invoice.status = 'draft';
      invoice.cartable = {
        isUploadedToTax: false,
        isInTaxCartable: false,
      };
    }

    saveInvoiceToStorage(invoice);
    setInvoices(getStoredInvoices());
    setEditingInvoice(null);

    if (andSend) {
      showToast('info', `صورتحساب با شماره مالیاتی ${invoice.header.taxid} امضا و به درگاه مودیان ارسال شد (در صف استعلام کارپوشه).`);
    } else {
      showToast('info', 'صورتحساب به صورت پیش‌نویس محلی ذخیره شد (هنوز در سامانه بارگذاری نشده است).');
    }

    setActiveTab('invoices_list');
  };

  // ارسال مستقیم یک صورتحساب
  const handleSendInvoice = (invoice: TaxInvoice) => {
    const nowIso = new Date().toISOString();
    const generatedUid = 'UID-140306-' + Math.floor(100000000 + Math.random() * 900000000);
    const generatedRef = 'REF-' + Math.floor(100000000 + Math.random() * 900000000);

    const updated: TaxInvoice = {
      ...invoice,
      status: 'in_progress' as const,
      uid: generatedUid,
      referenceNumber: generatedRef,
      cartable: {
        isUploadedToTax: true,
        isInTaxCartable: false, // در صف استعلام و اعتبارسنجی
        uid: generatedUid,
        referenceNumber: generatedRef,
        lastInquiryDate: nowIso,
        buyerActionStatus: 'pending',
      },
      updatedAt: nowIso,
      apiLogs: [
        ...(invoice.apiLogs || []),
        {
          timestamp: nowIso,
          action: 'ارسال مستقیم به درگاه مودیان',
          success: true,
          message: `بسته امضا و ارسال شد. کد رهگیری UID: ${generatedUid}. وضعیت: در صف استعلام کارپوشه.`,
        },
      ],
    };
    saveInvoiceToStorage(updated);
    setInvoices(getStoredInvoices());
    showToast('info', `صورتحساب سریال ${invoice.header.inno} به درگاه ارسال شد (UID: ${generatedUid}). وضعیت آن در صف استعلام کارپوشه قرار دارد.`);
  };

  // ارسال دسته‌ای صورتحساب‌ها
  const handleSendBatch = (targetInvoices: TaxInvoice[]) => {
    const nowIso = new Date().toISOString();
    const updatedList = invoices.map((inv) => {
      if (targetInvoices.some((t) => t.id === inv.id)) {
        const generatedUid = 'UID-140306-' + Math.floor(100000000 + Math.random() * 900000000);
        const generatedRef = 'REF-' + Math.floor(100000000 + Math.random() * 900000000);
        return {
          ...inv,
          status: 'in_progress' as const,
          uid: generatedUid,
          referenceNumber: generatedRef,
          cartable: {
            isUploadedToTax: true,
            isInTaxCartable: false,
            uid: generatedUid,
            referenceNumber: generatedRef,
            lastInquiryDate: nowIso,
            buyerActionStatus: 'pending' as const,
          },
          updatedAt: nowIso,
        };
      }
      return inv;
    });
    saveInvoicesList(updatedList);
    setInvoices(updatedList);
    showToast('info', `${targetInvoices.length} صورتحساب به درگاه سامانه مودیان ارسال و دارای شناسه پیگیری UID شدند.`);
  };

  // به‌روزرسانی تک‌صورتحساب از پنجره گردش کارپوشه
  const handleUpdateSingleInvoice = (updatedInvoice: TaxInvoice) => {
    saveInvoiceToStorage(updatedInvoice);
    setInvoices(getStoredInvoices());
  };

  // صدور صورتحساب اصلاحی
  const handleIssueCorrection = (invoice: TaxInvoice) => {
    const correctionInvoice: TaxInvoice = {
      ...invoice,
      id: `INV-CORR-${Date.now()}`,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      header: {
        ...invoice.header,
        inno: (parseInt(invoice.header.inno) + 100).toString(),
        ins: InvoiceSubject.CORRECTION,
        srtaxid: invoice.header.taxid, // ارجاع به شماره مالیاتی فاکتور قبلی
      },
    };
    setEditingInvoice(correctionInvoice);
    setActiveTab('new_invoice');
    showToast('info', `در حال صدور صورتحساب اصلاحی برای شماره مالیاتی ${invoice.header.taxid}`);
  };

  // صدور صورتحساب ابطالی
  const handleIssueCancellation = (invoice: TaxInvoice) => {
    const cancelInvoice: TaxInvoice = {
      ...invoice,
      id: `INV-CANC-${Date.now()}`,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      header: {
        ...invoice.header,
        inno: (parseInt(invoice.header.inno) + 200).toString(),
        ins: InvoiceSubject.CANCELLATION,
        srtaxid: invoice.header.taxid, // ارجاع به شماره مالیاتی فاکتور قبلی
      },
      body: invoice.body.map((item) => ({
        ...item,
        am: 0,
        fee: 0,
        prdis: 0,
        dis: 0,
        adis: 0,
        vam: 0,
        tsstam: 0,
      })),
    };
    setEditingInvoice(cancelInvoice);
    setActiveTab('new_invoice');
    showToast('info', `در حال صدور صورتحساب ابطالی برای شماره مالیاتی ${invoice.header.taxid}`);
  };

  // حذف صورتحساب
  const handleDeleteInvoice = (id: string) => {
    if (window.confirm('آیا از حذف این پیش‌نویس صورتحساب اطمینان دارید؟')) {
      deleteInvoiceFromStorage(id);
      setInvoices(getStoredInvoices());
      showToast('info', 'صورتحساب با موفقیت حذف گردید.');
    }
  };

  // بروزرسانی وضعیت از طریق کنسول وب‌سرویس
  const handleUpdateInvoiceStatus = (
    id: string,
    status: InvoiceStatus,
    refNumber?: string,
    uid?: string
  ) => {
    const updated = invoices.map((inv) =>
      inv.id === id
        ? {
            ...inv,
            status,
            referenceNumber: refNumber || inv.referenceNumber,
            uid: uid || inv.uid,
            cartable: {
              ...(inv.cartable || { isUploadedToTax: true, isInTaxCartable: false }),
              uid: uid || inv.cartable?.uid,
              referenceNumber: refNumber || inv.cartable?.referenceNumber,
            },
            updatedAt: new Date().toISOString(),
          }
        : inv
    );
    saveInvoicesList(updated);
    setInvoices(updated);
  };

  // ذخیره تنظیمات کارپوشه
  const handleSaveConfig = (updated: TaxpayerConfig) => {
    saveStoredConfig(updated);
    setConfig(updated);
    showToast('success', 'تنظیمات و اطلاعات کارپوشه با موفقیت بروزرسانی شدند.');
  };

  // بازنشانی به داده‌های نمونه
  const handleResetSampleData = () => {
    resetToSampleData();
    setConfig(getStoredConfig());
    setInvoices(getStoredInvoices());
    showToast('info', 'داده‌ها به حالت پیش‌فرض و نمونه بازگردانی شدند.');
  };

  return (
    <div className="min-h-screen bg-slate-100/60 text-slate-800 font-sans flex flex-col antialiased selection:bg-emerald-500 selection:text-white">
      {/* نوار ناوبری و هدر اصلی */}
      <HeaderNav
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'new_invoice' && activeTab !== 'new_invoice') {
            setEditingInvoice(null);
          }
          setActiveTab(tab);
        }}
        config={config}
        totalInvoicesCount={invoices.length}
      />

      {/* پیام اعلان شناور (Toast) */}
      {toast && (
        <div className="fixed bottom-6 left-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-emerald-900/90 text-white border-emerald-700'
                : toast.type === 'error'
                ? 'bg-rose-900/90 text-white border-rose-700'
                : 'bg-slate-900/90 text-white border-slate-700'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400" />}
            {toast.type === 'info' && <Info className="w-4 h-4 text-sky-400" />}
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* بدنه محتوای اصلی بر اساس تب فعال */}
      <main className="max-w-7xl w-full mx-auto px-4 py-6 flex-1">
        {activeTab === 'dashboard' && (
          <DashboardView
            invoices={invoices}
            config={config}
            setActiveTab={setActiveTab}
            onSelectInvoice={(inv) => {
              setEditingInvoice(inv);
              setActiveTab('invoices_list');
            }}
          />
        )}

        {activeTab === 'new_invoice' && (
          <InvoiceBuilderView
            config={config}
            existingInvoices={invoices}
            initialInvoice={editingInvoice}
            onSaveInvoice={handleSaveInvoice}
            onCancel={() => {
              setEditingInvoice(null);
              setActiveTab('dashboard');
            }}
          />
        )}

        {activeTab === 'invoices_list' && (
          <InvoiceListView
            invoices={invoices}
            config={config}
            onNewInvoice={() => {
              setEditingInvoice(null);
              setActiveTab('new_invoice');
            }}
            onEditInvoice={(inv) => {
              setEditingInvoice(inv);
              setActiveTab('new_invoice');
            }}
            onDeleteInvoice={handleDeleteInvoice}
            onSendInvoice={handleSendInvoice}
            onSendBatch={handleSendBatch}
            onIssueCorrection={handleIssueCorrection}
            onIssueCancellation={handleIssueCancellation}
            onImportCsv={(imported) => {
              const merged = [...imported, ...invoices];
              saveInvoicesList(merged);
              setInvoices(merged);
              showToast('success', `${imported.length} صورتحساب از فایل اکسل وارد سامانه شدند.`);
            }}
            onUpdateInvoice={handleUpdateSingleInvoice}
          />
        )}

        {activeTab === 'tax_id_calc' && <TaxIdCalculatorView config={config} />}

        {activeTab === 'moadian_api' && (
          <MoadianApiView
            config={config}
            invoices={invoices}
            onUpdateInvoiceStatus={handleUpdateInvoiceStatus}
          />
        )}

        {activeTab === 'stuff_catalog' && <StuffCatalogView />}

        {activeTab === 'settings' && (
          <SettingsView
            config={config}
            onSaveConfig={handleSaveConfig}
            onResetSampleData={handleResetSampleData}
          />
        )}

        {activeTab === 'rules_guide' && <RulesGuideView />}
      </main>

      {/* فوتر رسمی سامانه */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">
              سامانه ارسال صورتحساب الکترونیکی به سامانه مودیان
            </span>
            <span className="text-slate-300">|</span>
            <span>طراحی‌شده بر پایه استاندارد ملی و دستورالعمل‌های رسمی سازمان امور مالیاتی کشور</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>الگوریتم ورهوف D5</span>
            <span>•</span>
            <span>امضای RSA-2048 PKCS#8</span>
            <span>•</span>
            <span>مهلت ۲۱ روزه قانون تسهیل</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
