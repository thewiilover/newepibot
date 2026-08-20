import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { searchAnimeManga, SearchError, SearchResult } from "@/lib/anilist-search";

export const searchCommand = new SlashCommandBuilder()
  .setName("search")
  .setDescription("Search for anime or manga on AniList")
  .addStringOption((option) =>
    option
      .setName("type")
      .setDescription("Type of media to search for")
      .setRequired(true)
      .addChoices(
        { name: "Anime", value: "ANIME" },
        { name: "Manga", value: "MANGA" },
      ),
  )
  .addStringOption((option) =>
    option.setName("title").setDescription("Title to search for").setRequired(true),
  );

function isSearchError(result: SearchError | SearchResult): result is SearchError {
  return "error" in result;
}

export async function handleSearchCommand(interaction: ChatInputCommandInteraction) {
  const type = interaction.options.getString("type", true) as "ANIME" | "MANGA";
  const title = interaction.options.getString("title", true);

  await interaction.deferReply();

  try {
    const result = await searchAnimeManga(title, type);

    if (isSearchError(result)) {
      await interaction.editReply({ content: "No results found for this search" });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle(result.title)
      .setURL(result.url)
      .setColor(0x344700)
      .setAuthor({ name: result.name, url: result.url, iconURL: "https://anilist.co/img/logo_al.png" })
      .setThumbnail(result.imageUrl ?? null)
      .setDescription(result.description ? shorten(result.description) : null)
      .setFooter({ text: result.footer || "" });

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error("Search error:", error);
    await interaction.editReply({ content: "An error occurred while searching." });
  }
}

function shorten(str: string) {
  const markdown = str.replace(/<[^>]*>/g, "");
  if (markdown.length > 400) {
    return markdown.substring(0, 400) + "...";
  }
  return markdown;
}