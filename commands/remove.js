// commands/remove.js
const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("remove")
    .setDescription("Remove a user from a waitlist.")
    .addUserOption(o => o.setName("user").setDescription("User to remove").setRequired(true))
    .addStringOption(o => o.setName("waitlist").setDescription("Waitlist name").setRequired(true).setAutocomplete(true)),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const cfgFile = path.join("configs", `${guildId}.json`);
    if (!fs.existsSync(cfgFile)) return interaction.reply({ content: "❌ Run /setup first.", flags: 64 });
    const config = JSON.parse(fs.readFileSync(cfgFile));
    const allowedRoles = config.managerRoleIds || [];
    const isAdmin = interaction.member.permissions.has("Administrator");
    const isManager = interaction.member.roles.cache.some(r => allowedRoles.includes(r.id));
    if (!isAdmin && !isManager) return interaction.reply({ content: "🔒 You cannot remove users.", flags: 64 });

    const name = interaction.options.getString("waitlist");
    const user = interaction.options.getUser("user");
    const file = path.join("waitlists", guildId, `${name}.json`);
    const nowTs = Math.floor(Date.now() / 1000);

    if (!fs.existsSync(file)) return interaction.reply({ content: "❌ Waitlist not found.", flags: 64 });

    const data = JSON.parse(fs.readFileSync(file));
    if (!data.users.includes(user.id)) return interaction.reply({ content: "⚠️ User not on list.", flags: 64 });

    data.users = data.users.filter(id => id !== user.id);
    fs.writeFileSync(file, JSON.stringify(data, null, 2));

    // log
    try {
      const logCh = interaction.guild.channels.cache.get(config.logChannelId);
      if (logCh) logCh.send([`📤 Removed <@${user.id}> from waitlist **${name}**`, `By: <@${interaction.user.id}>`, `Time: <t:${nowTs}:F>`].join("\n"));
    } catch (_) {}

    return interaction.reply({ content: `✅ Removed ${user.username} from ${name}.`, flags: 64 });
  }
};
