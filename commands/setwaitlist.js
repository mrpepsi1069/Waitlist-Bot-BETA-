// commands/setwaitlist.js
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setwaitlist")
    .setDescription("Post a waitlist with an update/delete button.")
    .addStringOption(opt => opt.setName("waitlist").setDescription("Waitlist name").setRequired(true).setAutocomplete(true)),

  async execute(interaction) {
    if (!interaction.guild) return interaction.reply({ content: "Use this in a server.", ephemeral: true });

    const guildId = interaction.guild.id;
    const configFile = path.join(__dirname, "..", "configs", `${guildId}.json`);
    if (!fs.existsSync(configFile)) return interaction.reply({ content: "❌ This server has not run /setup yet.", ephemeral: true });

    const config = JSON.parse(fs.readFileSync(configFile));
    const waitlistChannel = interaction.guild.channels.cache.get(config.waitlistChannelId);
    if (!waitlistChannel) return interaction.reply({ content: "❌ Configured waitlist channel not found.", ephemeral: true });

    const name = interaction.options.getString("waitlist");
    const file = path.join(__dirname, "..", "waitlists", guildId, `${name}.json`);
    if (!fs.existsSync(file)) return interaction.reply({ content: "❌ That waitlist does not exist.", ephemeral: true });

    const data = JSON.parse(fs.readFileSync(file));

    const embed = new EmbedBuilder()
      .setTitle(`📋 Waitlist: ${name}`)
      .setColor("Blue")
      .setDescription(data.users.length ? data.users.map((id, i) => `${i + 1}. <@${id}>`).join("\n") : "_No users yet._");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`update_${name}`).setLabel("Update").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId(`delete_${name}`).setLabel("Delete").setStyle(ButtonStyle.Danger)
    );

    await waitlistChannel.send({ embeds: [embed], components: [row] }).catch(() => {});
    return interaction.reply({ content: `✅ Waitlist **${name}** posted in <#${waitlistChannel.id}>.`, ephemeral: true });
  }
};
