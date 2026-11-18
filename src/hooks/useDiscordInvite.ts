import { useCallback, useEffect, useState } from 'react';
import {
  DISCORD_INVITE_CODE,
  DISCORD_INVITE_URL,
  type DiscordInviteInfo,
} from '../types/bladeturbo';

export function useDiscordInvite(inviteUrlOrCode?: string) {
  const [info, setInfo] = useState<DiscordInviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const code = (() => {
    const raw = (inviteUrlOrCode || '').trim();
    if (!raw) return DISCORD_INVITE_CODE;
    const match = raw.match(/(?:discord\.gg\/|discord\.com\/invite\/)?([A-Za-z0-9-]{2,32})$/i);
    return match ? match[1] : DISCORD_INVITE_CODE;
  })();

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/discord/invite?code=${encodeURIComponent(code)}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Unable to reach Discord (${res.status})`);
      }
      setInfo(data as DiscordInviteInfo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to fetch Discord server status');
      setInfo({
        code,
        inviteUrl: DISCORD_INVITE_URL,
        guildId: '',
        guildName: "Kinglock113's server",
        channelName: 'general',
        memberCount: null,
        onlineCount: null,
        inviterName: 'Kinglock113',
        iconUrl: null,
      });
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { info, loading, error, refresh };
}
