import { Client, GatewayIntentBits } from "discord.js";
import { env } from "@/lib/env";
import { refreshAllTrackedAnime } from "@/lib/tracked-anime";
import { refreshAllTrackedManga } from "@/lib/tracked-manga";
import { schedulerIntervalMs, sendReleaseNotifications } from "@/lib/notification-service";
import { sendMangaNotifications } from "@/lib/manga-notification-service";
import { db } from "@/lib/db";

async function main() {
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  client.once("ready", async () => {
    console.log(`Logged in as ${client.user?.tag ?? "Discord bot"}`);
    // Upsert the guilds the bot is currently in so the dashboard can list them.
    for (const [_id, guild] of client.guilds.cache) {
      try {
        await db.botGuild.upsert({
          where: { id: guild.id },
          create: { id: guild.id, name: guild.name, icon: guild.icon ?? null },
          update: { name: guild.name, icon: guild.icon ?? null },
        });
      } catch (e) {
        // ignore db errors during upsert
      }
    }

    // Send notifications now that the client is ready. The tracked anime
    // and manga records are refreshed at process start (before login) to
    // ensure we have the latest release data on every bot start.
    await sendReleaseNotifications(client);
    await sendMangaNotifications(client);

    setInterval(async () => {
      await refreshAllTrackedAnime();
      await refreshAllTrackedManga();
      await sendReleaseNotifications(client);
      await sendMangaNotifications(client);
    }, schedulerIntervalMs());
  });
  // Refresh tracked anime and manga records before logging in so the DB has
  // up-to-date release data on every bot start. Don't let a refresh failure stop the bot.
  try {
    await refreshAllTrackedAnime();
    await refreshAllTrackedManga();
  } catch (err) {
    console.error("Initial refresh failed:", err);
  }

  await client.login(env.DISCORD_BOT_TOKEN);
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});