const Discord = require("discord.js");
const puppeteer = require('puppeteer');
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
    if (message.author.id == client.user.id) {
        //Disabled this check, as it causes it to not do a check if you post twice in a row.
        //return;
    }

    let matches = wikiRegex.exec(message.cleanContent);
    if (matches != null && matches.length > 0) {
        for (let i = 1; i < matches.length; i++) {
            handleItem(matches[i], message.channel);
        }
    }
});

async function handleItem(name, channel) {
    console.log(name)
    let itemUrlPart = convertToUrlString(name);
    var url = config.wikiURL + itemUrlPart;
    let initalMessage = "Retrieving details from the Wiki for **" + name + "**"
    var messageId;
    await channel
        .send(initalMessage)
        .then(message => {
            console.log(`Sent message: ${message.id}`)
            messageId = message.id
        })

    await getImage(url)
        .then((data) => {
            if (data.success == false) {
                channel
                    .fetchMessage(messageId)
                    .then(message => {
                        message.edit("Could not get details from the Wiki for **" + name + "**")
                    })
                    .catch(console.log)
            } else {
                let output = '<' + url + '>';
                channel
                    .fetchMessage(messageId)
                    .then(message => {
                        message.delete()
                    })
                    .catch(console.log)
                channel.send(output, { file: data.img });
                console.log('Found in the wiki and sent: ' + url)
            }
        })
        .catch(error => {
            console.log(error)
        })
}

async function getImage(url) {
    const browser = await puppeteer.launch({
        ignoreHTTPSError: true,
        headless: true
    });

    const page = await browser.newPage();
    //Set a tall page so the image isn't covered by popups
    await page.setViewport({ 'width': config.width, 'height': config.height })

    //our output
    var output = {
        success: false,
        img: null
    }

    try {
        await page.goto(url, { waitUntil: 'networkidle2' });
    } catch (e) {
        //console.log(e)
        return output;
    }
    try {
        const area = await page.$(config.wikiDiv);
        var screenshot = await area.screenshot();
    } catch (e) {
        //console.log(e)
        return output;
    }

    await browser.close();
    output.success = true;
    output.img = screenshot;
    return output
}


function convertToUrlString(name) {
    return name.replace(new RegExp(" ", "g"), "_");
}

