import * as cheerio from 'cheerio';
import {ScrapeResponse, SiteDefinition, SiteId} from '../type/types';

export const staatsloterij: SiteDefinition = {
    id: SiteId.STAATSLOTERIJ,
    name: 'Staatsloterij',
    baseUrl: 'https://staatsloterij.nederlandseloterij.nl',
    promotionsPath: 'acties',
    color: 0xFF6601,
    logoUrl: 'https://cdn.aptoide.com/imgs/7/5/3/753876c1018f55f7edec883675d9b054_icon.png',
    scrape: async (html: string) => {
        const $ = cheerio.load(html);
        const promotions: ScrapeResponse = [];

        const promotionCards = $('main section').eq(1).find('> div').children();

        promotionCards.slice(1, -1).each((_, element) => {
            const $card = $(element);
            const $title = $card.find('h3,h2');
            const $ctaLink = $card.find('a').last();

            const title = $title.text().trim();
            const description = $title.next().text().trim();
            const imageUrl = $card.find('img').attr('src') || '';
            const ctaText = $ctaLink.text().trim();
            const ctaUrl = $ctaLink.attr('href') || '';

            if (title && description && ctaUrl) {
                promotions.push({title, description, imageUrl, ctaText, ctaUrl});
            }
        });

        return promotions;
    },
};
