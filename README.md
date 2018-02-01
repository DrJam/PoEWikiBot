# PoEWikiBot
A Discord bot for looking up Path of Exile items on the Wiki.  It will post an image of the Item information from the wiki.

## Requirements

This requires Node.js version 7.6+ as it uses async/await calls.

## Configuration

Rename _template.config.json_ to _config.json_.

Update the token value in _config.json_ with your Discord Bot token.

Start the bot with  _node app.js_

## Support for other wikis

You should be able to edit the _wikiURL_ and _wikiDiv_ settings in the _config.json_ to a different Wiki.

The _wikiDiv_ is the CSS selector that the bot will screenshot.

## Usage

syntax: _[[ItemName]]_

![The Scourge](/screenshots/The_Scourge.png?raw=true "The Scourge")