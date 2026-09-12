import * as cheerio from 'cheerio';
import {SiteDefinition, SiteId} from '../type/types';

/**
 * Shared scraper for Talpa Network WebX sites.
 * All these sites use the same component structure.
 */
async function scrapeTalpaSite(html: string, baseUrl: string): ReturnType<SiteDefinition['scrape']> {
    const $ = cheerio.load(html);
    const promotions: Awaited<ReturnType<SiteDefinition['scrape']>> = [];
    const fallbackCandidates: {title: string; imageUrl: string; ctaUrl: string}[] = [];

    // Cards in the promotions grid each contain an h6 title and an img.
    // A [data-label] element inside the card carries the status text.
    $('#page-container a').has('h6').each((_, element) => {
        const $card = $(element);

        const title = $card.find('h6').text().trim();
        const imageUrl = $card.find('img').attr('src') || '';
        const ctaUrl = $card.attr('href') || '';
        const statusLabel = $card.find('[data-label]').attr('data-label');

        if (!title || !ctaUrl) {
            return;
        }

        // Only include cards that have a status label AND are not expired.
        const hasValidStatusLabel = statusLabel && statusLabel.includes("Doe mee");

        if (hasValidStatusLabel) {
            promotions.push({
                title,
                imageUrl,
                ctaText: 'Bekijk actie',
                ctaUrl,
            });
        } else {
            fallbackCandidates.push({title, imageUrl, ctaUrl});
        }
    });

    // For cards without a valid status label, fetch the promotion page and
    // include it if there's an <a> containing "Speel hier" — some active
    // promotions don't advertise their status on the overview page.
    const fallbackResults = await Promise.all(
        fallbackCandidates.map(async (candidate) => {
            const isPlayable = await promotionPageHasSpeelHier(candidate.ctaUrl, baseUrl);
            return isPlayable ? candidate : null;
        }),
    );

    for (const candidate of fallbackResults) {
        if (candidate) {
            promotions.push({
                title: candidate.title,
                imageUrl: candidate.imageUrl,
                ctaText: 'Bekijk actie',
                ctaUrl: candidate.ctaUrl,
            });
        }
    }

    return promotions;
}

async function promotionPageHasSpeelHier(ctaUrl: string, baseUrl: string): Promise<boolean> {
    try {
        const absoluteUrl = new URL(ctaUrl, baseUrl).toString();
        const response = await fetch(absoluteUrl);
        if (!response.ok) {
            return false;
        }
        const html = await response.text();
        const $ = cheerio.load(html);
        return $('a').filter((_, el) => $(el).text().includes('Speel hier')).length > 0;
    } catch {
        return false;
    }
}

export const talpaNetworkTv: SiteDefinition = {
    id: SiteId.TALPA_NETWORK_TV,
    name: 'Talpa Network TV',
    baseUrl: 'https://www.kijkers.tv',
    promotionsPath: 'acties',
    logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSfbEJOOIkjqIA770tnNG2NGWGBw0Z6IS0l8W0A6SmlK_1eoLYfMol2KwQ&s=10',
    color: 0x385CF2,
    scrape(html: string) {
        return scrapeTalpaSite(html, this.baseUrl);
    },
};

export const skyradio: SiteDefinition = {
    id: SiteId.SKYRADIO,
    name: 'Sky Radio',
    baseUrl: 'https://www.skyradio.nl',
    promotionsPath: 'acties',
    color: 0x007CDF,
    logoUrl: 'https://play-lh.googleusercontent.com/XUa9oAUYJ5WhYp50GpWYjTKqOC1tf34i1ZKTdSvqlCM-S5gTHkRr4jDcSqq_PEF_OwRF7kvDXI5f6ZanZn0X',
    scrape(html: string) {
        return scrapeTalpaSite(html, this.baseUrl);
    },
};

export const radio10: SiteDefinition = {
    id: SiteId.RADIO10,
    name: 'Radio 10',
    baseUrl: 'https://www.radio10.nl',
    promotionsPath: 'acties',
    color: 0x00D473,
    logoUrl: 'https://play-lh.googleusercontent.com/YabhOMIvTuI8410C8XeerOOJtr2T27K4zmgJBJQI2mrBENdpUHiqwkoqkLwtTKydCZrNqOI9aenU3EFCuWwwFQ=w240-h480-rw',
    scrape(html: string) {
        return scrapeTalpaSite(html, this.baseUrl);
    },
};

export const radio538: SiteDefinition = {
    id: SiteId.RADIO538,
    name: 'Radio 538',
    baseUrl: 'https://www.538.nl',
    promotionsPath: 'acties',
    color: 0xA400F9,
    logoUrl: 'https://assets.radioplayer.org/528/528201/600/600/mcoozihv.png',
    scrape(html: string) {
        return scrapeTalpaSite(html, this.baseUrl);
    },
};

