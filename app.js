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

let client = new Discord.Client({
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
	let matches = wikiRegex.exec(message.cleanContent);
	while (matches) {
		let target = titleCase(matches[1] || matches[2]);
		handleItem(target, message);
		matches = wikiRegex.exec(message.cleanContent);
	}
});

async function handleItem(itemName, message) {
	var channel = message.channel;
	var guildName = message.guild.name;

	let itemUrlPart = convertToUrlString(itemName);
	let url = config.wikiURL + itemUrlPart;

	let initialMessage = "Retrieving details from the Wiki for **" + itemName + "**";

	let messageId;
	await channel.send(initialMessage)
		.then(message => messageId = message.id)
		.catch(error => {
			errorLog.error(`"${error.message}" "${guildName}" "${itemName}"`);
		})

	if (messageId == null) return;

	getImage(url, guildName).then(result => {
		let outputString = '<' + url + '>';

		if (!result.success) {
			editMessage(channel, messageId, `Could not get details from the Wiki for **${itemName}**`);
			setTimeout(function () {
				channel.fetchMessage(messageId).then(message => {
					message.delete();
				}).catch(() => {
					errorLog.error(`"Could not delete message ${messageId}" "${guildName}" "${outputString}"`);
				});
			}, 2000)
			log.error(`"${guildName}" "${itemName}" "${url}" "INVALID PAGE"`);
			return;
		}

		//log success
		log.info(`"${guildName}" "${itemName}" "${url}"`);

		if (result.textblock) {
			outputString += `\n${result.textblock}`;
		}

		//if no screenshot, just edit the original message
		if (!result.screenshot) {
			editMessage(channel, messageId, outputString)
			return;
		}

		//otherwise delete the message and create a new one with the screenshot
		channel.fetchMessage(messageId).then(message => {
			message.delete();
		}).catch(() => {
			errorLog.error(`"Could not delete message ${messageId}" "${guildName}" "${outputString}"`);
		});
		channel.send(outputString, { file: result.screenshot });
	})
}

function editMessage(channel, messageId, content) {
	channel.fetchMessage(messageId).then(message => {
		message.edit(content);
	}).catch(() => {
		errorLog.error(`"Could not edit message ${messageId}" "${channel.guild.name}" "${content}"`);
	});
}

async function getImage(url, guildName) {
	const page = await browser.newPage();

	//Disabling Javascript adds 100% increased performance
	await page.setJavaScriptEnabled(config.enableJavascript)
	let output = {
		screenshot: false,
		success: false
	};

	//Set a tall page so the image isn't covered by popups
	await page.setViewport({ 'width': config.width, 'height': config.height });

	try {
		//played around with a few different waitUntils.  This one seemed the quickest.
		//If you don't disable Javascript on the PoE Wiki site, removing this parameter makes it hang
		await page.goto(url, { waitUntil: 'load' });
	} catch (error) {
		errorLog.error(`"${error.message}" "${guildName}" "${url}"`);
		return;
	}

	const invalidPage = await page.$(config.wikiInvalidPageSelector);
	if (invalidPage !== null) {
		return output;
	}

	output.success = true;

	//try and get the first paragraph of text
	var paragraphs = await page.$(config.wikiParagraphsSelector);
	//can't get these two strings out due to scope, not sure how to
	if (await paragraphs.$(config.wikiInfoboxPageContainerSelector)) 
		output.textblock = await page.evaluate(() => document.querySelector('#mw-content-text > .mw-parser-output > p:nth-of-type(2)').innerText);
		//second paragraph because first contains item info box
	else
		output.textblock = await page.evaluate(() => document.querySelector('#mw-content-text > .mw-parser-output > p:nth-of-type(1)').innerText);
		//first paragraph

	//remove newlines
	output.textblock = output.textblock.replace(/[\n\r]/g, '');

	const infoBox = await page.$(config.wikiInfoCardSelector);
	//if we have a div for the page, screenshot it.
	if (infoBox) {
		output.screenshot = await infoBox.screenshot();
		return output;
	}

	const itemBox = await page.$(config.wikiItemBoxSelector);
	//try and get the alternative box for items and div cards
	if (itemBox) {
		output.screenshot = await itemBox.screenshot();
		return output;
	}

	const wikiTable = await page.$(config.wikiTableSelector);
	//try and get table if its the first child in body
	if (wikiTable) {
		output.screenshot = await wikiTable.screenshot();
		return output;
	}

	await page.close();
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
		if (index > 0 && excludedWords.includes(word))
			return;

		words[index] = word.charAt(0).toUpperCase() + word.substr(1);
	})

	return words.join(" ");
};