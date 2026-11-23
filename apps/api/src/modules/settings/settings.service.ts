import { prisma } from "@dreamspos/database";

export interface ClothingBusinessSettings {
  shopName: string;
  brandName: string;
  logo: string;
  email: string;
  phone: string;
  address: string;
  website: string;
  taxNumber: string;
  currency: {
    code: string;
    symbol: string;
    position: "PREFIX" | "SUFFIX";
  };
  tax: {
    rate: number;
    type: "EXCLUSIVE" | "INCLUSIVE";
  };
  receipt: {
    headerMessage: string;
    footerMessage: string;
    showBarcode: boolean;
    showCashier: boolean;
    showCustomer: boolean;
  };
  printer: {
    paperSize: "80mm" | "58mm";
    autoCut: boolean;
    openCashDrawer: boolean;
  };
  barcodeLabel: {
    paperFormat: string;
    showStoreName: boolean;
    showPrice: boolean;
    showVariantSize: boolean;
    showVariantColor: boolean;
  };
  policies: {
    returnWindowDays: number;
    exchangeWindowDays: number;
    terms: string;
  };
  invoice: {
    prefix: string;
    dueDays: number;
    roundOff: boolean;
    roundOffType: "UP" | "DOWN" | "NEAREST";
    showCompanyDetails: boolean;
    headerTerms: string;
    footerTerms: string;
  };
  prefixes: {
    product: string;
    supplier: string;
    purchase: string;
    purchaseReturn: string;
    sale: string;
    saleReturn: string;
    customer: string;
    expense: string;
    stockTransfer: string;
    stockAdjustment: string;
    salesOrder: string;
    posInvoice: string;
    estimation: string;
    transaction: string;
    employee: string;
  };
  localization: {
    language: string;
    timezone: string;
    dateFormat: string;
    timeFormat: "12-hours" | "24-hours";
    financialYear: string;
    startingMonth: string;
    decimalSeparator: "." | ",";
    thousandSeparator: "," | ".";
  };
}

export const DEFAULT_SETTINGS: ClothingBusinessSettings = {
  shopName: "",
  brandName: "",
  logo: "",
  email: "",
  phone: "",
  address: "",
  website: "",
  taxNumber: "",
  currency: {
    code: "PKR",
    symbol: "Rs",
    position: "PREFIX"
  },
  tax: {
    rate: 0,
    type: "EXCLUSIVE"
  },
  receipt: {
    headerMessage: "",
    footerMessage: "Thank you for your purchase!",
    showBarcode: true,
    showCashier: true,
    showCustomer: true
  },
  printer: {
    paperSize: "80mm",
    autoCut: true,
    openCashDrawer: true
  },
  barcodeLabel: {
    paperFormat: "40mm x 30mm",
    showStoreName: true,
    showPrice: true,
    showVariantSize: true,
    showVariantColor: true
  },
  policies: {
    returnWindowDays: 7,
    exchangeWindowDays: 14,
    terms: ""
  },
  invoice: {
    prefix: "INV-",
    dueDays: 0,
    roundOff: false,
    roundOffType: "NEAREST",
    showCompanyDetails: true,
    headerTerms: "",
    footerTerms: ""
  },
  prefixes: {
    product: "SKU-",
    supplier: "SUP-",
    purchase: "PU-",
    purchaseReturn: "PR-",
    sale: "SA-",
    saleReturn: "SR-",
    customer: "CT-",
    expense: "EX-",
    stockTransfer: "ST-",
    stockAdjustment: "SAJ-",
    salesOrder: "SO-",
    posInvoice: "INV-",
    estimation: "EST-",
    transaction: "TRN-",
    employee: "EMP-"
  },
  localization: {
    language: "english",
    timezone: "Asia/Karachi",
    dateFormat: "DD MMM YYYY",
    timeFormat: "12-hours",
    financialYear: String(new Date().getFullYear()),
    startingMonth: "July",
    decimalSeparator: ".",
    thousandSeparator: ","
  }
};

const ALLOWED_KEYS = new Set<keyof ClothingBusinessSettings>([
  "shopName",
  "brandName",
  "logo",
  "email",
  "phone",
  "address",
  "website",
  "taxNumber",
  "currency",
  "tax",
  "receipt",
  "printer",
  "barcodeLabel",
  "policies",
  "invoice",
  "prefixes",
  "localization"
]);

