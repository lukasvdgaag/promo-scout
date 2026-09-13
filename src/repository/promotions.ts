import {createHash} from 'crypto';
import {Cache, Config, Promotion, ScrapeResult, SiteDefinition} from "../type/types";
import {getPromotionsForSite, loadCache, saveCache} from '../util/cache';
import {sendDiscordNotification} from '../util/messenger';
import {sites} from '../sites';

const generatePromotionId = (promotion: Omit<Promotion, 'id'>): string => {
    const str = `${promotion.source}-${promotion.title}-${promotion.ctaUrl}`;
    return createHash('sha256').update(str).digest('hex');
}

const scrapeSite = async (site: SiteDefinition): Promise<ScrapeResult> => {
    try {
        const promotionsPath = `${site.baseUrl}/${site.promotionsPath}`;
        console.log(`[${site.name}] Fetching promotions from ${promotionsPath}...`);

        const response = await fetch(promotionsPath, {headers: site.fetchHeaders});
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const html = await response.text();
        const rawPromotions = await site.scrape(html);

        return {
            ok: true,
            promotions: rawPromotions.map(p => ({
                ...p,
                source: site.id,
                scrapedAt: new Date().toISOString(),
            }))
        };
    } catch (error) {
        console.error(`[${site.name}] Error scraping:`, error);
        return {
            ok: false,
            error
        };
    }
}

export const checkForNewPromotions = async (config: Config): Promise<void> => {
    console.log('Checking for new promotions across all sites...');

    const cache = loadCache(config);
    const allCurrentPromotions: Promotion[] = [];

    for (const site of sites) {
        const scrapeResult = await scrapeSite(site);

        if (!scrapeResult.ok) {
            console.log(`[${site.name}] Scrape failed, preserving existing cached promotions`);
            // Keep existing cached promotions for this site
            allCurrentPromotions.push(...getPromotionsForSite(cache, site.id));
            continue;
        }

        // On success (even if result is empty), update cached entries for this site to match new scrape
        const rawPromotions = scrapeResult.promotions;

        // Tag with IDs
        const currentPromotions: Promotion[] = rawPromotions.map(p => {
            const id = generatePromotionId(p);
            return {...p, id} as Promotion;
        });

        // Find new promotions (compare only within same source)
        const cachedIds = new Set(getPromotionsForSite(cache, site.id).map(p => p.id));
        const newPromotions = currentPromotions.filter(p => !cachedIds.has(p.id));

        console.log(`[${site.name}] Found ${currentPromotions.length} promotions, ${newPromotions.length} new`);

        // Send notifications for new promotions
        for (const promotion of newPromotions) {
            await sendDiscordNotification(promotion, site, config.webhookUrl);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Always use only currentPromotions for this site
        allCurrentPromotions.push(...currentPromotions);

        // Delay between sites to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Update cache with all current promotions
    const updatedCache: Cache = {
        promotions: allCurrentPromotions,
        lastChecked: new Date().toISOString(),
    };

    saveCache(config, updatedCache);
}
