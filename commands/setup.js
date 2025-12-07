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
    .addChannelOption(opt => opt.setName("waitlist_channel").setDescription("Channel where waitlists will be posted").setRequired(true))
    .addChannelOption(opt => opt.setName("log_channel").setDescription("Channel where logs will be sent").setRequired(true))
    .addRoleOption(opt => opt.setName("manager_role2").setDescription("Manager Role #2 (optional)").setRequired(false))
    .addRoleOption(opt => opt.setName("manager_role3").setDescription("Manager Role #3 (optional)").setRequired(false)),

  async execute(interaction) {
    const role1 = interaction.options.getRole("manager_role1");
    const role2 = interaction.options.getRole("manager_role2") ?? null;
    const role3 = interaction.options.getRole("manager_role3") ?? null;
    const waitlistChannel = interaction.options.getChannel("waitlist_channel");
    const logChannel = interaction.options.getChannel("log_channel");

    if (!waitlistChannel || !logChannel) return interaction.reply({ content: "❌ Invalid channel.", flags: 64 });

    const roles = [role1.id];
    if (role2) roles.push(role2.id);
    if (role3) roles.push(role3.id);

    const guildId = interaction.guild.id;
    const cfgFolder = path.join(__dirname, "..", "configs");
    if (!fs.existsSync(cfgFolder)) fs.mkdirSync(cfgFolder, { recursive: true });

    const config = { guildId, managerRoleIds: roles, waitlistChannelId: waitlistChannel.id, logChannelId: logChannel.id };
    fs.writeFileSync(path.join(cfgFolder, `${guildId}.json`), JSON.stringify(config, null, 2));

    const embed = new EmbedBuilder().setTitle("✅ Setup Complete").setColor("Green")
      .setDescription(`**Manager Roles:**\n${roles.map(r => `<@&${r}>`).join("\n")}\n\n**Waitlist Channel:** <#${waitlistChannel.id}>\n**Log Channel:** <#${logChannel.id}>\n\nManagers can create/add/remove/rename/delete waitlists.\nEveryone can press Update.`);

    return interaction.reply({ embeds: [embed], flags: 64 });
  }
};
