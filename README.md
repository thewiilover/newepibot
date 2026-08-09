# NewEpiBot

Discord bot + web dashboard for tracking anime episode releases and posting notifications to a selected server, channel, and role.

## What it does

- Connects to Discord with OAuth for dashboard access.
- Lets you choose the guild, channel, and role to ping for release alerts.
- Imports watch lists from AniList usernames or MyAnimeList XML exports.
- Polls AniList release data and posts a Discord notification when a tracked show airs a new episode.

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

- AniList is used as the release source.
- MyAnimeList imports are supported from XML export files.
- The project is scaffolded for a single active notification target at a time.