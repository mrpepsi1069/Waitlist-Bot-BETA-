// commands/cmds.js
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder().setName("cmds").setDescription("Show commands and descriptions."),
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle("Commands")
      .setColor("Blue")
      .setDescription([
        "/setup — Configure manager roles & channels",
        "/createwaitlist — Create a waitlist",
        "/setwaitlist — Post a waitlist",
        "/add — Add a user (managers)",
        "/remove — Remove a user (managers)",
        "/renamewaitlist — Rename a waitlist (managers)",
        "/deletewaitlist — Delete a waitlist (managers)",
        "/listwaitlists — List server waitlists",
        "/purgeallwaitlists — Admin only",
        "/ping — Bot version + latency"
      ].join("\n"));
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};

