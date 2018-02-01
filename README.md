# PoEWikiBot
Discord bot for looking up Path of Exile items on the wiki

## Requirements

This requires Node.js version 7.6+ as it uses async/await calls.

## Configuration

Rename template.config.json to config.json
Update the token value in config.json with your Discord Bot token

## Support for other wikis

You should be able to edit the wikiURL and wikiDiv settings in the config.json to a different Wiki.  The wikiDiv is the CSS selector that the bot will screenshot.

## Usage

syntax: [[ItemName]]