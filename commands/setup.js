// commands/setup.js
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Configure the waitlist bot for this server.")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addRoleOption(opt => opt.setName("manager_role1").setDescription("Manager Role #1").setRequired(true))
    .addRoleOption(opt => opt.setName("manager_role2").setDescription("Manager Role #2 (optional)").setRequired(false))
    .addRoleOption(opt => opt.setName("manager_role3").setDescription("Manager Role #3 (optional)").setRequired(false))
    .addChannelOption(opt => opt.setName("waitlist_channel").setDescription("Channel where waitlists will be posted").setRequired(true))
    .addChannelOption(opt => opt.setName("log_channel").setDescription("Optional channel for logs").setRequired(false)),

  async execute(interaction) {
    if (!interaction.guild) return interaction.reply({ content: "This command must be used in a server.", ephemeral: true });

    const roles = [
      interaction.options.getRole("manager_role1").id,
      interaction.options.getRole("manager_role2")?.id,
      interaction.options.getRole("manager_role3")?.id
    ].filter(Boolean);

    const waitlistChannel = interaction.options.getChannel("waitlist_channel");
    const logChannel = interaction.options.getChannel("log_channel");

    const guildId = interaction.guild.id;
    const configPath = path.join(__dirname, "..", "configs");
    if (!fs.existsSync(configPath)) fs.mkdirSync(configPath, { recursive: true });

    const config = {
      guildId,
      managerRoleIds: roles,
      waitlistChannelId: waitlistChannel.id,
      logChannelId: logChannel?.id || null
    };

    fs.writeFileSync(path.join(configPath, `${guildId}.json`), JSON.stringify(config, null, 2));

    const embed = new EmbedBuilder()
      .setTitle("✅ Setup Complete")
      .setDescription(`**Manager Roles:** ${roles.map(r => `<@&${r}>`).join(" ")}\n**Waitlist Channel:** <#${waitlistChannel.id}>\n${logChannel ? `**Log Channel:** <#${logChannel.id}>\n` : ""}\nManagers can create/add/remove/delete waitlists. Everyone can press update buttons.`)
      .setColor("Green");

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
