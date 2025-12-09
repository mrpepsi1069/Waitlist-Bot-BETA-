// ======================================
// Waitlist Bot + Website (Pro Version)
// ======================================

require("dotenv").config();
const express = require("express");
const app = express();
const path = require("path");
const fs = require("fs");

// =========================
// Website Static Files
// =========================

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// =========================
// Bot Status API
// =========================

let BOT_READY = false;
let START_TIME = Date.now();

app.get("/status", (req, res) => {
  res.json({ online: BOT_READY });
});

app.get("/uptime", (req, res) => {
  res.json({ uptime: Date.now() - START_TIME });
});

app.get("/stats", (req, res) => {
  const guilds = client.guilds.cache.size;

  // Count waitlists
  let totalWaitlists = 0;
  const base = path.join(__dirname, "waitlists");

  if (fs.existsSync(base)) {
    for (const gid of fs.readdirSync(base)) {
      const dir = path.join(base, gid);
      if (fs.lstatSync(dir).isDirectory()) {
        totalWaitlists += fs.readdirSync(dir).filter(f => f.endsWith(".json")).length;
      }
    }
  }

  res.json({
    guilds,
    waitlists: totalWaitlists,
    ping: client.ws.ping
  });
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
  for (const file of fs.readdirSync(commandsPath)) {
    const cmd = require(path.join(commandsPath, file));
    client.commands.set(cmd.data.name, cmd);
    console.log("Loaded:", cmd.data.name);
  }
}

// =========================
// Interaction Handler
// =========================

client.on("interactionCreate", async (interaction) => {
  try {

    // AUTOCOMPLETE
    if (interaction.isAutocomplete()) {
      const dir = path.join(__dirname, "waitlists", interaction.guild.id);

      if (!fs.existsSync(dir)) return interaction.respond([]);

      const names = fs.readdirSync(dir)
        .filter(f => f.endsWith(".json"))
        .map(f => f.replace(".json", ""));

      const focus = interaction.options.getFocused()?.toLowerCase() || "";
      const filtered = names.filter(n => n.toLowerCase().includes(focus));

      return interaction.respond(filtered.map(n => ({ name: n, value: n })));
    }

    // SLASH COMMANDS
    if (interaction.isChatInputCommand()) {
      const cmd = client.commands.get(interaction.commandName);
      if (!cmd) return interaction.reply({ content: "❌ Unknown command.", flags: 64 });
      return cmd.execute(interaction);
    }

    // BUTTON HANDLER
    if (interaction.isButton()) {
      const [action, name] = interaction.customId.split("_");

      const guildId = interaction.guild.id;
      const file = path.join(__dirname, "waitlists", guildId, `${name}.json`);
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
          .setTitle(`📋 Waitlist: ${name}`)
          .setColor("Blue")
          .setDescription(
            data.users.length
              ? data.users.map((id, i) => `${i + 1}. <@${id}>`).join("\n")
              : "_No users yet._"
          );

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`update_${name}`).setLabel("Update").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId(`delete_${name}`).setLabel("Delete").setStyle(ButtonStyle.Danger)
        );

        return interaction.update({ embeds: [embed], components: [row] });
      }

      // DELETE BUTTON
      if (action === "delete") {
        const isManager = interaction.member.roles.cache
          .some(r => config.managerRoleIds.includes(r.id));

        const isAdmin = interaction.member.permissions.has(
          PermissionsBitField.Flags.Administrator
        );

        if (!isAdmin && !isManager) {
          return interaction.reply({ content: "❌ No permission.", flags: 64 });
        }

        if (fs.existsSync(file)) fs.unlinkSync(file);

        return interaction.update({
          content: `🗑️ Deleted **${name}**.`,
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
// Bot Ready
// =========================

client.on("clientReady", () => {
  BOT_READY = true;
  START_TIME = Date.now();
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.login(process.env.TOKEN);

// =========================
// Start Express Server
// =========================

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("🌐 Website running on port", PORT));
