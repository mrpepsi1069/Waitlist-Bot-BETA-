// commands/purgeallwaitlists.js
const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("purgeallwaitlists")
    .setDescription("Delete ALL waitlists for this server (Admin only).")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    if (!interaction.guild) return interaction.reply({ content: "Use in a server.", ephemeral: true });

    const folder = path.join(__dirname, "..", "waitlists", interaction.guild.id);
    if (!fs.existsSync(folder)) return interaction.reply({ content: "No waitlists to delete.", ephemeral: true });

    const files = fs.readdirSync(folder).filter(f => f.endsWith(".json"));
    for (const f of files) fs.unlinkSync(path.join(folder, f));
    return interaction.reply({ content: `🗑 Deleted ${files.length} waitlists.`, ephemeral: true });
  }
};
