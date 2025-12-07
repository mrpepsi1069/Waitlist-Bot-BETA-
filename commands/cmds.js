// commands/cmds.js
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder().setName("cmds").setDescription("Show bot commands."),
  async execute(interaction) {
    const embed = new EmbedBuilder().setTitle("📜 Commands").setColor("Blue").setDescription("List of commands:")
      .addFields(
        { name: "/setup", value: "Configure manager roles & waitlist channel (Admin)." },
        { name: "/createwaitlist", value: "Create a waitlist." },
        { name: "/setwaitlist", value: "Post panel with update/delete." },
        { name: "/add", value: "Add user to waitlist (managers)." },
        { name: "/remove", value: "Remove user (managers)." },
        { name: "/renamewaitlist", value: "Rename waitlist (managers)." },
        { name: "/deletewaitlist", value: "Delete waitlist (managers)." },
        { name: "/listwaitlists", value: "List all waitlists and users." },
        { name: "/purgeallwaitlists", value: "Delete all waitlists (admin)." },
        { name: "/cmds", value: "This panel." },
        { name: "/ping", value: "Show bot version & latency." }
      );
    return interaction.reply({ embeds: [embed], flags: 64 });
  }
};
