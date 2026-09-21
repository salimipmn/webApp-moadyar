/**
 * انواع و ساختارهای داده سامانه مودیان مالیاتی کشور
 * منطبق با مستندات فنی و الگوهای رسمی سازمان امور مالیاتی
 */

// نوع صورتحساب (inty)
export enum InvoiceType {
  TYPE_1 = 1, // نوع اول (فروش با اطلاعات کامل خریدار)
  TYPE_2 = 2, // نوع دوم (فروش به مصرف‌کننده نهایی / پایانه فروشگاهی بدون اطلاعات خریدار)
  TYPE_3 = 3, // نوع سوم (رسید دستگاه کارتخوان یا درگاه پرداخت)
}

// الگوی صورتحساب (inp)
export enum InvoicePattern {
  GENERAL_SALE = 1,     // الگوی ۱: فروش عمومی کالا و خدمات
  CURRENCY_EXCHANGE = 2, // الگوی ۲: فروش ارز (صرافی‌ها)
  GOLD_JEWELRY = 3,     // الگوی ۳: طلا، جواهر و پلاتین
  CONTRACTING = 4,      // الگوی ۴: پیمانکاری
  UTILITY_BILL = 5,     // الگوی ۵: قبوض خدماتی
  PLANE_TICKET = 6,     // الگوی ۶: بلیط هواپیما و حمل و نقل
  EXPORT = 7,           // الگوی ۷: صادرات
}

// موضوع صورتحساب (ins)
export enum InvoiceSubject {
  ORIGINAL = 1,     // اصلی
  CORRECTION = 2,   // اصلاحی
  CANCELLATION = 3, // ابطالی
  RETURN = 4,       // برگشت از فروش
}

// روش تسویه (setm)
export enum SettlementType {
  CASH = 1,        // نقدی
  CREDIT = 2,      // نسیه
  CASH_CREDIT = 3, // نقد و نسیه (اقساطی)
}

// نوع شخص خریدار (tob)
export enum BuyerType {
  LEGAL = 1,     // حقوقی
  REAL = 2,      // حقیقی
  CIVIL = 3,      // مشارکت مدنی
  FOREIGN = 4,   // اتباع غیر ایرانی
  CONSUMER = 5,  // مصرف‌کننده نهایی
}

// وضعیت‌های واقعی گردش صورتحساب در سامانه مودیان و کارپوشه
export type InvoiceStatus =
  | 'draft'        // ۱. پیش‌نویس محلی (در سامانه بارگذاری نشده و در پرونده مودی قرار نگرفته است)
  | 'pending_send' // ۲. آماده ارسال (امضا شده و در صف ارسال)
  | 'in_progress'  // ۳. ارسال‌شده به درگاه مودیان / در انتظار استعلام و پردازش (دارای UID)
  | 'in_cartable'  // ۴. مستقر در کارپوشه مودی / در انتظار تایید یا رد طرف معامله (مهلت ۳۰ روزه)
  | 'approved'     // ۵. تایید نهایی (تایید توسط خریدار در کارپوشه یا تایید خودکار سیستمی)
  | 'rejected'     // ۶. رد شده (رد به دلیل خطای ساختاری سازمان یا رد توسط خریدار)
  | 'cancelled';   // ۷. ابطال شده (باطل شده توسط صورتحساب ابطالی)

// اطلاعات تفصیلی گردش و وضعیت در کارپوشه مالیاتی
export interface CartableWorkflow {
  isUploadedToTax: boolean;            // آیا به سامانه مالیاتی ارسال و بارگذاری شده است؟
  isInTaxCartable: boolean;            // آیا تایید ساختاری شده و در پرونده و کارپوشه مودی نشسته است؟
  cartableUploadDate?: string;         // تاریخ و ساعت استقرار در کارپوشه
  uid?: string;                        // شناسه پیگیری / پکت سامانه مودیان (UID)
  referenceNumber?: string;            // شماره مرجع استعلام
  buyerActionStatus?: 'none' | 'pending' | 'accepted' | 'rejected' | 'system_confirmed'; // وضعیت اقدام خریدار
  buyerActionDeadline?: string;        // تاریخ پایان مهلت ۳۰ روزه خریدار
  daysRemaining?: number;              // روزهای باقیمانده از مهلت ۳۰ روزه
  lastInquiryDate?: string;            // تاریخ آخرین استعلام از کارپوشه
  validationErrors?: Array<{ code: string; message: string }>; // خطاهای استخراجی از سامانه
}

