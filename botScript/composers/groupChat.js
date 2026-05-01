const { Composer } = require('telegraf');
const groupComposer = new Composer();

const xbotGame = require('../commands/xbotGame');
const xbox = require('../commands/xbox');
const system = require('../commands/system');

function isGroupChat(chat) {
    return chat !== undefined && ['group', 'supergroup'].includes(chat.type)
};

groupComposer.command('register', ctx => system.register(ctx)); // Registers a telegram user in a database.

groupComposer.command('live_lb', ctx => xbox.chatLeaderboard(ctx, false)); // Shows an all-time gamerscore leaderboard for the current group chat.
groupComposer.command('monthly_score', ctx => xbox.manualMonthlyUpdate(ctx)); // Force-update monthly score if there are no records on it. Otherwise just shows the current score.
groupComposer.command('monthly_lb', ctx => xbox.chatLeaderboard(ctx, true)); // Shows a monthly hamerscore leaderboard for the current group chat.

groupComposer.command('xbot', ctx => xbotGame.play(ctx)); // Launch daily xbot mini-game or show the winner of the current day.
groupComposer.command('xbot_join', ctx => xbotGame.join(ctx)); // Registers a user in the xbot mini-game.
groupComposer.command('xbot_pause', ctx => xbotGame.userStatus(ctx)); // Pauses/Unpauses participation status of a registered user in the current group chat.
groupComposer.command('xbot_me', ctx => xbotGame.showPlayerStats(ctx)) // Shows the stats for a mini-age (current year, all-time, participation status).
groupComposer.command('xbot_stat', ctx => xbotGame.leaderboard(ctx, true)) // Shows a mini-game leaderboard for the current year in the current group chat.
groupComposer.command('xbot_all', ctx => xbotGame.leaderboard(ctx, false)) // Shows an all-time mini-game leaderboard in the current group chat.

/*
 A necessary whitelist solution to make negative user scenario work.
 Without it, user cannot be notified that the command cannot be used in current conditions.
 In this case, if user uses a group-chat-only command in a private chat with bot.
*/
const groupCommands = [
    'register',
    'monthly_score', 'monthly_lb', 'live_lb',
    'xbot', 'xbot_join', 'xbot_pause', 'xbot_me', 'xbot_stat', 'xbot_all'
];

module.exports = {
    groupCommands,
    groupComposer,
    isGroupChat
}
