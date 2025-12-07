// commands/deletewaitlist.js
const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("deletewaitlist")
    .setDescription("Delete a waitlist (manager/admin).")
    .addStringOption(o => o.setName("waitlist").setDescription("Waitlist name").setRequired(true).setAutocomplete(true)),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const cfgFile = path.join("configs", `${guildId}.json`);
    if (!fs.existsSync(cfgFile)) return interaction.reply({ content: "❌ Run /setup first.", flags: 64 });
    const config = JSON.parse(fs.readFileSync(cfgFile));
    const allowedRoles = config.managerRoleIds || [];
    const isAdmin = interaction.member.permissions.has("Administrator");
    const isManager = interaction.member.roles.cache.some(r => allowedRoles.includes(r.id));
    if (!isAdmin && !isManager) return interaction.reply({ content: "🔒 You cannot delete waitlists.", flags: 64 });

    const name = interaction.options.getString("waitlist");
    const file = path.join("waitlists", guildId, `${name}.json`);
    const nowTs = Math.floor(Date.now() / 1000);

    if (!fs.existsSync(file)) return interaction.reply({ content: "❌ Waitlist not found.", flags: 64 });

    const data = JSON.parse(fs.readFileSync(file));
    const deletedUsers = data.users ?? [];
    fs.unlinkSync(file);

    // log
    try {
      const logCh = interaction.guild.channels.cache.get(config.logChannelId);
      if (logCh) {
        const lines = [`🗑️ Deleted waitlist **${name}**`, `By: <@${interaction.user.id}>`, `Time: <t:${nowTs}:F>`];
        if (deletedUsers.length) for (const u of deletedUsers) lines.push(`<@${u}>`);
        else lines.push("Users removed: _No users_");
        logCh.send(lines.join("\n"));
      }
    } catch (_) {}

    return interaction.reply({ content: `🗑️ Deleted waitlist ${name}.`, flags: 64 });
  }
};