// اطلاعات هر ردیف کالا یا خدمت در صورتحساب (Body item)
export interface InvoiceItem {
  id: string;
  sstid: string;       // شناسه ۱۳ رقمی کالا / خدمت
  sstt: string;        // شرح کالا یا خدمت
  am: number;          // مقدار / تعداد
  mu: string;          // واحد اندازه‌گیری (عدد، کیلوگرم، متر، ساعت، ...)
  fee: number;         // مبلغ واحد (ریال)
  cpr?: number;        // نرخ برابری ارز
  prdis: number;       // مبلغ قبل از تخفیف (am * fee)
  dis: number;         // مبلغ تخفیف
  adis: number;        // مبلغ پس از تخفیف (prdis - dis)
  vra: number;         // نرخ مالیات بر ارزش افزوده (درصد مثلا ۱۰)
  vam: number;         // مبلغ مالیات بر ارزش افزوده (adis * vra / 100)
  odt?: string;        // موضوع سایر مالیات و عوارض
  odr?: number;        // نرخ سایر مالیات و عوارض
  odam?: number;       // مبلغ سایر مالیات و عوارض
  olt?: string;        // موضوع سایر وجوه قانونی
  olr?: number;        // نرخ سایر وجوه قانونی
  olam?: number;       // مبلغ سایر وجوه قانونی
  // اقلام اختصاصی الگوی طلا و جواهر
  consfee?: number;    // اجرت ساخت
  spro?: number;       // سود فروشنده
  bros?: number;       // حق‌العمل
  tcpbs?: number;      // مجموع اجرت، سود و حق‌العمل
  // اقلام اختصاصی صادرات و ارز
  cop?: number;        // سهم نقدی / ارزی
  vop?: number;        // مبلغ ارزی
  bsrn?: string;       // شناسه یکتای ثبت قرارداد
  tsstam: number;      // مبلغ کل ردیف (adis + vam + odam + olam)
}

// اطلاعات پرداخت (Payment)
export interface InvoicePayment {
  id: string;
  iinn?: string; // شماره پایانه / شماره کارتخوان
  acn?: string;  // شماره شبا یا حساب
  trmn?: string; // شماره پایانه
  trn?: string;  // شماره پیگیری / مرجع تراکنش
  pdt?: string;  // تاریخ و زمان پرداخت
  prm: number;   // مبلغ پرداخت شده (ریال)
  pmt: number;   // روش پرداخت (۱: پوز، ۲: درگاه اینترنتی، ۳: چک، ۴: کارت به کارت، ۵: پایا/ساتنا)
}

// هدر صورتحساب (Header)
export interface InvoiceHeader {
  taxid: string;       // شماره منحصر به فرد مالیاتی (۲۲ کاراکتر)
  indatim: number;     // زمان صدور صورتحساب (میلی‌ثانیه)
  indati2m: number;    // زمان ثبت صورتحساب در حافظه مالیاتی (میلی‌ثانیه)
  inty: InvoiceType;   // نوع صورتحساب
  inno: string;        // شماره سریال داخلی صورتحساب
  inp: InvoicePattern; // الگوی صورتحساب
  ins: InvoiceSubject; // موضوع صورتحساب
  tins: string;        // شماره اقتصادی فروشنده
  tob?: BuyerType;     // نوع خریدار
  bid?: string;        // شناسه / کد ملی خریدار
  tinb?: string;       // شماره اقتصادی خریدار
  bpc?: string;        // کد پستی خریدار
  bpn?: string;        // شماره گذرنامه خریدار
  sbc?: string;        // کد شعبه فروشنده
  bbc?: string;        // کد شعبه خریدار
  srtaxid?: string;    // شماره منحصر به فرد مالیاتی صورتحساب مرجع (در اصلاحی یا ابطالی)
  // اقلام اختصاصی الگوها
  ft?: number;         // نوع پرواز (۱ داخلی، ۲ خارجی)
  scc?: string;        // کد گمرک در صادرات
  crn?: string;        // شماره کوتاژ اظهارنامه گمرکی
  billid?: string;     // شناسه قبض در الگوی قبوض
  // مبالغ جمع‌کل (محاسبه خودکار)
  tprdis: number;      // مجموع مبلغ قبل از تخفیف
  tdis: number;        // مجموع تخفیفات
  tadis: number;       // مجموع مبلغ پس از تخفیف
  tvam: number;        // مجموع مالیات بر ارزش افزوده
  todam: number;       // مجموع سایر مالیات و عوارض
  tolam: number;       // مجموع سایر وجوه قانونی
  tbill: number;       // مبلغ کل صورتحساب (مجموع پرداختی خریدار)
  setm: SettlementType;// روش تسویه
  cap?: number;        // مبلغ پرداخت نقدی
  insp?: number;       // مبلغ نسیه
}

