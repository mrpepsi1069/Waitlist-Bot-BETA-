// commands/deletewaitlist.js
const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("deletewaitlist")
    .setDescription("Delete a waitlist.")
    .addStringOption(opt => opt.setName("waitlist").setDescription("Waitlist name").setRequired(true).setAutocomplete(true)),

  async execute(interaction) {
    if (!interaction.guild) return interaction.reply({ content: "Use in a server.", ephemeral: true });

    const configFile = path.join(__dirname, "..", "configs", `${interaction.guild.id}.json`);
    if (!fs.existsSync(configFile)) return interaction.reply({ content: "Server not set up.", ephemeral: true });
    const config = JSON.parse(fs.readFileSync(configFile));
    const allowedRoles = config.managerRoleIds || [];

    const isAdmin = interaction.member.permissions.has("Administrator");
    const isManager = interaction.member.roles.cache.some(r => allowedRoles.includes(r.id));
    if (!isAdmin && !isManager) return interaction.reply({ content: "No permission.", ephemeral: true });

    const name = interaction.options.getString("waitlist");
    const file = path.join(__dirname, "..", "waitlists", interaction.guild.id, `${name}.json`);
    if (!fs.existsSync(file)) return interaction.reply({ content: "That waitlist does not exist.", ephemeral: true });

    fs.unlinkSync(file);

    if (config.logChannelId) {
      const ch = interaction.guild.channels.cache.get(config.logChannelId);
      if (ch) ch.send(`🗑 Waitlist **${name}** deleted by <@${interaction.user.id}> — <t:${Math.floor(Date.now()/1000)}:F>`).catch(()=>{});
    }

    return interaction.reply({ content: `🗑 Deleted **${name}**.`, ephemeral: true });
  }
};
