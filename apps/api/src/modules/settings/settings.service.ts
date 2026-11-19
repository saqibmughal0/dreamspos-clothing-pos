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
}

const DEFAULT_SETTINGS: ClothingBusinessSettings = {
  shopName: "",
  brandName: "",
  logo: "assets/img/logo.png",
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
  }
}

export class SettingsService {
  async getSettings(companyId: string): Promise<ClothingBusinessSettings> {
    const records = await prisma.setting.findMany({
      where: { companyId, group: "BUSINESS" }
    });

    if (!records || records.length === 0) {
      return DEFAULT_SETTINGS;
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
      ...map
    };
  }

  async updateSettings(companyId: string, input: Partial<ClothingBusinessSettings>): Promise<ClothingBusinessSettings> {
    const keys = Object.keys(input) as (keyof ClothingBusinessSettings)[];

    for (const key of keys) {
      const val = input[key];
      const stringValue = typeof val === "object" ? JSON.stringify(val) : String(val);

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
