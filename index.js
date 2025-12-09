// ======================================
// Waitlist Bot + Website (Koyeb Ready)
// ======================================

require("dotenv").config();
const express = require("express");
const path = require("path");
const fs = require("fs");
const app = express();

// =========================
// WEBSITE STATIC FILES
// =========================

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Live bot status API
let BOT_READY = false;
let START_TIME = Date.now();

app.get("/status", (req, res) => {
  let totalWaitlists = 0;
  const basePath = path.join(__dirname, "waitlists");

  if (fs.existsSync(basePath)) {
    const guildFolders = fs.readdirSync(basePath);
    for (const folder of guildFolders) {
      const full = path.join(basePath, folder);
      const files = fs.readdirSync(full).filter(f => f.endsWith(".json"));
      totalWaitlists += files.length;
    }
  }

  res.json({
    online: BOT_READY,
    uptime: Date.now() - START_TIME,
    waitlists: totalWaitlists,
    guilds: client.guilds.cache.size
  });
});

// =========================
// DISCORD BOT SETUP
// =========================

const {
  Client,
  GatewayIntentBits,
  Collection,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField
} = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

client.commands = new Collection();

// =========================
// LOAD COMMANDS
// =========================

const commandsPath = path.join(__dirname, "commands");
if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath);
  for (const file of commandFiles) {
    const cmd = require(path.join(commandsPath, file));
    client.commands.set(cmd.data.name, cmd);
    console.log("Loaded:", cmd.data.name);
  }
}

// =========================
// MAIN INTERACTION HANDLER
// =========================

client.on("interactionCreate", async interaction => {
  try {
    // AUTOCOMPLETE
    if (interaction.isAutocomplete()) {
      const guildId = interaction.guild.id;
      const dir = path.join(__dirname, "waitlists", guildId);

      if (!fs.existsSync(dir)) return interaction.respond([]);

      const files = fs.readdirSync(dir).filter(f => f.endsWith(".json"));
      const names = files.map(f => f.replace(".json", ""));
      const focused = interaction.options.getFocused().toLowerCase();

      const filtered = names.filter(n => n.toLowerCase().includes(focused));
      return interaction.respond(
        filtered.map(n => ({ name: n, value: n }))
      );
    }

    // SLASH COMMANDS
    if (interaction.isChatInputCommand()) {
      const cmd = client.commands.get(interaction.commandName);
      if (!cmd) return;

      await cmd.execute(interaction);
      return;
    }

    // BUTTON HANDLER
    if (interaction.isButton()) {
      const [action, waitlistName] = interaction.customId.split("_");
      const guildId = interaction.guild.id;

      const file = path.join(__dirname, "waitlists", guildId, `${waitlistName}.json`);
      const configFile = path.join(__dirname, "configs", `${guildId}.json`);

      if (!fs.existsSync(configFile)) {
        return interaction.reply({ content: "❌ Server not set up.", flags: 64 });
      }

      const config = JSON.parse(fs.readFileSync(configFile));

      // UPDATE BUTTON
      if (action === "update") {
        if (!fs.existsSync(file)) {
          return interaction.reply({ content: "❌ Waitlist missing.", flags: 64 });
        }

        const data = JSON.parse(fs.readFileSync(file));

        const embed = new EmbedBuilder()
          .setTitle(`📋 Waitlist: ${waitlistName}`)
          .setColor("Blue")
          .setDescription(
            data.users.length
              ? data.users.map((id, i) => `${i + 1}. <@${id}>`).join("\n")
              : "_No users yet._"
          );

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`update_${waitlistName}`)
            .setLabel("Update")
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`delete_${waitlistName}`)
            .setLabel("Delete")
            .setStyle(ButtonStyle.Danger)
        );

        return interaction.update({ embeds: [embed], components: [row] });
      }

      // DELETE BUTTON
      if (action === "delete") {
        const roles = interaction.member.roles.cache.map(r => r.id);
        const isManager = roles.some(r => config.managerRoleIds.includes(r));
        const isAdmin = interaction.member.permissions.has(
          PermissionsBitField.Flags.Administrator
        );

        if (!isAdmin && !isManager) {
          return interaction.reply({
            content: "❌ No permission.",
            flags: 64
          });
        }

        if (fs.existsSync(file)) fs.unlinkSync(file);

        if (config.logChannelId) {
          const log = interaction.guild.channels.cache.get(config.logChannelId);
          if (log) {
            log.send(
              `🗑️ Waitlist Deleted: **${waitlistName}**
👤 <@${interaction.user.id}>
🕒 <t:${Math.floor(Date.now() / 1000)}:F>`
            );
          }
        }

        return interaction.update({
          content: `🗑️ Deleted **${waitlistName}**.`,
          embeds: [],
          components: []
        });
      }
    }
  } catch (err) {
    console.error("Interaction error:", err);
  }
});

// =========================
// BOT READY
// =========================

client.on("clientReady", () => {
  BOT_READY = true;
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.login(process.env.TOKEN);

// =========================
// WEB SERVER (REQUIRED)
// =========================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🌐 Web server running on port ${PORT}`)
);
