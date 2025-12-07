// commands/ping.js
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const pkg = require("../package.json");

module.exports = {
  data: new SlashCommandBuilder().setName("ping").setDescription("Check bot version & latency."),
  async execute(interaction) {
    const sent = await interaction.reply({ content: "🏓 Pinging...", fetchReply: true, flags: 64 });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const embed = new EmbedBuilder().setTitle("🏓 Pong!").setColor("Blue")
      .addFields({ name: "Version", value: `v${pkg.version}`, inline: true }, { name: "Latency", value: `${latency}ms`, inline: true });
    return interaction.editReply({ content: null, embeds: [embed], flags: 64 });
  }
};
