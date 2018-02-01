# PoEWikiBot
A Discord bot for looking up Path of Exile items on the Wiki.  It will post an image of the Item information from the wiki.

## Requirements

This requires Node.js version 7.6+ as it uses async/await calls.

## Configuration

Rename **template.config.json** to **config.json**.

Update the token value in **config.json** with your Discord Bot token.

Start the bot with  **node app.js**

## Support for other wikis

You should be able to edit the **wikiURL** and **wikiDiv** settings in the **config.json** to a different Wiki.

The **wikiDiv** is the CSS selector that the bot will screenshot.

## Usage

syntax: **[[ItemName]]**

![The Scourge](/screenshots/The_Scourge.png?raw=true "The Scourge")