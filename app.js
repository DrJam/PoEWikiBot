var http = require('http');
var cheerio = require('cheerio');
var jsdom = require("jsdom");
var domtoimage = require('dom-to-image');
var html2canvas = require('html2canvas');
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
    let itemUrlPart = convertToUrlString(name);
    var options = {
        host: 'pathofexile.gamepedia.com',
        path: `/${itemUrlPart}`,
        protocol: `http:`
    };

    console.log("Firing request")

    var request = http.request(options, function (response) {
        console.log('STATUS: ' + response.statusCode);
        console.log('HEADERS: ' + JSON.stringify(response.headers));

        response.setEncoding('utf8');
        let body = '';

        response.on('data', function (chunk) {
            console.log('BODY: ' + chunk);
            body += chunk;
        });

        response.on('end', function () {
            let output = `<http://pathofexile.gamepedia.com/${itemUrlPart}>`;
            let img = getImage(body);
            channel.sendMessage(output, { file: img });
        });
    }).end();
}

function getImage(body) {
    let $ = cheerio.load(body);
    let node = $('.infobox-page-container').get(0);
    html2canvas(node).then(function(canvas) {
        debugger;
    });
}

function convertToUrlString(name) {
    return name.replace(new RegExp(" ", "g"), "_");
}