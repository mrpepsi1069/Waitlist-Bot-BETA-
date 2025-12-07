// commands/renamewaitlist.js
const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("renamewaitlist")
    .setDescription("Rename a waitlist (managers).")
    .addStringOption(o => o.setName("oldname").setDescription("Current waitlist name").setRequired(true).setAutocomplete(true))
    .addStringOption(o => o.setName("newname").setDescription("New waitlist name").setRequired(true)),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const cfgFile = path.join("configs", `${guildId}.json`);
    if (!fs.existsSync(cfgFile)) return interaction.reply({ content: "❌ Run /setup first.", flags: 64 });
    const config = JSON.parse(fs.readFileSync(cfgFile));
    const allowedRoles = config.managerRoleIds || [];
    const isAdmin = interaction.member.permissions.has("Administrator");
    const isManager = interaction.member.roles.cache.some(r => allowedRoles.includes(r.id));
    if (!isAdmin && !isManager) return interaction.reply({ content: "🔒 You cannot rename waitlists.", flags: 64 });

    const oldName = interaction.options.getString("oldname");
    const newName = interaction.options.getString("newname");
    const folder = path.join("waitlists", guildId);
    const oldPath = path.join(folder, `${oldName}.json`);
    const newPath = path.join(folder, `${newName}.json`);
    const nowTs = Math.floor(Date.now() / 1000);

    if (!fs.existsSync(oldPath)) return interaction.reply({ content: "❌ Original waitlist does not exist.", flags: 64 });
    if (fs.existsSync(newPath)) return interaction.reply({ content: "❌ A waitlist with that name already exists.", flags: 64 });

    fs.renameSync(oldPath, newPath);

    // update public messages
    const waitlistChannel = interaction.guild.channels.cache.get(config.waitlistChannelId);
    if (waitlistChannel) {
      const messages = await waitlistChannel.messages.fetch({ limit: 100 }).catch(() => new Map());
      for (const [id, msg] of messages) {
        if (!msg.embeds?.length) continue;
        if (msg.embeds[0].title !== `📋 Waitlist: ${oldName}`) continue;
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`update:${guildId}:${newName}:${msg.id}`).setLabel("Update").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId(`delete:${guildId}:${newName}:${msg.id}`).setLabel("Delete").setStyle(ButtonStyle.Danger)
        );
        const newEmbed = EmbedBuilder.from(msg.embeds[0]).setTitle(`📋 Waitlist: ${newName}`);
        await msg.edit({ embeds: [newEmbed], components: [row] }).catch(() => {});
      }
    }

    // log
    try {
      const logCh = interaction.guild.channels.cache.get(config.logChannelId);
      if (logCh) logCh.send([`✏️ Renamed waitlist **${oldName} → ${newName}**`, `By: <@${interaction.user.id}>`, `Time: <t:${nowTs}:F>`].join("\n"));
    } catch (_) {}

    return interaction.reply({ content: `✅ Renamed ${oldName} → ${newName}.`, flags: 64 });
  }
};
