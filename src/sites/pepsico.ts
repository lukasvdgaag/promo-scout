import * as cheerio from 'cheerio';
import {ScrapeResponse, SiteDefinition, SiteId} from '../type/types';

const BASE_URL = 'https://www.joy-pepsico.eu';

const BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'nl-NL,nl;q=0.9,en;q=0.8',
};

function toAbsolute(url: string): string {
    if (!url) return '';
    return url.startsWith('http') ? url : `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

// Extracts cookies from a response into a Cookie header value string.
// Uses getSetCookie() (Node 18.14+/undici) and falls back to get('set-cookie').
function extractCookies(response: Response): string {
    const setCookies: string[] =
        typeof (response.headers as any).getSetCookie === 'function'
            ? (response.headers as any).getSetCookie()
            : (response.headers.get('set-cookie') ?? '').split(/,(?=[^ ])/);
    return setCookies.map(c => c.split(';')[0]).filter(Boolean).join('; ');
}

export const pepsiCo: SiteDefinition = {
    id: SiteId.PEPSI_CO,
    name: 'Joy by PepsiCo',
    baseUrl: BASE_URL,
    promotionsPath: 'nl-nl/acties',
    color: 0x004B93,
    logoUrl: 'https://www.joy-pepsico.eu/themes/custom/barrio_pepsico_joypepsico/assets/images/footer-logo-UK.png',
    // Imperva/Incapsula sets session cookies on the first response that must be
    // echoed back, which plain fetch never does. We do an explicit two-request
    // handshake so the second request carries the cookies and gets through.
    fetchHtml: async (url: string): Promise<string> => {
        const res1 = await fetch(url, {headers: BROWSER_HEADERS});
        const cookies = extractCookies(res1);

        const headers: Record<string, string> = {...BROWSER_HEADERS};
        if (cookies) headers['Cookie'] = cookies;

        const res2 = await fetch(url, {headers});
        if (!res2.ok) throw new Error(`HTTP error! status: ${res2.status}`);
        return res2.text();
    },
    scrape: async (html: string): Promise<ScrapeResponse> => {
        const $ = cheerio.load(html);
        const seen = new Set<string>();
        const promotions: ScrapeResponse = [];

        // Scrape "Lopende acties" cards (ongoing promotions section)
        $('.brand-teaser-stacked-teasers .brand-teaser').each((_, el) => {
            const $el = $(el);
            if ($el.find('.brand-teaser-badge').text().includes('Beëindigd')) return;

            const title = $el.find('.brand-teaser__content h2').text().trim();
            const description = $el.find('.brand-teaser__content p').first().text().trim() || undefined;
            const ctaUrl = toAbsolute($el.find('.action-panel a.btn-primary').attr('href') || '');
            const imageUrl = toAbsolute($el.find('.brand-teaser__image img[alt^="brand teaser"]').attr('src') || '');

            if (!title || !ctaUrl || seen.has(ctaUrl)) return;
            seen.add(ctaUrl);
            promotions.push({title, description, imageUrl, ctaText: 'Ga naar de actie', ctaUrl});
        });

        // Scrape hero slides for any promotions not already in the cards section
        $('.brand-hero-slide-item').each((_, el) => {
            const $el = $(el);
            const $titleEl = $el.find('h2.brand-hero-slid-title');
            if (!$titleEl.length) return;

            const ctaUrl = toAbsolute($el.find('a.cta.primary-cta.filled').attr('href') || '');
            if (!ctaUrl || ctaUrl.includes('/consumer/') || seen.has(ctaUrl)) return;

            const title = $titleEl.find('p').first().text().trim();
            const description = $el.find('.brand-description p').first().text().trim() || undefined;
            const imageUrl = toAbsolute($el.find('.hero-image img').attr('src') || '');

            if (!title) return;
            seen.add(ctaUrl);
            promotions.push({title, description, imageUrl, ctaText: 'Ga naar de actie', ctaUrl});
        });

        return promotions;
    },
};
