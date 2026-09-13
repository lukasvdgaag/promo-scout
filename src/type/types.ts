// Types

export enum SiteId {
    STAATSLOTERIJ = 'staatsloterij',
    TALPA_NETWORK_TV = 'talpa_network_tv',
    SKYRADIO = 'skyradio',
    RADIO10 = 'radio10',
    RADIO538 = 'radio538',
    COCA_COLA = 'coca_cola',
    PEPSI_CO = 'pepsi_co',
}

export interface Promotion {
    id: string;
    source: SiteId;
    title: string;
    description?: string;
    imageUrl: string;
    ctaText: string;
    ctaUrl: string;
    scrapedAt: string;
}

export interface SiteDefinition {
    id: SiteId;
    name: string;
    baseUrl: string;
    promotionsPath: string;
    color: number;
    logoUrl: string;

    scrape(html: string): Promise<ScrapeResponse>;
}

export interface Cache {
    promotions: Promotion[];
    lastChecked: string;
}

// Results of trying to scrape a site
export type ScrapeResult =
    | { ok: true; promotions: Omit<Promotion, 'id'>[] }
    | { ok: false; error: any };

export interface Config {
    webhookUrl: string;
    cacheFile: string;
    checkInterval: number;
}

export type ScrapeResponse = Omit<Promotion, 'id' | 'source' | 'scrapedAt'>[]