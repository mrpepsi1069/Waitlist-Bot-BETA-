// commands/renamewaitlist.js
const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("renamewaitlist")
    .setDescription("Rename a waitlist.")
    .addStringOption(opt => opt.setName("old").setDescription("Current name").setRequired(true).setAutocomplete(true))
    .addStringOption(opt => opt.setName("new").setDescription("New name").setRequired(true)),

  async execute(interaction) {
    if (!interaction.guild) return interaction.reply({ content: "Use in a server.", ephemeral: true });

    const configFile = path.join(__dirname, "..", "configs", `${interaction.guild.id}.json`);
    if (!fs.existsSync(configFile)) return interaction.reply({ content: "Server not set up.", ephemeral: true });
    const config = JSON.parse(fs.readFileSync(configFile));
    const allowedRoles = config.managerRoleIds || [];

    const isAdmin = interaction.member.permissions.has("Administrator");
    const isManager = interaction.member.roles.cache.some(r => allowedRoles.includes(r.id));
    if (!isAdmin && !isManager) return interaction.reply({ content: "No permission.", ephemeral: true });

    const oldName = interaction.options.getString("old");
    const newName = interaction.options.getString("new").trim();
    if (!newName) return interaction.reply({ content: "Invalid new name.", ephemeral: true });

    const folder = path.join(__dirname, "..", "waitlists", interaction.guild.id);
    const oldFile = path.join(folder, `${oldName}.json`);
    const newFile = path.join(folder, `${newName}.json`);

    if (!fs.existsSync(oldFile)) return interaction.reply({ content: "Original waitlist does not exist.", ephemeral: true });
    if (fs.existsSync(newFile)) return interaction.reply({ content: "A waitlist with the new name already exists.", ephemeral: true });

    fs.renameSync(oldFile, newFile);

    // no guarantee to update previously posted messages automatically.
    if (config.logChannelId) {
      const ch = interaction.guild.channels.cache.get(config.logChannelId);
      if (ch) ch.send(`🔁 Waitlist renamed: **${oldName}** → **${newName}** by <@${interaction.user.id}> — <t:${Math.floor(Date.now()/1000)}:F>`).catch(()=>{});
    }

    return interaction.reply({ content: `✅ Renamed **${oldName}** → **${newName}**.`, ephemeral: true });
  }
};
