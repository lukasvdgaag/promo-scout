import * as cheerio from 'cheerio';
import {ScrapeResponse, SiteDefinition, SiteId} from '../type/types';

const BASE_URL = 'https://www.coca-cola.com';

async function fetchOfferingTitle(url: string): Promise<string | null> {
    try {
        const response = await fetch(url);
        if (!response.ok) return null;
        const html = await response.text();
        const $ = cheerio.load(html);
        const ogTitle = $('meta[property="og:title"]').attr('content');
        if (ogTitle) {
            return ogTitle.replace(/\s*\|.*$/, '').trim();
        }
        const title = $('title').text().trim();
        return title.replace(/\s*\|.*$/, '').trim() || null;
    } catch {
        return null;
    }
}

export const cocaCola: SiteDefinition = {
    id: SiteId.COCA_COLA,
    name: 'Coca-Cola',
    baseUrl: BASE_URL,
    promotionsPath: 'nl/nl/offerings',
    color: 0xE61A2B,
    logoUrl: 'https://images.seeklogo.com/logo-png/3/1/coca-cola-logo-png_seeklogo-32896.png',
    scrape: async (html: string): Promise<ScrapeResponse> => {
        const $ = cheerio.load(html);
        const candidates: Array<{ctaUrl: string; imageUrl: string}> = [];

        // Active campaigns appear exclusively in the hero carousel
        $('.carousel--hero .cmp-carousel__item').each((_, el) => {
            const $item = $(el);
            const href = $item.find('.cmp-teaser__link').attr('href') || '';
            const src = $item.find('img.cmp-image__image').attr('src') || '';

            if (href && !href.startsWith('#')) {
                const ctaUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;
                const imageUrl = src.startsWith('http') ? src : `${BASE_URL}${src}`;
                candidates.push({ctaUrl, imageUrl});
            }
        });

        const promotions = await Promise.all(
            candidates.map(async ({ctaUrl, imageUrl}) => {
                const title = await fetchOfferingTitle(ctaUrl);
                if (!title) return null;
                return {title, imageUrl, ctaText: 'Bekijk actie', ctaUrl};
            })
        );

        return promotions.filter((p): p is NonNullable<typeof p> => p !== null);
    },
};
