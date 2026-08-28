import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface TCMBCurrencyItem {
  Isim: string;
  CurrencyName: string;
  ForexBuying: number | string;
  ForexSelling: number | string;
  BanknoteBuying: number | string;
  BanknoteSelling: number | string;
  CrossRateUSD?: number | string;
  CrossRateOther?: number | string;
}

export async function GET() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch('https://hasanadiguzel.com.tr/api/kurgetir', {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; ErsaSogutmaBot/1.0)'
      },
      next: { revalidate: 0 }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const kurListesi: TCMBCurrencyItem[] = data?.TCMB_AnlikKurBilgileri || [];

    const usdItem = kurListesi.find(
      (item) => item.Isim?.toUpperCase().includes('ABD DOLARI') || item.CurrencyName?.toUpperCase().includes('US DOLLAR')
    );

    const eurItem = kurListesi.find(
      (item) => item.Isim?.toUpperCase().includes('EURO') || item.CurrencyName?.toUpperCase().includes('EURO')
    );

    const gbpItem = kurListesi.find(
      (item) => item.Isim?.toUpperCase().includes('STERLİN') || item.CurrencyName?.toUpperCase().includes('POUND STERLING')
    );

    const parseRate = (val: number | string | undefined, fallback: number) => {
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        const parsed = parseFloat(val.replace(',', '.'));
        return isNaN(parsed) ? fallback : parsed;
      }
      return fallback;
    };

    const rates = {
      USD_TRY: parseRate(usdItem?.ForexSelling ?? usdItem?.ForexBuying, 38.45),
      USD_BUYING: parseRate(usdItem?.ForexBuying, 38.40),
      EUR_TRY: parseRate(eurItem?.ForexSelling ?? eurItem?.ForexBuying, 42.10),
      EUR_BUYING: parseRate(eurItem?.ForexBuying, 42.00),
      GBP_TRY: parseRate(gbpItem?.ForexSelling ?? gbpItem?.ForexBuying, 48.90),
      GBP_BUYING: parseRate(gbpItem?.ForexBuying, 48.80),
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: rates,
      source: 'hasanadiguzel.com.tr / TCMB'
    });
  } catch (error) {
    console.error('Exchange rate fetch error:', error);

    // Fallback response in case of external API connection issue
    return NextResponse.json({
      success: false,
      error: 'Kur bilgisi anlık olarak çekilemedi, varsayılan kurlar kullanılıyor.',
      data: {
        USD_TRY: 38.45,
        USD_BUYING: 38.40,
        EUR_TRY: 42.10,
        EUR_BUYING: 42.00,
        GBP_TRY: 48.90,
        GBP_BUYING: 48.80,
        lastUpdated: new Date().toISOString()
      }
    });
  }
}
