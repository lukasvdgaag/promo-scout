import * as cheerio from 'cheerio';
import {chromium} from 'playwright';
import {ScrapeResponse, SiteDefinition, SiteId} from '../type/types';

const BASE_URL = 'https://www.joy-pepsico.eu';

function toAbsolute(url: string): string {
    if (!url) return '';
    return url.startsWith('http') ? url : `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

export const pepsiCo: SiteDefinition = {
    id: SiteId.PEPSI_CO,
    name: 'Joy by PepsiCo',
    baseUrl: BASE_URL,
    promotionsPath: 'nl-nl/acties',
    color: 0x004B93,
    logoUrl: 'https://www.joy-pepsico.eu/themes/custom/barrio_pepsico_joypepsico/assets/images/footer-logo-UK.png',
    // Imperva Incapsula serves a JavaScript challenge that only a real browser can solve.
    // Playwright runs headless Chromium which executes the challenge and receives the actual page.
    fetchHtml: async (url: string): Promise<string> => {
        const browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        });
        try {
            const context = await browser.newContext({
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
                locale: 'nl-NL',
                extraHTTPHeaders: {'Accept-Language': 'nl-NL,nl;q=0.9,en;q=0.8'},
            });
            const page = await context.newPage();
            await page.goto(url, {waitUntil: 'networkidle', timeout: 30000});
            return await page.content();
        } finally {
            await browser.close();
        }
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
