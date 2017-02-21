const http = require('http');
const Discord = require("discord.js");

const wikiRegex = new RegExp("\\[\\[([^\\[\\]]*)\\]\\]", "gu");
const urlRegex = new RegExp("\\w", "g");

var config = require("./config.json")
var client = new Discord.Client({
    disableEveryone: true,
    disabledEvents: ["TYPING_START"]
});

client.token = config.token;

client.login();
console.log("Logged in");

client.on("ready", () => {
    console.log(`Ready as ${client.user.username}`)
});

client.on("message", (message) => {
    if (message.author.id == client.user.id)
        return;

    let matches = wikiRegex.exec(message.cleanContent);
    if (matches != null && matches.length > 0) {
        for (let i = 1; i < matches.length; i++) {
            handleItem(matches[i], message.channel);
        }
    }
});

function handleItem(name, channel) {
    let urlItem = name.replace(new RegExp(" ", "g"), "_")
    let options = {
        host: 'pathofexile.gamepedia.com',
        path: `/${urlItem}`
    };

    console.log("Firing request")

    var req = http.request(options, function (res) {
        console.log('STATUS: ' + res.statusCode);
        console.log('HEADERS: ' + JSON.stringify(res.headers));

        res.setEncoding('utf8');
        let body = "";

        res.on('data', function (chunk) {
            console.log('BODY: ' + chunk);
            body += chunk;
        });

        res.on('end', function () {
            let output = `http://pathofexile.gamepedia.com/${urlItem}`;
            channel.sendMessage(output);
        });
    });
}