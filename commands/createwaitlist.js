// commands/createwaitlist.js
const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("createwaitlist")
    .setDescription("Create a new waitlist.")
    .addStringOption(opt => opt.setName("name").setDescription("Waitlist name").setRequired(true)),

  async execute(interaction) {
    if (!interaction.guild) return interaction.reply({ content: "Use this command in a server.", ephemeral: true });

    const guildId = interaction.guild.id;
    const name = interaction.options.getString("name").trim();
    if (!name) return interaction.reply({ content: "Invalid name.", ephemeral: true });

    const folder = path.join(__dirname, "..", "waitlists", guildId);
    if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });

    const file = path.join(folder, `${name}.json`);
    if (fs.existsSync(file)) return interaction.reply({ content: "⚠️ That waitlist already exists.", ephemeral: true });

    fs.writeFileSync(file, JSON.stringify({ users: [] }, null, 2));
    return interaction.reply({ content: `✅ Created waitlist **${name}**.`, ephemeral: true });
  }
};
