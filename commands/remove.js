// commands/remove.js
const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("remove")
    .setDescription("Remove a user from a waitlist.")
    .addUserOption(opt => opt.setName("user").setDescription("User to remove").setRequired(true))
    .addStringOption(opt => opt.setName("waitlist").setDescription("Waitlist name").setRequired(true).setAutocomplete(true)),

  async execute(interaction) {
    if (!interaction.guild) return interaction.reply({ content: "Use this in a server.", ephemeral: true });

    const configFile = path.join(__dirname, "..", "configs", `${interaction.guild.id}.json`);
    if (!fs.existsSync(configFile)) return interaction.reply({ content: "This server is not set up.", ephemeral: true });
    const config = JSON.parse(fs.readFileSync(configFile));
    const allowedRoles = config.managerRoleIds || [];

    const isAdmin = interaction.member.permissions.has("Administrator");
    const isManager = interaction.member.roles.cache.some(r => allowedRoles.includes(r.id));
    if (!isAdmin && !isManager) return interaction.reply({ content: "❌ You cannot remove from waitlists.", ephemeral: true });

    const user = interaction.options.getUser("user");
    const name = interaction.options.getString("waitlist");
    const file = path.join(__dirname, "..", "waitlists", interaction.guild.id, `${name}.json`);
    if (!fs.existsSync(file)) return interaction.reply({ content: "❌ That waitlist does not exist.", ephemeral: true });

    const data = JSON.parse(fs.readFileSync(file));
    if (!data.users.includes(user.id)) return interaction.reply({ content: "⚠️ User is not on this list.", ephemeral: true });

    data.users = data.users.filter(id => id !== user.id);
    fs.writeFileSync(file, JSON.stringify(data, null, 2));

    if (config.logChannelId) {
      const ch = interaction.guild.channels.cache.get(config.logChannelId);
      if (ch) ch.send(`➖ <@${user.id}> removed from **${name}** by <@${interaction.user.id}> — <t:${Math.floor(Date.now()/1000)}:F>`).catch(()=>{});
    }

    return interaction.reply({ content: `✅ Removed **${user.tag}** from **${name}**.`, ephemeral: true });
  }
};
