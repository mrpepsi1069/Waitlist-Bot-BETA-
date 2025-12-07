// commands/purgeallwaitlists.js
const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
  data: new SlashCommandBuilder().setName("purgeallwaitlists").setDescription("Delete ALL waitlists (admin only)."),
  async execute(interaction) {
    if (!interaction.member.permissions.has("Administrator")) return interaction.reply({ content: "🔒 Admin only.", flags: 64 });
    const guildId = interaction.guild.id;
    const folder = path.join("waitlists", guildId);
    if (!fs.existsSync(folder)) return interaction.reply({ content: "📭 No waitlists to delete.", flags: 64 });
    const files = fs.readdirSync(folder).filter(f => f.endsWith(".json"));
    for (const f of files) fs.unlinkSync(path.join(folder, f));
    // log
    const nowTs = Math.floor(Date.now() / 1000);
    const cfgFile = path.join("configs", `${guildId}.json`);
    if (fs.existsSync(cfgFile)) {
      const cfg = JSON.parse(fs.readFileSync(cfgFile));
      const logCh = interaction.guild.channels.cache.get(cfg.logChannelId);
      if (logCh) logCh.send([`🧹 Purged all waitlists`, `Deleted Count: ${files.length}`, `By: <@${interaction.user.id}>`, `Time: <t:${nowTs}:F>`].join("\n"));
    }
    return interaction.reply({ content: `🗑 Deleted ${files.length} waitlists.`, flags: 64 });
  }
};
