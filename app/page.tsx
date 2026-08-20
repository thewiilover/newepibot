"use client";

import { useEffect, useMemo, useState } from "react";

type UserState = { id: string; username: string; avatar?: string | null } | null;
type Guild = { id: string; name: string; icon: string | null };
type Channel = { id: string; name: string; type: number };
type Role = { id: string; name: string };
type Track = { id: string; title: string; source: string; nextAiringAt: string | null; nextEpisode: number | null; lastNotifiedEpisode: number | null };

export default function Page() {
  const [user, setUser] = useState<UserState>(null);
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [guildId, setGuildId] = useState("");
  const [channels, setChannels] = useState<Channel[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [channelId, setChannelId] = useState("");
  const [roleId, setRoleId] = useState("");
  const [aniListUser, setAniListUser] = useState("");
  const [malMessage, setMalMessage] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedGuildName, selectedChannelName] = useMemo(() => {
    const guild = guilds.find((item) => item.id === guildId);
    const channel = channels.find((item) => item.id === channelId);
    return [guild?.name ?? "No guild selected", channel?.name ?? "No channel selected"];
  }, [channelId, channels, guildId, guilds]);

  async function loadAuthState() {
    const response = await fetch("/api/auth/me", { cache: "no-store" });
    if (response.ok) {
      const payload = (await response.json()) as { user: UserState };
      setUser(payload.user);
    } else {
      setUser(null);
    }
  }

  async function loadGuilds() {
    const response = await fetch("/api/discord/guilds", { cache: "no-store" });
    if (!response.ok) return;
    const payload = (await response.json()) as { guilds: Guild[] };
    setGuilds(payload.guilds);
    if (!guildId && payload.guilds[0]) {
      setGuildId(payload.guilds[0].id);
    }
  }

  async function loadTracks() {
    const response = await fetch("/api/anime/tracks", { cache: "no-store" });
    if (!response.ok) return;
    const payload = (await response.json()) as { tracks: Track[] };
    setTracks(payload.tracks);
  }

  async function loadGuildDetails(nextGuildId = guildId) {
    if (!nextGuildId) return;
    const response = await fetch(`/api/discord/guilds/${nextGuildId}`, { cache: "no-store" });
    if (!response.ok) return;
    const payload = (await response.json()) as { channels: Channel[]; roles: Role[]; config: { channelId: string; roleId: string | null } | null };
    setChannels(payload.channels.filter((item) => item.type === 0 || item.type === 5 || item.type === 2));
    setRoles(payload.roles);
    setChannelId(payload.config?.channelId ?? payload.channels[0]?.id ?? "");
    setRoleId(payload.config?.roleId ?? "");
  }

  useEffect(() => {
    void loadAuthState();
    void loadGuilds();
    void loadTracks();
  }, []);

  useEffect(() => {
    void loadGuildDetails(guildId);
  }, [guildId]);

  async function saveConfig() {
    if (!guildId || !channelId) return;
    const response = await fetch(`/api/discord/guilds/${guildId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channelId, roleId: roleId || null }),
    });

    if (response.ok) {
      setMessage("Notification target saved.");
    }
  }

  async function importAniList() {
    const response = await fetch("/api/anime/import/anilist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: aniListUser }),
    });

    if (response.ok) {
      setMessage(`Imported AniList watch list for ${aniListUser}.`);
      await loadTracks();
    }
  }

  async function importMal(file: File | null) {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/anime/import/mal", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      setMalMessage(`Imported ${file.name}.`);
      await loadTracks();
    }
  }

  async function removeTrack(id: string) {
    if (!confirm("Remove this anime from tracking?")) return;
    try {
      const res = await fetch(`/api/anime/tracks/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMessage("Removed from tracking.");
        // Refresh the UI automatically after confirmation
        window.location.reload();
      } else {
        const body = await res.json().catch(() => null);
        setMessage(`Remove failed: ${body?.error ?? res.statusText}`);
      }
    } catch (e: any) {
      setMessage(`Remove error: ${e.message ?? e}`);
    }
  }

  async function forceSendLatestEpisode(id: string) {
    try {
      const res = await fetch(`/api/anime/tracks/${id}/force-send`, { method: "POST" });
      if (res.ok) {
        const body = (await res.json()) as { title?: string; episode?: number | null };
        setMessage(`Force sent for ${body.title ?? "tracked series"}${body.episode ? ` episode ${body.episode}` : ""}.`);
        await loadTracks();
      } else {
        const body = await res.json().catch(() => null);
        setMessage(`Force send failed: ${body?.error ?? res.statusText}`);
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setMessage(`Force send error: ${message}`);
    }
  }

  async function forceRefreshCommands() {
    try {
      if (!guildId) {
        setMessage("Select a server first.");
        return;
      }
      const res = await fetch("/api/discord/commands/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId }),
      });
      const body = await res.json();
      if (res.ok) {
        setMessage(`Slash commands refreshed for server.`);
      } else {
        setMessage(`Refresh failed: ${body?.error ?? res.statusText}`);
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      setMessage(`Refresh error: ${message}`);
    }
  }

  return (
    <main className="shell">
      <div className="hero fade-in">
        <section className="card hero-copy">
          <span className="eyebrow">Discord anime release tracker</span>
          <h1 className="title">Notify the right server when a tracked anime drops a new episode.</h1>
          <p className="subtitle">
            Connect Discord, choose a guild, channel, and ping role, then import the anime you want to follow from AniList or MyAnimeList.
            The bot polls AniList release data and posts alerts automatically. Manga lives on a separate page.
          </p>

          <div className="hero-grid">
            <div className="metric">
              <span className="muted">Auth</span>
              <strong>{user ? `Connected as ${user.username}` : "Not connected"}</strong>
            </div>
            <div className="metric">
              <span className="muted">Target</span>
              <strong>{selectedGuildName}</strong>
            </div>
            <div className="metric">
              <span className="muted">Channel</span>
              <strong>{selectedChannelName}</strong>
            </div>
          </div>

          <div className="actions" style={{ marginTop: 20 }}>
            <a className="button primary" href="/api/auth/start">
              Connect Discord
            </a>
            <a className="button" href="/manga">
              Open manga dashboard
            </a>
            <form action="/api/auth/logout" method="post">
              <button className="button ghost" type="submit">
                Sign out
              </button>
            </form>
          </div>
        </section>
      </div>

      <div className="grid-2" style={{ marginTop: 20 }}>
        <section className="card section">
          <h2>Notification target</h2>
          <p className="muted">Pick the guild the bot should use, then select the channel and role to notify.</p>

          <div className="field">
            <label htmlFor="guild">Server</label>
            <select id="guild" value={guildId} onChange={(event) => setGuildId(event.target.value)}>
              <option value="">Select a Discord server</option>
              {guilds.map((guild) => (
                <option key={guild.id} value={guild.id}>
                  {guild.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="channel">Channel</label>
            <select id="channel" value={channelId} onChange={(event) => setChannelId(event.target.value)}>
              <option value="">Select a channel</option>
              {channels.map((channel) => (
                <option key={channel.id} value={channel.id}>
                  #{channel.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="role">Role ping</label>
            <select id="role" value={roleId} onChange={(event) => setRoleId(event.target.value)}>
              <option value="">No role ping</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  @{role.name}
                </option>
              ))}
            </select>
          </div>

          <div className="actions">
            <button className="button primary" type="button" onClick={() => void saveConfig()}>
              Save target
            </button>
            <button
              className="button"
              type="button"
              onClick={async () => {
                try {
                  const res = await fetch(`/api/anime/test-ping`, { method: "POST" });
                  if (res.ok) {
                    setMessage("Test ping sent.");
                  } else {
                    const body = await res.json();
                    setMessage(`Test ping failed: ${body?.error ?? res.statusText}`);
                  }
                } catch (e: unknown) {
                  const message = e instanceof Error ? e.message : String(e);
                  setMessage(`Test ping error: ${message}`);
                }
              }}
            >
              Test ping
            </button>
            <button className="button" type="button" onClick={() => void loadGuildDetails(guildId)}>
              Refresh server data
            </button>
            <button className="button" type="button" onClick={() => void forceRefreshCommands()}>
              Refresh slash commands
            </button>
          </div>

        </section>

        <section className="card section">
          <h2>Import anime</h2>
          <p className="muted">Import the shows you want notifications for using AniList or MyAnimeList.</p>

          <div className="field">
            <label htmlFor="anilist">AniList username</label>
            <input id="anilist" value={aniListUser} onChange={(event) => setAniListUser(event.target.value)} placeholder="your-anilist-handle" />
          </div>

          <div className="actions">
            <button className="button primary" type="button" onClick={() => void importAniList()}>
              Import AniList list
            </button>
          </div>

          <div className="field" style={{ marginTop: 18 }}>
            <label htmlFor="mal">MyAnimeList XML export</label>
            <input id="mal" type="file" accept=".xml,text/xml,application/xml" onChange={(event) => void importMal(event.target.files?.[0] ?? null)} />
          </div>

          {malMessage ? <div className="status ok">{malMessage}</div> : null}
        </section>
      </div>

      <section className="card section" style={{ marginTop: 20 }}>
        <h2>Tracked anime</h2>
        <p className="muted">These are the titles the bot will refresh against AniList release data.</p>

        <div className="list">
          {tracks.map((track) => (
            <div className="list-item" key={track.id}>
              <div>
                <strong>{track.title}</strong>
                <div className="muted">
                  {track.source} {track.nextEpisode ? `• next episode ${track.nextEpisode}` : "• awaiting airing data"}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div className="tag">{track.nextAiringAt ? new Date(track.nextAiringAt).toLocaleString() : "no date yet"}</div>
                <button className="button" onClick={() => void forceSendLatestEpisode(track.id)}>
                  Force send
                </button>
                <button className="button ghost" onClick={() => void removeTrack(track.id)}>
                  Remove
                </button>
              </div>
            </div>
          ))}
          {tracks.length === 0 ? <div className="status">No anime imported yet.</div> : null}
        </div>

        {message ? (
          <div className="status ok" style={{ marginTop: 14 }}>
            {message}
          </div>
        ) : null}
      </section>
    </main>
  );
}