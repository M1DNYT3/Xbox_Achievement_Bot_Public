const { Composer } = require('telegraf');
const devComposer = new Composer;

const botAdmins = ['336142128', '799485366'];
const systemCmd = require('../commands/system');
const schedule = require('../commands/autoUpdates');

async function isBotDeveloper(ctx) {
    const userId = ctx.message !== undefined ? ctx.message.from.id : ctx.update.edited_message.from.id;
    return botAdmins.includes(userId.toString()) ? true : false;
};

devComposer.command('notify', ctx => systemCmd.notifySubscribers(ctx));
devComposer.command('delete', ctx => systemCmd.deleteMessage(ctx));

devComposer.command('update_tg', () => schedule.updateAllUsersData()); // Force update on telegram users data.
devComposer.command('update_live', () => schedule.updateAllGamerscores()); // Force update Xbox Live gamerscore for all users.
devComposer.command('update_monthly', () => schedule.monthlyScoreSnapshot()); // Force snapshot for monthly userscore (just in case).

devComposer.command('xbot_refresh', () => schedule.xbotDaily()); // Manually reset current day play status for the xbot mini-game in all chats.
devComposer.command('year_reset', () => schedule.yearlyXbotReset()); // Force yearly reset for the xbot mini-game (just in case).

/*
 A necessary whitelist solution to make negative user scenario work.
 Without it, user cannot be notified that the command cannot be used in current conditions.
 In this case, listed commands can only be initiated by a bot developer.
*/
const devCommands = [
    'notify', 'delete',
    'update_tg', 'update_live', 'update_monthly',
    'xbot_refresh', 'year_reset'
];

module.exports = {
    devComposer,
    isBotDeveloper,
    devCommands
}