// صورتحساب کامل
export interface TaxInvoice {
  id: string;
  header: InvoiceHeader;
  body: InvoiceItem[];
  payments: InvoicePayment[];
  status: InvoiceStatus;
  createdAt: string;
  updatedAt: string;
  uid?: string;             // شناسه پیگیری برگشتی از سامانه مودیان
  referenceNumber?: string; // شماره پیگیری ارجاع
  cartable?: CartableWorkflow; // وضعیت و گردش تفصیلی در کارپوشه
  apiLogs?: Array<{
    timestamp: string;
    action: string;
    success: boolean;
    message: string;
    details?: any;
  }>;
}

// پیکربندی مودی و حافظه مالیاتی
export interface TaxpayerConfig {
  memoryId: string;       // شناسه یکتای حافظه مالیاتی (۶ کاراکتر)
  privateKeyPem: string;  // کلید خصوصی RSA
  publicKeyPem?: string;  // کلید عمومی RSA
  clientId: string;       // شناسه کلاینت (معمولاً شناسه ملی یا کد اقتصادی)
  tins: string;           // شماره اقتصادی فروشنده
  nationalCode: string;   // شناسه ملی شرکت یا کد ملی شخص
  companyName: string;    // نام شرکت / واحد کسب و کار
  postalCode: string;     // کد پستی واحد کسب و کار
  branchCode: string;     // کد شعبه (پیش‌فرض ۰۰۱)
  address?: string;       // نشانی کامل
  phone?: string;         // تلفن تماس
  environment: 'sandbox' | 'production'; // محیط سندباکس یا اصلی
  encryptionMethod: 'none' | 'aes' | 'direct';
  apiUrl?: string;        // آدرس درگاه وب‌سرویس سامانه مودیان
  sendMode?: 'direct' | 'tsp'; // روش ارسال: مستقیم به درگاه سازمان (Direct) یا شرکت معتمد (TSP)
  taxOrgPublicKey?: string;    // کلید عمومی رسمی سازمان امور مالیاتی جهت رمزنگاری JWE
  taxOrgKeyId?: string;        // شناسه کلید عمومی سازمان امور مالیاتی (kid)
  proxyUrl?: string;           // نشانی سرور پروکسی یا پل ارتباطی داخل ایران
}

// وضعیت موانع فنی ارسال مستقیم به کارپوشه
export interface DirectObstacleStatus {
  id: string;
  title: string;
  status: 'passed' | 'warning' | 'blocked';
  errorCode?: string;
  cause: string;
  solution: string;
  details?: any;
}

// کاتالوگ شناسه کالا و خدمت
export interface StuffCatalogItem {
  code: string;       // کد ۱۳ رقمی شناسه کالا/خدمت
  title: string;      // شرح کالا یا خدمت
  vatRate: number;    // درصد مالیات بر ارزش افزوده (مثلا ۰ یا ۱۰)
  unit: string;       // واحد سنجش پیش‌فرض
  category: string;   // دسته‌بندی
  isService?: boolean;// کالا است یا خدمت
  isCustom?: boolean; // تعریف‌شده توسط کاربر
}

// کد خطای سامانه مودیان
export interface TaxErrorCode {
  code: string;
  title: string;
  description: string;
  solution: string;
}