const NESTED_OBJECT_KEYS = new Set<keyof ClothingBusinessSettings>([
  "currency",
  "tax",
  "receipt",
  "printer",
  "barcodeLabel",
  "policies",
  "invoice",
  "prefixes",
  "localization"
]);

export class SettingsValidationError extends Error {
  statusCode = 400;
  constructor(message: string) {
    super(message);
    this.name = "SettingsValidationError";
  }
}

function validateSettingsInput(input: Partial<ClothingBusinessSettings>): void {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new SettingsValidationError("Invalid settings payload");
  }

  if (input.email !== undefined && input.email !== "") {
    if (typeof input.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
      throw new SettingsValidationError("Invalid company email address format");
    }
  }

  if (input.website !== undefined && input.website !== "") {
    if (typeof input.website !== "string" || !/^(https?:\/\/)?[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(input.website.trim())) {
      throw new SettingsValidationError("Invalid website URL format");
    }
  }

  if (input.shopName !== undefined && typeof input.shopName !== "string") {
    throw new SettingsValidationError("Shop name must be a string");
  }

  if (input.currency !== undefined) {
    if (typeof input.currency !== "object" || input.currency === null) {
      throw new SettingsValidationError("Invalid currency settings");
    }
    if (input.currency.code !== undefined && (typeof input.currency.code !== "string" || !input.currency.code.trim() || input.currency.code.trim().length > 10)) {
      throw new SettingsValidationError("Currency code must be 1 to 10 characters");
    }
    if (input.currency.symbol !== undefined && (typeof input.currency.symbol !== "string" || !input.currency.symbol.trim() || input.currency.symbol.trim().length > 10)) {
      throw new SettingsValidationError("Currency symbol must be 1 to 10 characters");
    }
    if (input.currency.position !== undefined && !["PREFIX", "SUFFIX"].includes(input.currency.position)) {
      throw new SettingsValidationError("Currency position must be PREFIX or SUFFIX");
    }
  }

  if (input.tax !== undefined) {
    if (typeof input.tax !== "object" || input.tax === null) {
      throw new SettingsValidationError("Invalid tax settings");
    }
    if (input.tax.rate !== undefined) {
      const rate = Number(input.tax.rate);
      if (Number.isNaN(rate) || rate < 0 || rate > 100) {
        throw new SettingsValidationError("Tax rate must be a number between 0 and 100");
      }
    }
    if (input.tax.type !== undefined && !["EXCLUSIVE", "INCLUSIVE"].includes(input.tax.type)) {
      throw new SettingsValidationError("Tax type must be EXCLUSIVE or INCLUSIVE");
    }
  }

  if (input.printer !== undefined) {
    if (typeof input.printer !== "object" || input.printer === null) {
      throw new SettingsValidationError("Invalid printer settings");
    }
    if (input.printer.paperSize !== undefined && !["80mm", "58mm"].includes(input.printer.paperSize)) {
      throw new SettingsValidationError("Printer paper size must be 80mm or 58mm");
    }
  }

  if (input.policies !== undefined) {
    if (typeof input.policies !== "object" || input.policies === null) {
      throw new SettingsValidationError("Invalid policies settings");
    }
    if (input.policies.returnWindowDays !== undefined) {
      const days = Number(input.policies.returnWindowDays);
      if (Number.isNaN(days) || days < 0 || days > 365) {
        throw new SettingsValidationError("Return window days must be between 0 and 365");
      }
    }
    if (input.policies.exchangeWindowDays !== undefined) {
      const days = Number(input.policies.exchangeWindowDays);
      if (Number.isNaN(days) || days < 0 || days > 365) {
        throw new SettingsValidationError("Exchange window days must be between 0 and 365");
      }
    }
  }

  if (input.invoice !== undefined) {
    if (typeof input.invoice !== "object" || input.invoice === null) {
      throw new SettingsValidationError("Invalid invoice settings");
    }
    if (input.invoice.prefix !== undefined && (typeof input.invoice.prefix !== "string" || input.invoice.prefix.length > 20)) {
      throw new SettingsValidationError("Invoice prefix must be 20 characters or less");
    }
    if (input.invoice.dueDays !== undefined) {
      const due = Number(input.invoice.dueDays);
      if (Number.isNaN(due) || due < 0 || due > 365) {
        throw new SettingsValidationError("Invoice due days must be between 0 and 365");
      }
    }
    if (input.invoice.roundOffType !== undefined && !["UP", "DOWN", "NEAREST"].includes(input.invoice.roundOffType)) {
      throw new SettingsValidationError("Invoice round off type must be UP, DOWN, or NEAREST");
    }
  }

  if (input.prefixes !== undefined) {
    if (typeof input.prefixes !== "object" || input.prefixes === null) {
      throw new SettingsValidationError("Invalid prefixes settings");
    }
    for (const [k, v] of Object.entries(input.prefixes)) {
      if (v !== undefined && (typeof v !== "string" || v.length > 20)) {
        throw new SettingsValidationError(`Prefix "${k}" must be a string of 20 characters or less`);
      }
    }
  }

  if (input.localization !== undefined) {
    if (typeof input.localization !== "object" || input.localization === null) {
      throw new SettingsValidationError("Invalid localization settings");
    }
    if (input.localization.timeFormat !== undefined && !["12-hours", "24-hours"].includes(input.localization.timeFormat)) {
      throw new SettingsValidationError("Time format must be 12-hours or 24-hours");
    }
    if (input.localization.decimalSeparator !== undefined && ![".", ","].includes(input.localization.decimalSeparator)) {
      throw new SettingsValidationError("Decimal separator must be '.' or ','");
    }
    if (input.localization.thousandSeparator !== undefined && ![",", "."].includes(input.localization.thousandSeparator)) {
      throw new SettingsValidationError("Thousand separator must be ',' or '.'");
    }
  }
}

