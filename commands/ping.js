// commands/ping.js
const { SlashCommandBuilder } = require("discord.js");
const pkg = require("../package.json");

module.exports = {
  data: new SlashCommandBuilder().setName("ping").setDescription("Show bot version and latency."),
  async execute(interaction) {
    const latency = Math.round(interaction.client.ws.ping);
    await interaction.reply({ content: `Pong! Version: **${pkg.version || "1.0.0"}** — Latency: **${latency}ms**`, ephemeral: true });
  }
};
