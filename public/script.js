async function updateStatus() {
    const status = document.getElementById("statusBox");

    try {
        const res = await fetch("/status");
        const data = await res.json();

        if (data.online) {
            status.className = "status online";
            status.textContent = "🟢 Bot Online";
        } else {
            status.className = "status offline";
            status.textContent = "🔴 Bot Offline";
        }

    } catch (e) {
        status.className = "status offline";
        status.textContent = "🔴 Unable to check status";
    }
}

async function updateUptime() {
    const box = document.getElementById("uptimeBox");

    try {
        const res = await fetch("/uptime");
        const { uptime } = await res.json();

        const sec = Math.floor(uptime / 1000);
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;

        box.textContent = `⏱️ Uptime: ${h}h ${m}m ${s}s`;

    } catch {
        box.textContent = "⏱️ Uptime: Error";
    }
}

async function updateStats() {
    try {
        const res = await fetch("/stats");
        const data = await res.json();

        document.getElementById("guildCard").textContent = `🌐 Servers: ${data.guilds}`;
        document.getElementById("waitlistCard").textContent = `📋 Waitlists: ${data.waitlists}`;
        document.getElementById("pingCard").textContent = `🏓 Ping: ${data.ping}ms`;

    } catch {
        document.getElementById("guildCard").textContent = "🌐 Servers: Error";
        document.getElementById("waitlistCard").textContent = "📋 Waitlists: Error";
        document.getElementById("pingCard").textContent = "🏓 Ping: Error";
    }
}

updateStatus();
updateUptime();
updateStats();

setInterval(updateStatus, 5000);
setInterval(updateUptime, 3000);
setInterval(updateStats, 7000);
