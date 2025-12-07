// commands/setwaitlist.js
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setwaitlist")
    .setDescription("Post a waitlist with Update/Delete buttons.")
    .addStringOption(opt => opt.setName("waitlist").setDescription("Waitlist name").setRequired(true).setAutocomplete(true)),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const cfgFile = path.join("configs", `${guildId}.json`);
    if (!fs.existsSync(cfgFile)) return interaction.reply({ content: "❌ Run /setup first.", flags: 64 });
    const config = JSON.parse(fs.readFileSync(cfgFile));

    const memberRoles = interaction.member.roles.cache.map(r => r.id);
    const isAdmin = interaction.member.permissions.has("Administrator");
    const isManager = memberRoles.some(r => (config.managerRoleIds || []).includes(r));
    if (!isAdmin && !isManager) return interaction.reply({ content: "🔒 You cannot post waitlists.", flags: 64 });

    const name = interaction.options.getString("waitlist");
    const file = path.join("waitlists", guildId, `${name}.json`);
    if (!fs.existsSync(file)) return interaction.reply({ content: "❌ That waitlist does not exist.", flags: 64 });

    const data = JSON.parse(fs.readFileSync(file));
    const embed = new EmbedBuilder()
      .setTitle(`📋 Waitlist: ${name}`)
      .setColor("Blue")
      .setDescription(data.users.length ? data.users.map((id, i) => `${i + 1}. <@${id}>`).join("\n") : "_No users yet._");

    // send message then update its customIds to include message id
    const channel = interaction.guild.channels.cache.get(config.waitlistChannelId);
    if (!channel) return interaction.reply({ content: "❌ Waitlist channel missing.", flags: 64 });

    const sent = await channel.send({ embeds: [embed], components: [] });
    // build components with message id included
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`update:${guildId}:${name}:${sent.id}`).setLabel("Update").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`delete:${guildId}:${name}:${sent.id}`).setLabel("Delete").setStyle(ButtonStyle.Danger)
    );
    await sent.edit({ components: [row] });

    return interaction.reply({ content: `✅ Waitlist **${name}** posted in <#${channel.id}>.`, flags: 64 });
  }
};
