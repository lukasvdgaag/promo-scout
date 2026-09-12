# PromoScout

PromoScout is a TypeScript-based Discord bot that aggregates promotions and giveaways from multiple TV, radio, and other sites and sends notifications when new promotions appear.

## Features

- 📡 Multi-site promotion aggregation: Staatsloterij, Talpa Network (SBS6, NET5), SkyRadio, Radio10, Radio538
- 🔍 Site-specific scrapers with a shared parsing/cache/notification pipeline
- ⏱️ Configurable check interval (default: 12 hours)
- 💾 Local caching to detect and persist promotions between runs
- 🔔 Discord notifications with rich embeds, images and CTA buttons
- 🔁 Idempotent detection to avoid duplicate notifications
- 🧩 Extensible architecture: add new site scrapers under `src/sites`
- 🚀 Written in TypeScript with type safety

## Supported sites

<img alt="Talpa" height="48" src="docs/img/staatsloterij-icon.png" width="48"/> <img alt="Talpa" height="48" src="docs/img/talpa-icon.png" width="48"/> <img alt="Talpa" height="48" src="docs/img/skyradio-icon.png" width="48"/> <img alt="Talpa" height="48" src="docs/img/radio10-icon.png" width="48"/> <img alt="Talpa" height="48" src="docs/img/radio538-icon.png" width="48"/> <img alt="Coca-Cola" height="48" src="https://images.seeklogo.com/logo-png/3/1/coca-cola-logo-png_seeklogo-32896.png">

- Staatsloterij
- Talpa Network Television (SBS6, NET5 and related channels)
- SkyRadio
- Radio10
- Radio538
- Coca-Cola

## Setup

### 1. Install Dependencies

```bash
yarn install
```

### 2. Configure Discord Webhook

1. Go to your Discord server
2. Navigate to **Server Settings** → **Integrations** → **Webhooks**
3. Click **New Webhook** or select an existing one
4. Copy the Webhook URL
5. Create a `.env` file in the project root:

```bash
cp .env.example .env
```

6. Add your webhook URL to the `.env` file:

```
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN
```

### 3. Build the Project

```bash
yarn build
```

### 4. Run the Bot

#### Development Mode (with auto-restart)

```bash
yarn dev
```

#### Production Mode

```bash
yarn start
```

## How It Works

1. **Site scrapers**: Each supported site has a scraper module under `src/sites/` that knows how to fetch and parse that site's promotion pages.
2. **Normalization**: Scraped promotions are normalized into a common promotion shape (`src/type/types.ts`).
3. **Caching**: Promotions are stored in `promotions-cache.json` with unique IDs to track which promotions were already seen.
4. **Detection**: New promotions are identified by comparing fetched IDs with the cache.
5. **Notification**: The bot sends Discord webhook messages (rich embeds) for newly detected promotions:
    - Promotion title
    - Description (if available)
    - Banner image (if available)
    - CTA button linking to the promotion

## Project Structure

```
├── src/
│   ├── index.ts          # Main bot code / scheduler
│   ├── sites/            # Site-specific scrapers (staatsloterij, talpa-sites, etc.)
│   └── repository/       # Cache & persistence helpers
├── dist/                 # Compiled JavaScript (generated)
├── promotions-cache.json # Local cache (auto-generated)
├── package.json
├── tsconfig.json
├── .env                  # Your configuration (not in git)
└── .env.example          # Example configuration
```

## Cache File

The bot creates a `promotions-cache.json` file that stores:

- All current promotions with their IDs
- Last check timestamp
- Full promotion details

**Note**: Do not delete this file while the bot is running, as it will resend all promotions as "new".

## Running as a Service

### Using PM2 (Recommended)

```bash
# Install PM2 globally
yarn install -g pm2

# Start the bot
pm2 start dist/index.js --name promoscout-bot

# Auto-start on system reboot
pm2 startup
pm2 save
```

### Using systemd (Linux)

Create `/etc/systemd/system/promoscout-bot.service`:

```ini
[Unit]
Description=PromoScout Discord Bot
After=network.target

[Service]
Type=simple
User=youruser
WorkingDirectory=/path/to/bot
ExecStart=/usr/bin/node /path/to/bot/dist/index.js
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Then:

```bash
sudo systemctl enable promoscout-bot
sudo systemctl start promoscout-bot
```

## Customization

### Change Check Interval

Edit the `checkInterval` in `src/index.ts`:

```typescript
const CONFIG = {
    // ...
    checkInterval: 12 * 60 * 60 * 1000, // 12 hours (in milliseconds)
};
```

## Other Notes

### Notes & site-specific tips

- Some sites have additional interactive features (e.g., Staatsloterij club polls). The scrapers only surface publicly-visible promotions and links — they do not automate interactive actions on external sites.

- If a site's HTML changes, update the corresponding scraper in `src/sites/`.

## License

MIT
