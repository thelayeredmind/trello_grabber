# Trello Card Grabber

With this little script you can get the content of all the cards (attachments, and notes) and transfer them to markdown, which can then simply be integrated into an obsidian vault, e.g.

## Usage

requires node > 14.8.0

Please not you need to change ([:1](./grab_trello_cards.js#L1)) to the path of your trello token and API Key.
Check the trello [API Introduction](https://developer.atlassian.com/cloud/trello/guides/rest-api/api-introduction/) how to get those

In powershell or bash write

```powershell
node .\grab_trello_cards.js board_name [target_root_folder] 
```

> Tip: you can add [> log.log] to the end of your command to pipe the output from STDOUT to a log file instead.
