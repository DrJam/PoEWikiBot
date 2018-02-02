# PoEWikiBot
A Discord bot for looking up Path of Exile items on the Wiki.  It will post an image of the Item information from the wiki.

## Requirements

This requires Node.js version 7.6+ as it uses async/await calls.

## Configuration

Update the token value in **config.json** with your Discord Bot token.

Start the bot with  **node app.js**

## Support for other wikis

You should be able to edit the **wikiURL** and **wikiDiv** settings in the **config.json** to a different Wiki.

The **wikiDiv** is the CSS selector that the bot will screenshot.

## Known issues

### Posting a message

The Bot cannot edit the originally searching message it posts with an attachment, so when it finds a valid Image, it will delete the original post and make anew one with the image and Wiki link.  If the bot cannot find a valid Image, it will edit the original message instead.

### Performance

The Path of Exile Wiki is quite slow. There is an option set in the config.json file to disable Javascript. This gives 100% increased performance (or thereabouts).

## Settings

Settings available in the **config.json** are:

Settings | Default Value
---------|--------------
token | <None>
wikiURL | "https://pathofexile.gamepedia.com/"
wikiDiv | ".item-box"
width  | 2500,
height | 2500,
enableJavascript | false






## Usage

syntax: **[[ItemName]]**

![The Scourge](/screenshots/The_Scourge.png?raw=true "The Scourge")