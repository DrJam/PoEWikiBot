const Discord = require("discord.js")

var config = require("./config.json")
var client = new Discord.Client({
    disableEveryone: true,
    disabledEvents: ["TYPING_START"]
});

client.token = config.token;
client.login();
console.log("Logged in");
client.on("ready", () => {
    console.log(`Ready as ${Client.user.username}`)
});