export class SettingsService {
  async getSettings(companyId: string): Promise<ClothingBusinessSettings> {
    const records = await prisma.setting.findMany({
      where: { companyId, group: "BUSINESS" }
    });

    if (!records || records.length === 0) {
      return structuredClone(DEFAULT_SETTINGS);
    }

    const map: Record<string, any> = {};
    for (const r of records) {
      try {
        map[r.key] = JSON.parse(r.value);
      } catch {
        map[r.key] = r.value;
      }
    }

    return {
      ...DEFAULT_SETTINGS,
      ...map,
      currency: { ...DEFAULT_SETTINGS.currency, ...(typeof map.currency === "object" && map.currency ? map.currency : {}) },
      tax: { ...DEFAULT_SETTINGS.tax, ...(typeof map.tax === "object" && map.tax ? map.tax : {}) },
      receipt: { ...DEFAULT_SETTINGS.receipt, ...(typeof map.receipt === "object" && map.receipt ? map.receipt : {}) },
      printer: { ...DEFAULT_SETTINGS.printer, ...(typeof map.printer === "object" && map.printer ? map.printer : {}) },
      barcodeLabel: { ...DEFAULT_SETTINGS.barcodeLabel, ...(typeof map.barcodeLabel === "object" && map.barcodeLabel ? map.barcodeLabel : {}) },
      policies: { ...DEFAULT_SETTINGS.policies, ...(typeof map.policies === "object" && map.policies ? map.policies : {}) },
      invoice: { ...DEFAULT_SETTINGS.invoice, ...(typeof map.invoice === "object" && map.invoice ? map.invoice : {}) },
      prefixes: { ...DEFAULT_SETTINGS.prefixes, ...(typeof map.prefixes === "object" && map.prefixes ? map.prefixes : {}) },
      localization: { ...DEFAULT_SETTINGS.localization, ...(typeof map.localization === "object" && map.localization ? map.localization : {}) }
    };
  }

  async updateSettings(companyId: string, input: Partial<ClothingBusinessSettings>): Promise<ClothingBusinessSettings> {
    validateSettingsInput(input);

    const existing = await this.getSettings(companyId);
    const keys = (Object.keys(input) as (keyof ClothingBusinessSettings)[]).filter((k) =>
      ALLOWED_KEYS.has(k) && input[k] !== undefined
    );

    for (const key of keys) {
      const val = input[key];
      let stringValue: string;

      if (NESTED_OBJECT_KEYS.has(key) && typeof val === "object" && val !== null) {
        const merged = {
          ...(existing[key] as Record<string, any>),
          ...(val as Record<string, any>)
        };
        stringValue = JSON.stringify(merged);
      } else {
        stringValue = typeof val === "object" ? JSON.stringify(val) : String(val);
      }

      await prisma.setting.upsert({
        where: {
          companyId_group_key: {
            companyId,
            group: "BUSINESS",
            key
          }
        },
        create: {
          companyId,
          group: "BUSINESS",
          key,
          value: stringValue
        },
        update: {
          value: stringValue
        }
      });
    }

    return this.getSettings(companyId);
  }
}

export const settingsService = new SettingsService();
