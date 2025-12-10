const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("renamewaitlist")
    .setDescription("Rename an existing waitlist.")
    .addStringOption(option =>
      option.setName("old")
        .setDescription("Current waitlist name")
        .setAutocomplete(true)
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("new")
        .setDescription("New name")
        .setRequired(true)
    ),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const oldName = interaction.options.getString("old");
    const newName = interaction.options.getString("new")?.trim();

    // Validate new name
    if (!newName || newName.length < 1) {
      return interaction.reply({
        content: "❌ The new name is invalid.",
        flags: 64
      });
    }

    // File paths
    const dir = path.join(__dirname, "..", "waitlists", guildId);
    const oldFile = path.join(dir, `${oldName}.json`);
    const newFile = path.join(dir, `${newName}.json`);

    // Ensure directory exists
    if (!fs.existsSync(dir)) {
      return interaction.reply({
        content: "❌ No waitlists found for this server.",
        flags: 64
      });
    }

    // Check if old waitlist exists
    if (!fs.existsSync(oldFile)) {
      return interaction.reply({
        content: "❌ That waitlist does not exist.",
        flags: 64
      });
    }

    // Prevent overwriting existing
    if (fs.existsSync(newFile)) {
      return interaction.reply({
        content: "❌ A waitlist with that new name already exists.",
        flags: 64
      });
    }

    try {
      fs.renameSync(oldFile, newFile);
      return interaction.reply({
        content: `✅ Successfully renamed **${oldName}** → **${newName}**`,
        flags: 64
      });
    } catch (err) {
      console.error("Rename error:", err);
      return interaction.reply({
        content: "❌ Failed to rename. Check logs.",
        flags: 64
      });
    }
  }
};
