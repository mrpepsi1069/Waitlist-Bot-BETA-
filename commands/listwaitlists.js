// commands/listwaitlists.js
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
  data: new SlashCommandBuilder().setName("listwaitlists").setDescription("Show all waitlists & users."),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const folder = path.join("waitlists", guildId);
    if (!fs.existsSync(folder)) return interaction.reply({ content: "📭 No waitlists exist.", flags: 64 });

    const files = fs.readdirSync(folder).filter(f => f.endsWith(".json"));
    if (!files.length) return interaction.reply({ content: "📭 No waitlists exist.", flags: 64 });

    const embed = new EmbedBuilder().setTitle("📄 All Waitlists").setColor("Blue");
    for (const file of files) {
      const name = file.replace(".json", "");
      const data = JSON.parse(fs.readFileSync(path.join(folder, file)));
      const users = (data.users && data.users.length)
        ? data.users.map((id, i) => (/^\d+$/.test(id) ? `${i + 1}. <@${id}>` : `${i + 1}. ${id}`)).join("\n")
        : "_No users_";
      embed.addFields({ name: `📌 ${name}`, value: users });
    }

    return interaction.reply({ embeds: [embed], flags: 64 });
  }
};
