import {Promotion, SiteDefinition} from "../type/types";
import {sanitizeUrl} from "./sanitizer";

export const sendDiscordNotification = async (
    promotion: Promotion,
    site: SiteDefinition,
    webhookUrl: string,
): Promise<void> => {
    if (!webhookUrl) {
        console.error('Discord webhook URL not configured');
        return;
    }

    try {
        const embed = {
            title: promotion.title,
            description: promotion.description,
            color: site.color,
            author: {
                name: `Nieuwe ${site.name} promotie!`,
            },
            image: promotion.imageUrl ? {url: sanitizeUrl(site, promotion.imageUrl)} : undefined,
            timestamp: new Date().toISOString(),
            footer: {
                text: `${site.name} Promotions`,
            },
        };

        const components = promotion.ctaUrl && promotion.ctaText ? [{
            type: 1, // Action Row
            components: [{
                type: 2, // Button
                style: 5, // Link button
                label: promotion.ctaText,
                url: sanitizeUrl(site, promotion.ctaUrl),
            }],
        }] : [];

        const payload = {
            content: '',
            embeds: [embed],
            username: `${site.name} Acties`,
            avatar_url: site.logoUrl,
            components,
        };

        const response = await fetch(`${webhookUrl}?with_components=true`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });


        if (!response.ok) {
            console.error(await response.text());
            console.error(`Discord API error! status: ${response.status}`);
        }

        console.log(`[${site.name}] Notification sent for: ${promotion.title}`);
    } catch (error) {
        console.error('Error sending Discord notification:', error);
    }
}
