// ======================================
// Waitlist Bot + Website (Koyeb Compatible)
// ======================================

require("dotenv").config();
const express = require("express");
const app = express();
const path = require("path");
const fs = require("fs");

// =========================
// Website Static Files
// =========================

// Serve everything in /public
app.use(express.static(path.join(__dirname, "public")));

// ROOT PAGE
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Bot status API
let BOT_READY = false;

app.get("/status", (req, res) => {
  res.json({ online: BOT_READY });
});

// =========================
// Discord Bot Setup
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
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

client.commands = new Collection();

// =========================
// Load Commands
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
// MAIN Interaction Handler
// =========================
client.on("interactionCreate", async (interaction) => {
  try {
    // AUTOCOMPLETE
    if (interaction.isAutocomplete()) {
      const guildId = interaction.guild.id;
      const listDir = path.join(__dirname, "waitlists", guildId);

      if (!fs.existsSync(listDir)) return interaction.respond([]);

      const files = fs.readdirSync(listDir).filter(f => f.endsWith(".json"));
      const names = files.map(f => f.replace(".json", ""));

      const focused = interaction.options.getFocused()?.toLowerCase() || "";
      const filtered = names.filter(n => n.toLowerCase().includes(focused));

      return interaction.respond(filtered.map(n => ({ name: n, value: n })));
    }

    // SLASH COMMANDS
    if (interaction.isChatInputCommand()) {
      const cmd = client.commands.get(interaction.commandName);
      if (!cmd) return;

      await cmd.execute(interaction);
      return;
    }

    // BUTTONS
    if (interaction.isButton()) {
      const [action, name] = interaction.customId.split("_");
      const guildId = interaction.guild.id;

      const file = path.join(__dirname, "waitlists", guildId, `${name}.json`);
      const configFile = path.join(__dirname, "configs", `${guildId}.json`);

      if (!fs.existsSync(configFile)) {
        return interaction.reply({ content: "❌ Server not set up.", flags: 64 });
      }

      const config = JSON.parse(fs.readFileSync(configFile));

      if (action === "update") {
        if (!fs.existsSync(file)) {
          return interaction.reply({ content: "❌ Waitlist missing.", flags: 64 });
        }

        const data = JSON.parse(fs.readFileSync(file));

        const embed = new EmbedBuilder()
          .setTitle(`📋 Waitlist: ${name}`)
          .setColor("Blue")
          .setDescription(
            data.users.length
              ? data.users.map((id, i) => `${i+1}. <@${id}>`).join("\n")
              : "_No users yet._"
          );

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`update_${name}`).setLabel("Update").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId(`delete_${name}`).setLabel("Delete").setStyle(ButtonStyle.Danger)
        );

        return interaction.update({ embeds: [embed], components: [row] });
      }

      if (action === "delete") {
        const roles = interaction.member.roles.cache.map(r => r.id);
        const isManager = roles.some(r => config.managerRoleIds.includes(r));
        const isAdmin = interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);

        if (!isAdmin && !isManager) {
          return interaction.reply({ content: "❌ You cannot delete this.", flags: 64 });
        }

        if (fs.existsSync(file)) fs.unlinkSync(file);

        if (config.logChannelId) {
          const log = interaction.guild.channels.cache.get(config.logChannelId);
          if (log) {
            log.send(
              `🗑️ Deleted **${name}**\n👤 <@${interaction.user.id}>\n🕒 <t:${Math.floor(Date.now()/1000)}:F>`
            );
          }
        }

        return interaction.update({
          content: `🗑️ Deleted **${name}**.`,
          components: [],
          embeds: []
        });
      }
    }

  } catch (err) {
    console.error("Interaction error:", err);
  }
});

// =========================
// Bot Ready
// =========================
client.on("clientReady", () => {
  BOT_READY = true;
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// Login bot
client.login(process.env.TOKEN);

// =========================
// START EXPRESS SERVER (Koyeb requires this!)
// =========================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("🌐 Web server live on port", PORT));
