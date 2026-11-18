import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createWindowsAppZip, type ExportAppConfig } from './server/windowsPackage.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const DEFAULT_INVITE_CODE = 'xZA6HzdXT';

function extractInviteCode(raw: string | undefined): string {
  const trimmed = (raw || '').trim();
  if (!trimmed) return DEFAULT_INVITE_CODE;
  const match = trimmed.match(/(?:discord\.gg\/|discord\.com\/invite\/)?([A-Za-z0-9-]{2,32})$/i);
  return match ? match[1] : DEFAULT_INVITE_CODE;
}

async function startServer() {
  const app = express();
  app.set('trust proxy', true);
  app.use(express.json({ limit: '256kb' }));

  // Allow custom domain requests (kinglock113.cc) and preflight checks
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (
      origin &&
      /^https?:\/\/([a-z0-9-]+\.)?kinglock113\.cc$/i.test(origin)
    ) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  // Live Discord invite metadata endpoint
  app.get('/api/discord/invite', async (req, res) => {
    const code = extractInviteCode(typeof req.query.code === 'string' ? req.query.code : undefined);
    try {
      const response = await fetch(
        `https://discord.com/api/v10/invites/${encodeURIComponent(code)}?with_counts=true`,
        {
          headers: {
            Accept: 'application/json',
          },
        }
      );

      if (!response.ok) {
        res.status(response.status).json({
          error: `Discord returned status ${response.status}`,
          code,
        });
        return;
      }

      const data = (await response.json()) as {
        code?: string;
        guild?: { id?: string; name?: string; icon?: string | null };
        channel?: { name?: string };
        inviter?: { username?: string; global_name?: string | null };
        approximate_member_count?: number;
        approximate_presence_count?: number;
      };

      const guildId = data.guild?.id || '';
      const iconHash = data.guild?.icon;
      const iconUrl =
        guildId && iconHash
          ? `https://cdn.discordapp.com/icons/${guildId}/${iconHash}.png?size=128`
          : null;

      res.json({
        code: data.code || code,
        inviteUrl: `https://discord.gg/${data.code || code}`,
        guildId,
        guildName: data.guild?.name || "Kinglock113's server",
        channelName: data.channel?.name || 'general',
        memberCount: data.approximate_member_count ?? null,
        onlineCount: data.approximate_presence_count ?? null,
        inviterName: data.inviter?.global_name || data.inviter?.username || 'Kinglock113',
        iconUrl,
      });
    } catch (err) {
      res.status(502).json({
        error: err instanceof Error ? err.message : 'Failed to reach Discord API',
        code,
      });
    }
  });

  // Forward user-configured Discord webhook messages from the app
  app.post('/api/discord/webhook', async (req, res) => {
    const { webhookUrl, title, description, fields, footer } = req.body as {
      webhookUrl?: string;
      title?: string;
      description?: string;
      fields?: { name: string; value: string; inline?: boolean }[];
      footer?: string;
    };

    if (
      typeof webhookUrl !== 'string' ||
      !/^https:\/\/(canary\.|ptb\.)?(discord|discordapp)\.com\/api\/webhooks\/\d+\/[\w-]+/.test(
        webhookUrl.trim()
      )
    ) {
      res.status(400).json({
        error: 'Enter a valid Discord webhook URL (https://discord.com/api/webhooks/...).',
      });
      return;
    }

    try {
      const payload = {
        username: 'kinglock113.cc',
        embeds: [
          {
            title: title || 'kinglock113.cc Macro Update',
            description: description || '',
            color: 0xff5a1f,
            fields: Array.isArray(fields) ? fields.slice(0, 8) : [],
            footer: footer ? { text: footer } : { text: 'kinglock113.cc' },
            timestamp: new Date().toISOString(),
          },
        ],
      };

      const discordRes = await fetch(webhookUrl.trim(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!discordRes.ok) {
        const text = await discordRes.text();
        res.status(discordRes.status).json({
          error: `Discord webhook rejected request (${discordRes.status}): ${text.slice(0, 140)}`,
        });
        return;
      }

      res.json({ ok: true });
    } catch (err) {
      res.status(502).json({
        error: err instanceof Error ? err.message : 'Failed to post to Discord webhook',
      });
    }
  });

  const buildDefaultExportConfig = (): ExportAppConfig => ({
    appName: 'kinglock113.cc',
    accent: '#ff5a1f',
    robloxOnly: true,
    hudEnabled: true,
    hudOnlyRoblox: true,
    hudCenterDot: true,
    hudOpacity: 85,
    discordInviteUrl: 'https://discord.gg/xZA6HzdXT',
    discordWebhookUrl: '',
    selectedIndex: 0,
    profiles: [
      {
        name: 'Clash',
        mode: 'hold',
        cps: 240,
        unlimited: false,
        holdMs: 1,
        burstCount: 10,
        hotkeyVk: 0x06,
        hotkeyLabel: 'Mouse 5',
        actions: [{ kind: 'key', vk: 0x46, label: 'F', enabled: true }],
      },
      {
        name: 'Slashes of Fury',
        mode: 'burst',
        cps: 40,
        unlimited: false,
        holdMs: 5,
        burstCount: 35,
        hotkeyVk: 0x04,
        hotkeyLabel: 'Mouse 3',
        actions: [{ kind: 'mouse', button: 'left', enabled: true }],
      },
      {
        name: 'Auto Click',
        mode: 'hold',
        cps: 60,
        unlimited: false,
        holdMs: 1,
        burstCount: 10,
        hotkeyVk: 0x05,
        hotkeyLabel: 'Mouse 4',
        actions: [{ kind: 'mouse', button: 'left', enabled: true }],
      },
    ],
  });

  app.get('/api/download/windows', (_req, res) => {
    const zipBuffer = createWindowsAppZip(buildDefaultExportConfig());
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="kinglock113-windows.zip"');
    res.send(zipBuffer);
  });

  app.post('/api/download/windows', (req, res) => {
    const fallback = buildDefaultExportConfig();
    const body = (req.body || {}) as Partial<ExportAppConfig>;
    const config: ExportAppConfig = {
      appName: typeof body.appName === 'string' && body.appName.trim() ? body.appName.trim() : fallback.appName,
      accent: typeof body.accent === 'string' && /^#[0-9a-f]{6}$/i.test(body.accent) ? body.accent : fallback.accent,
      robloxOnly: typeof body.robloxOnly === 'boolean' ? body.robloxOnly : fallback.robloxOnly,
      hudEnabled: typeof body.hudEnabled === 'boolean' ? body.hudEnabled : fallback.hudEnabled,
      hudOnlyRoblox: typeof body.hudOnlyRoblox === 'boolean' ? body.hudOnlyRoblox : fallback.hudOnlyRoblox,
      hudCenterDot: typeof body.hudCenterDot === 'boolean' ? body.hudCenterDot : fallback.hudCenterDot,
      hudOpacity: typeof body.hudOpacity === 'number' ? body.hudOpacity : fallback.hudOpacity,
      delayS: typeof body.delayS === 'number' ? body.delayS : 0,
      discordInviteUrl:
        typeof body.discordInviteUrl === 'string' && body.discordInviteUrl.trim()
          ? body.discordInviteUrl.trim()
          : fallback.discordInviteUrl,
      discordWebhookUrl:
        typeof body.discordWebhookUrl === 'string' ? body.discordWebhookUrl.trim() : '',
      selectedIndex: typeof body.selectedIndex === 'number' ? body.selectedIndex : 0,
      profiles:
        Array.isArray(body.profiles) && body.profiles.length > 0
          ? body.profiles
          : fallback.profiles,
    };

    const zipBuffer = createWindowsAppZip(config);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="kinglock113-windows.zip"');
    res.send(zipBuffer);
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
