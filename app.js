const Discord = require("discord.js");
const puppeteer = require('puppeteer');
const SimpleNodeLogger = require('simple-node-logger')

const config = require("./config.json");
const wikiRegex = /\[\[([^\[\]]*)\]\]|\[([^\[\]]*)\]/gu;

let log = SimpleNodeLogger.createSimpleLogger({
	logFilePath: './logs/requests.log',
	timestampFormat: 'YYYY-MM-DD HH:mm:ss'
});
let errorLog = SimpleNodeLogger.createSimpleLogger({
	logFilePath: './logs/error.log',
	timestampFormat: 'YYYY-MM-DD HH:mm:ss'
});
errorLog.setLevel('error');

//Setup our browser
(async () => {
	browser = await puppeteer.launch({
		ignoreHTTPSError: true,
		headless: true,
		handleSIGHUP: true,
		args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
	});
})();

var client = new Discord.Client({
	disableEveryone: true,
	disabledEvents: ["TYPING_START"]
});

client.login(config.token).then(() => {
	console.log("Logged in");
});

client.on("ready", () => {
	console.log(`Ready as ${client.user.username}`);
});

client.on("message", (message) => {
	if (message.author.bot) return;
	try {
		const server = message.guild.name;
		let matches = wikiRegex.exec(message.cleanContent);
		while (matches) {
			let target = titleCase(matches[1]);
			handleItem(target, message.channel, server);
			matches = wikiRegex.exec(message.cleanContent);
		}
	} catch (error) {
		errorLog.error(`"${error.message}"`);
	}
});

async function handleItem(name, channel, server) {
	let itemUrlPart = convertToUrlString(name);
	var url = config.wikiURL + itemUrlPart;
	let initalMessage = "Retrieving details from the Wiki for **" + name + "**";
	var messageId;
	await channel
		.send(initalMessage)
		.then(message => {
			//console.log(`Sent message: ${message.id} ${initialMessage}`);
			messageId = message.id;
		})
		.catch(error => {
			//console.log(error.message)
			errorLog.error(`"${error.message}" "${server}" "${name}"`);
		})

	if (messageId != null) {
		await getImage(url, server)
			.then((result) => {
				if (result.success == false) {
					channel
						.fetchMessage(messageId)
						.then(message => {
							message.edit("Could not get details from the Wiki for **" + name + "**");
						})
						.catch(error => {
							errorLog.error(`"${error.message}" "${server}" "${name}"`);
						})
				} else {
					log.info(`"${server}" "${name}" "${url}"`);
					//need a way that lets us add an attachment message, currently I can only edit text to it
					let output = '<' + url + '>';
					//if no screenshot, just edit the original message
					if (result.screenshot == false) {
						channel
							.fetchMessage(messageId)
							.then(message => {
								message.edit(output);
							})
							.catch(error => {
								errorLog.error(`"Could not edit message ${messageId}" "${server}" "${name}"`);
							})
					} else {
						//otherwise delete the message and create a new one with the screenshot
						channel
							.fetchMessage(messageId)
							.then(message => {
								message.delete();
							})
							.catch(error => {
								errorLog.error(`"Could not delete message ${messageId}" "${server}" "${name}"`);
							})
						channel.send(output, { file: result.screenshot });
					}
					console.log('Found in the wiki and sent: ' + url);
				}
			})
			.catch(error => {
				errorLog.error(`"${error.message}" "${server}" "${name}"`);
			})
	}
}

async function getImage(url, server) {
	//console.time('getPage')
	const page = await browser.newPage();
	//Disabling Javascript adds 100% increased performance
	await page.setJavaScriptEnabled(config.enableJavascript)
	var output = {
		screenshot: false,
		success: false
	}

	//Set a tall page so the image isn't covered by popups
	await page.setViewport({ 'width': config.width, 'height': config.height });

	try {
		//played around with a few different waitUntils.  This one seemed the quickest.
		//If you don't disable Javascript on the PoE Wiki site, removing this parameter makes it hang
		await page.goto(url, { waitUntil: 'load' });
	} catch (error) {
		errorLog.error(`"${error.message}" "${server}" "${url}"`);
	}

	var invalidPage = await page.$(config.wikiInvalidPage);
	//if we have a invalid page, lets exit
	if (invalidPage != null) {
		return output;
	}

	var infoBox = await page.$('.infocard');
	if (infoBox != null) {
		try {
			output.screenshot = await infoBox.screenshot();
			output.success = true;
		} catch (error) {
			output.success = true;
		}
		return output;
	}

	//if we have a div for the item, screenshot it.
	//If not, just return the page without the screenshot
	const div = await page.$(config.wikiDiv);
	if (div != null) {
		try {
			output.screenshot = await div.screenshot();
			output.success = true;
		} catch (error) {
			output.success = true;
		}
	} else {
		output.success = true;
	}

	await page.close();
	//console.timeEnd('getPage')
	return output;

}

function convertToUrlString(name) {
	return name.replace(/ /g, "_");
}

function titleCase(str) {
	let excludedWords = ["of", "and", "the", "to", "at", "for"];
	str = str.toLowerCase();
	let words = str.split(" ");

	words.forEach((word, index) => {
		if (index > 0 && excludedWords.includes())
			return;

		words[index] = word.charAt(0).toUpperCase() + word.substr(1);
	})

	return words.join(" ");
};