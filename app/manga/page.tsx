"use client";

import { useEffect, useMemo, useState } from "react";

type UserState = { id: string; username: string; avatar?: string | null } | null;
type Guild = { id: string; name: string; icon: string | null };
type Channel = { id: string; name: string; type: number };
type Role = { id: string; name: string };
type MangaTrack = { id: string; title: string; source: string; chapterCount: number | null; lastNotifiedChapter: number | null };
type BotConfig = { guildId: string; channelId: string; roleId: string | null; mangaRoleId: string | null } | null;

export default function MangaPage() {
  const [user, setUser] = useState<UserState>(null);
  const [config, setConfig] = useState<BotConfig>(null);
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [tracks, setTracks] = useState<MangaTrack[]>([]);
  const [mangaAniListUser, setMangaAniListUser] = useState("");
  const [roleId, setRoleId] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const selectedGuildName = useMemo(() => {
    const guild = guilds.find((item) => item.id === config?.guildId);
    return guild?.name ?? "No guild selected";
  }, [config?.guildId, guilds]);

  const selectedChannelName = useMemo(() => {
    const channel = channels.find((item) => item.id === config?.channelId);
    return channel?.name ?? "No channel selected";
  }, [channels, config?.channelId]);

  async function loadAuthState() {
    const response = await fetch("/api/auth/me", { cache: "no-store" });
    if (response.ok) {
      const payload = (await response.json()) as { user: UserState };
      setUser(payload.user);
    } else {
      setUser(null);
    }
  }

  async function loadConfig() {
    const response = await fetch("/api/config", { cache: "no-store" });
    if (!response.ok) return;
    const payload = (await response.json()) as { config: BotConfig };
    setConfig(payload.config);
    setRoleId(payload.config?.mangaRoleId ?? "");
  }

  async function loadGuilds() {
    const response = await fetch("/api/discord/guilds", { cache: "no-store" });
    if (!response.ok) return;
    const payload = (await response.json()) as { guilds: Guild[] };
    setGuilds(payload.guilds);
  }

  async function loadGuildDetails(guildId: string) {
    if (!guildId) return;
    const response = await fetch(`/api/discord/guilds/${guildId}`, { cache: "no-store" });
    if (!response.ok) return;
    const payload = (await response.json()) as { channels: Channel[]; roles: Role[] };
    setChannels(payload.channels.filter((item) => item.type === 0 || item.type === 5 || item.type === 2));
    setRoles(payload.roles);
  }

  async function loadTracks() {
    const response = await fetch("/api/manga/tracks", { cache: "no-store" });
    if (!response.ok) return;
    const payload = (await response.json()) as { tracks: MangaTrack[] };
    setTracks(payload.tracks);
  }

  useEffect(() => {
    void loadAuthState();
    void loadConfig();
    void loadGuilds();
    void loadTracks();
  }, []);

  useEffect(() => {
    if (config?.guildId) {
      void loadGuildDetails(config.guildId);
    }
  }, [config?.guildId]);

  async function saveMangaRole() {
    if (!config?.guildId || !config.channelId) return;
    const response = await fetch(`/api/discord/guilds/${config.guildId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channelId: config.channelId, mangaRoleId: roleId || null }),
    });

    if (response.ok) {
      setMessage("Manga role saved.");
      await loadConfig();
    }
  }

  async function importAniList() {
    const response = await fetch("/api/manga/import/anilist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: mangaAniListUser }),
    });

    if (response.ok) {
      setMessage(`Imported AniList manga list for ${mangaAniListUser}.`);
      await loadTracks();
    }
  }

  async function importMal(file: File | null) {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/manga/import/mal", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      setMessage(`Imported ${file.name}.`);
      await loadTracks();
    }
  }

  async function refreshData() {
    const response = await fetch("/api/manga/refresh", { method: "POST" });
    if (response.ok) {
      setMessage("Manga data synced.");
      await loadTracks();
    }
  }

  async function removeTrack(id: string) {
    if (!confirm("Remove this manga from tracking?")) return;
    try {
      const res = await fetch(`/api/manga/tracks/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMessage("Removed from tracking.");
        setTracks((items) => items.filter((item) => item.id !== id));
      } else {
        const body = await res.json().catch(() => null);
        setMessage(`Remove failed: ${body?.error ?? res.statusText}`);
      }
    } catch (error: any) {
      setMessage(`Remove error: ${error.message ?? error}`);
    }
  }

  return (
    <main className="shell">
      <div className="hero fade-in">
        <section className="card hero-copy">
          <span className="eyebrow">Discord manga release tracker</span>
          <h1 className="title">Notify the right server when a tracked manga gets a new chapter.</h1>
          <p className="subtitle">
            Manga has its own dashboard URL, import flow, and ping role. The bot still uses the same Discord channel, but manga alerts can ping a separate role.
          </p>

          <div className="hero-grid">
            <div className="metric">
              <span className="muted">Auth</span>
              <strong>{user ? `Connected as ${user.username}` : "Not connected"}</strong>
            </div>
            <div className="metric">
              <span className="muted">Guild</span>
              <strong>{selectedGuildName}</strong>
            </div>
            <div className="metric">
              <span className="muted">Channel</span>
              <strong>{selectedChannelName}</strong>
            </div>
          </div>

          <div className="actions" style={{ marginTop: 20 }}>
            <a className="button" href="/">
              Open anime dashboard
            </a>
            <a className="button primary" href="/api/auth/start">
              Connect Discord
            </a>
            <form action="/api/auth/logout" method="post">
              <button className="button ghost" type="submit">
                Sign out
              </button>
            </form>
          </div>
        </section>

        <section className="card section stack">
          <div className="status ok">
            <strong>Manga ready</strong>
            <div className="muted">Manga notifications use the shared Discord channel and your dedicated manga role ping.</div>
          </div>
          <div className="status warn">
            <strong>Current role</strong>
            <div className="muted">Select a manga role below if you want chapter alerts to mention a different group than anime alerts.</div>
          </div>
        </section>
      </div>

      <div className="grid-2" style={{ marginTop: 20 }}>
        <section className="card section">
          <h2>Manga notification target</h2>
          <p className="muted">This page uses the shared Discord channel from the anime dashboard and stores a separate role ping for manga alerts.</p>

          <div className="field">
            <label htmlFor="manga-role">Manga role ping</label>
            <select id="manga-role" value={roleId} onChange={(event) => setRoleId(event.target.value)}>
              <option value="">No role ping</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  @{role.name}
                </option>
              ))}
            </select>
          </div>

          <div className="actions">
            <button className="button primary" type="button" onClick={() => void saveMangaRole()}>
              Save manga role
            </button>
            <button
              className="button"
              type="button"
              onClick={async () => {
                try {
                  const res = await fetch(`/api/manga/test-ping`, { method: "POST" });
                  if (res.ok) {
                    setMessage("Manga test ping sent.");
                  } else {
                    const body = await res.json();
                    setMessage(`Test ping failed: ${body?.error ?? res.statusText}`);
                  }
                } catch (error: any) {
                  setMessage(`Test ping error: ${error.message ?? error}`);
                }
              }}
            >
              Test manga ping
            </button>
          </div>
        </section>

        <section className="card section">
          <h2>Import manga</h2>
          <p className="muted">Import the manga you want notifications for using AniList or MyAnimeList.</p>

          <div className="field">
            <label htmlFor="manga-anilist">AniList username</label>
            <input id="manga-anilist" value={mangaAniListUser} onChange={(event) => setMangaAniListUser(event.target.value)} placeholder="your-anilist-handle" />
          </div>

          <div className="actions">
            <button className="button primary" type="button" onClick={() => void importAniList()}>
              Import AniList manga list
            </button>
            <button className="button" type="button" onClick={() => void refreshData()}>
              Sync manga data
            </button>
          </div>

          <div className="field" style={{ marginTop: 18 }}>
            <label htmlFor="manga-mal">MyAnimeList XML export</label>
            <input id="manga-mal" type="file" accept=".xml,text/xml,application/xml" onChange={(event) => void importMal(event.target.files?.[0] ?? null)} />
          </div>
        </section>
      </div>

      <section className="card section" style={{ marginTop: 20 }}>
        <h2>Tracked manga</h2>
        <p className="muted">These are the manga titles the bot will refresh against AniList chapter data.</p>

        <div className="list">
          {tracks.map((track) => (
            <div className="list-item" key={track.id}>
              <div>
                <strong>{track.title}</strong>
                <div className="muted">{track.source} {track.chapterCount ? `• chapter ${track.chapterCount}` : "• awaiting chapter data"}</div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div className="tag">{track.lastNotifiedChapter ? `last notified ${track.lastNotifiedChapter}` : "no alerts yet"}</div>
                <button className="button ghost" onClick={() => void removeTrack(track.id)}>
                  Remove
                </button>
              </div>
            </div>
          ))}
          {tracks.length === 0 ? <div className="status">No manga imported yet.</div> : null}
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
