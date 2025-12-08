// ======================================
// Waitlist Bot + Website (Anti-Crash)
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

// Live bot status for the website
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

// Load commands
const commandsPath = path.join(__dirname, "commands");
if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath);

  for (const file of commandFiles) {
    try {
      const command = require(path.join(commandsPath, file));
      client.commands.set(command.data.name, command);
      console.log("Loaded command:", command.data.name);
    } catch (err) {
      console.error("Failed to load command:", file, err);
    }
  }
} else {
  console.warn("⚠️ No commands folder found!");
}

// =========================
// SINGLE interaction handler
// (prevents double firing)
// =========================

client.on("interactionCreate", async (interaction) => {
  try {
    // =============== AUTOCOMPLETE ===============
    if (interaction.isAutocomplete()) {
      const guildId = interaction.guild.id;
      const dirPath = path.join(__dirname, "waitlists", guildId);

      if (!fs.existsSync(dirPath)) return interaction.respond([]);

      const files = fs.readdirSync(dirPath).filter(f => f.endsWith(".json"));
      const names = files.map(f => f.replace(".json", ""));

      const focused = interaction.options.getFocused()?.toLowerCase() || "";
      const filtered = names.filter(n => n.toLowerCase().includes(focused));

      return interaction.respond(filtered.map(n => ({ name: n, value: n })));
    }

    // =============== SLASH COMMANDS ===============
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command)
        return interaction.reply({ content: "❌ Unknown command.", flags: 64 });

      try {
        await command.execute(interaction);
      } catch (err) {
        console.error(err);
        return interaction.reply({
          content: "❌ Error running command.",
          flags: 64
        });
      }
      return;
    }

    // =============== BUTTON HANDLER ===============
    if (interaction.isButton()) {
      // Protect from invalid customIds
      const parts = interaction.customId.split("_");
      if (parts.length < 2 || !parts[1]) {
        return interaction.reply({
          content: "❌ Invalid button.",
          flags: 64
        });
      }

      const [action, waitlistName] = parts;
      const guildId = interaction.guild.id;

      // Paths
      const file = path.join(
        __dirname,
        "waitlists",
        guildId,
        `${waitlistName}.json`
      );

      const configFile = path.join(
        __dirname,
        "configs",
        `${guildId}.json`
      );

      if (!fs.existsSync(configFile)) {
        return interaction.reply({
          content: "❌ Server is not fully set up.",
          flags: 64
        });
      }

      const config = JSON.parse(fs.readFileSync(configFile));

      // =======================
      // UPDATE BUTTON
      ========================
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

        return interaction.update({
          embeds: [embed],
          components: [row]
        });
      }

      // =======================
      // DELETE BUTTON
      ========================
      if (action === "delete") {
        const roles = interaction.member.roles.cache.map(r => r.id);
        const isManager = roles.some(id => config.managerRoleIds.includes(id));
        const isAdmin = interaction.member.permissions.has(
          PermissionsBitField.Flags.Administrator
        );

        if (!isAdmin && !isManager) {
          return interaction.reply({
            content: "❌ You do not have permission.",
            flags: 64
          });
        }

        if (fs.existsSync(file)) fs.unlinkSync(file);

        // Logging
        if (config.logChannelId) {
          const channel = interaction.guild.channels.cache.get(config.logChannelId);
          if (channel) {
            channel.send(
              `🗑️ **Waitlist Deleted:** \`${waitlistName}\`\n👤 <@${interaction.user.id}>\n🕒 <t:${Math.floor(Date.now() / 1000)}:F>`
            ).catch(() => {});
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
    console.error("❌ Interaction Crash Prevented:", err);

    if (interaction.deferred || interaction.replied) {
      return interaction.editReply({
        content: "⚠️ Something went wrong.",
      });
    } else {
      return interaction.reply({
        content: "⚠️ Something went wrong.",
        flags: 64
      });
    }
  }
});

// =========================
// Login Event
// =========================
client.on("clientReady", () => {
  BOT_READY = true;
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// Start bot
client.login(process.env.TOKEN);

// =========================
// Web Server (no duplicates)
// =========================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🌐 Website running on port ${PORT}`);
});
