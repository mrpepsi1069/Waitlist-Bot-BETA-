// commands/createwaitlist.js
const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("createwaitlist")
    .setDescription("Create a new waitlist.")
    .addStringOption(opt => opt.setName("name").setDescription("Waitlist name").setRequired(true)),

  execute(interaction) {
    const guildId = interaction.guild.id;
    const folder = path.join("waitlists", guildId);
    if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });

    const name = interaction.options.getString("name");
    const file = path.join(folder, `${name}.json`);
    const nowTs = Math.floor(Date.now() / 1000);

    if (fs.existsSync(file)) return interaction.reply({ content: "⚠️ That waitlist already exists.", flags: 64 });

    fs.writeFileSync(file, JSON.stringify({ users: [] }, null, 2));

    // log creation
    const cfgFile = path.join("configs", `${guildId}.json`);
    if (fs.existsSync(cfgFile)) {
      const cfg = JSON.parse(fs.readFileSync(cfgFile));
      const logCh = interaction.guild.channels.cache.get(cfg.logChannelId);
      if (logCh) logCh.send([`🆕 Created waitlist **${name}**`, `By: <@${interaction.user.id}>`, `Time: <t:${nowTs}:F>`].join("\n"));
    }

    return interaction.reply({ content: `✅ Created waitlist **${name}**.`, flags: 64 });
  }
};
