// =========================
// Waitlist Bot + Website
// =========================

require("dotenv").config();
const express = require("express");
const app = express();
const path = require("path");
const fs = require("fs");

// Serve static files in /public
app.use(express.static(path.join(__dirname, "public")));

// Root page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// API for live bot status
let BOT_READY = false;

app.get("/status", (req, res) => {
  res.json({ online: BOT_READY });
});

// ---------------------------
// Discord Bot Setup
// ---------------------------
const {
  Client,
  GatewayIntentBits,
  Collection,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

client.commands = new Collection();

// Load commands dynamically
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath);

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  client.commands.set(command.data.name, command);
  console.log("Loaded command:", command.data.name);
}

// ---------------------------
// Autocomplete Behavior
// ---------------------------
client.on("interactionCreate", async interaction => {
  if (!interaction.isAutocomplete()) return;

  const guildId = interaction.guild.id;
  const dirPath = path.join(__dirname, "waitlists", guildId);

  if (!fs.existsSync(dirPath)) {
    return interaction.respond([]);
  }

  const files = fs.readdirSync(dirPath).filter(f => f.endsWith(".json"));
  const names = files.map(f => f.replace(".json", ""));

  const focused = interaction.options.getFocused()?.toLowerCase() || "";
  const filtered = names.filter(n => n.toLowerCase().includes(focused));

  interaction.respond(filtered.map(n => ({ name: n, value: n })));
});

// ---------------------------
// Slash Command Handling
// ---------------------------
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(err);
    return interaction.reply({
      content: "❌ An error occurred while running that command.",
      flags: 64 // ephemeral
    });
  }
});

// ---------------------------
// Button Handling
// ---------------------------
client.on("interactionCreate", async interaction => {
  if (!interaction.isButton()) return;

  const [action, waitlistName] = interaction.customId.split("_");
  const guildId = interaction.guild.id;

  const file = path.join(__dirname, "waitlists", guildId, `${waitlistName}.json`);
  const configFile = path.join(__dirname, "configs", `${guildId}.json`);

  if (!fs.existsSync(configFile)) {
    return interaction.reply({ content: "❌ Server not set up.", flags: 64 });
  }

  const config = JSON.parse(fs.readFileSync(configFile));

  // ---------------------------
  // UPDATE BUTTON
  // ---------------------------
  if (action === "update") {
    if (!fs.existsSync(file)) {
      return interaction.reply({
        content: "❌ This waitlist no longer exists.",
        flags: 64
      });
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

  // ---------------------------
  // DELETE BUTTON
  // ---------------------------
  if (action === "delete") {
    const memberRoles = interaction.member.roles.cache.map(r => r.id);
    const isManager = memberRoles.some(id => config.managerRoleIds.includes(id));
    const isAdmin = interaction.member.permissions.has("Administrator");

    if (!isAdmin && !isManager) {
      return interaction.reply({
        content: "❌ Only managers can delete waitlists.",
        flags: 64
      });
    }

    // Delete waitlist file
    if (fs.existsSync(file)) fs.unlinkSync(file);

    // Log to log channel if exists
    if (config.logChannelId) {
      const logChannel = interaction.guild.channels.cache.get(config.logChannelId);
      if (logChannel) {
        logChannel.send(
          `🗑 **Waitlist Deleted:** \`${waitlistName}\`\n👤 **By:** <@${interaction.user.id}>\n🕒 <t:${Math.floor(Date.now() / 1000)}:F>`
        );
      }
    }

    return interaction.update({
      content: `🗑 Deleted waitlist **${waitlistName}**.`,
      embeds: [],
      components: []
    });
  }
});

// ---------------------------
// Login Event
// ---------------------------
client.on("clientReady", () => {
  BOT_READY = true;
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.login(process.env.TOKEN);

// ---------------------------
// Web Server (NO DUPLICATES)
// ---------------------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🌐 Website running on port ${PORT}`);
});
