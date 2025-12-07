client.on("interactionCreate", async interaction => {
    if (interaction.isAutocomplete()) {
        const getWaitlists = require("./utils/getWaitlists");
        const choices = getWaitlists();

        const focused = interaction.options.getFocused();
        const filtered = choices.filter(c =>
            c.toLowerCase().startsWith(focused.toLowerCase())
        );

        await interaction.respond(
            filtered.map(c => ({
                name: c,
                value: c
            }))
        );
        return;
    }
});
