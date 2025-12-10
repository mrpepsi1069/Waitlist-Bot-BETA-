// commands/renamewaitlist.js
const { SlashCommandBuilder, InteractionFlags } = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("renamewaitlist")
    .setDescription("Rename a waitlist.")
    .addStringOption(opt =>
      opt.setName("old")
        .setDescription("Current waitlist name")
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption(opt =>
      opt.setName("new")
        .setDescription("New waitlist name")
        .setRequired(true)
    ),

  async execute(interaction) {
    if (!interaction.guild) {
      return interaction.reply({
        content: "Use this in a server.",
        flags: InteractionFlags.Ephemeral
      });
    }

    const guildId = interaction.guild.id;

    // ----- LOAD CONFIG -----
    const configFile = path.join(__dirname, "..", "configs", `${guildId}.json`);
    if (!fs.existsSync(configFile)) {
      return interaction.reply({
        content: "Server is not set up. Run `/setup` first.",
        flags: InteractionFlags.Ephemeral
      });
    }

    const config = JSON.parse(fs.readFileSync(configFile));
    const allowedRoles = config.managerRoleIds || [];

    const isAdmin = interaction.member.permissions.has("Administrator");
    const isManager = interaction.member.roles.cache.some(r => allowedRoles.includes(r.id));

    if (!isAdmin && !isManager) {
      return interaction.reply({
        content: "❌ You do not have permission.",
        flags: InteractionFlags.Ephemeral
      });
    }

    // ----- OPTIONS -----
    const oldName = interaction.options.getString("old");
    const newNameRaw = interaction.options.getString("new");

    if (!newNameRaw) {
      return interaction.reply({
        content: "❌ New name cannot be empty.",
        flags: InteractionFlags.Ephemeral
      });
    }

    const newName = newNameRaw.trim();

    if (newName.length < 1) {
      return interaction.reply({
        content: "❌ New name cannot be blank.",
        flags: InteractionFlags.Ephemeral
      });
    }

    // Prevent dangerous file names
    const safeNameRegex = /^[a-zA-Z0-9 _-]+$/;
    if (!safeNameRegex.test(newName)) {
      return interaction.reply({
        content: "❌ New name contains illegal characters. Allowed: letters, numbers, spaces, `_`, `-`.",
        flags: InteractionFlags.Ephemeral
      });
    }

    const folder = path.join(__dirname, "..", "waitlists", guildId);
    const oldFile = path.join(folder, `${oldName}.json`);
    const newFile = path.join(folder, `${newName}.json`);

    if (!fs.existsSync(oldFile)) {
      return interaction.reply({
        content: "❌ The original waitlist does not exist.",
        flags: InteractionFlags.Ephemeral
      });
    }

    if (fs.existsSync(newFile)) {
      return interaction.reply({
        content: "❌ A waitlist with that new name already exists.",
        flags: InteractionFlags.Ephemeral
      });
    }

    // ----- SAFE RENAME -----
    try {
      fs.renameSync(oldFile, newFile);
    } catch (err) {
      console.error("Rename error:", err);
      return interaction.reply({
        content: "❌ Failed to rename waitlist (file system error).",
        flags: InteractionFlags.Ephemeral
      });
    }

    // OPTIONAL LOG
    if (config.logChannelId) {
      const logCh = interaction.guild.channels.cache.get(config.logChannelId);
      if (logCh) {
        logCh.send(
          `🔁 **Renamed waitlist:** \`${oldName}\` → \`${newName}\`\n👤 By <@${interaction.user.id}>`
        ).catch(() => {});
      }
    }

    return interaction.reply({
      content: `✅ Renamed **${oldName}** → **${newName}**.`,
      flags: InteractionFlags.Ephemeral
    });
  }
};
