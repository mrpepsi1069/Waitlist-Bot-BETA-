const fs = require("fs");
const path = require("path");

function getWaitlistChoices() {
    const dir = path.join(__dirname, "..", "waitlists");

    if (!fs.existsSync(dir)) return [];

    return fs.readdirSync(dir)
        .filter(f => f.endsWith(".json"))
        .map(f => {
            const name = f.replace(".json", "");
            return {
                name: name,
                value: name
            };
        });
}

module.exports = { getWaitlistChoices };
