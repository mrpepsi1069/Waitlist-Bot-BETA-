// commands/listwaitlists.js
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
  data: new SlashCommandBuilder().setName("listwaitlists").setDescription("Show all waitlists in this server."),

  async execute(interaction) {
    if (!interaction.guild) return interaction.reply({ content: "Use this in a server.", ephemeral: true });

    const guildId = interaction.guild.id;
    const folder = path.join(__dirname, "..", "waitlists", guildId);
    if (!fs.existsSync(folder)) return interaction.reply({ embeds: [new EmbedBuilder().setTitle("📄 Waitlists").setDescription("No waitlists yet.").setColor("Blue")] , ephemeral: true });

    const files = fs.readdirSync(folder).filter(f => f.endsWith(".json"));
    const names = files.map(f => f.replace(".json", ""));

    const desc = names.length
      ? names.map(n => `• **${n}**`).join("\n")
      : "No waitlists yet.";

    const embed = new EmbedBuilder().setTitle("📄 Waitlists").setDescription(desc).setColor("Blue");
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
