# NewEpiBot

Discord bot + web dashboard for tracking anime episode releases and manga chapter updates, then posting notifications to a selected server, channel, and role.

## What it does

- Connects to Discord with OAuth for dashboard access.
- Lets you choose the guild, channel, and role to ping for release alerts.
- Imports anime and manga watch lists from AniList usernames or MyAnimeList XML exports.
- Polls AniList release data and posts a Discord notification when a tracked anime airs a new episode or a tracked manga gains a new chapter.

## Setup

1. Install dependencies.
2. Copy environment values into `.env`.
3. Push the Prisma schema with `npm run db:push`.
4. Start the dashboard and bot with `npm run dev`.

## Required environment variables

- `DATABASE_URL`
- `DISCORD_BOT_TOKEN`
- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`
- `DISCORD_REDIRECT_URI`
- `APP_BASE_URL`

## Notes

- AniList is used as the release source for both anime and manga.
- MyAnimeList imports are supported from XML export files for both media types.
- Anime and manga share the Discord channel, but each can use its own role ping.