const { token } = require("../config");

const { Telegraf, Composer } = require("telegraf");
const bot = new Telegraf(token);

const { telegrafThrottler } = require('telegraf-throttler');
const throttler = telegrafThrottler();

const CronJob = require('cron').CronJob;

const systemCmd = require('./commands/system');
const xbox = require('./commands/xbox');
const schedule = require('./commands/autoUpdates');

const { groupComposer, isGroupChat, groupCommands } = require('./composers/groupChat');
const { adminComposer, isChatAdmin, adminCommands } = require('./composers/admin');
const { devComposer, isBotDeveloper, devCommands } = require('./composers/developer');

const { botErrorHandler, systemErrorHandler } = require('./errors/handler')
const phrases = require('../textData/phrases');
const bigString = require('../textData/bigString');
const { customReply } = require('../libs/utils/systemActions');
const cbHandler = require('./inlineKeyboards/cbHandlers');

const minuteJobs = new CronJob('05 * * * * *', async function() {
    await schedule.expiredTtlRemoval().catch(async err => await systemErrorHandler(err));
});

const dailyJobs = new CronJob('00 00 00 * * *', async function () {
    await schedule.xbotDaily().catch(async err => await systemErrorHandler(err));
    await schedule.updateAllUsersData().catch(async err => await systemErrorHandler(err));
    await schedule.updateAllGamerscores().catch(async err => await systemErrorHandler(err));
});

const monthlyJobs = new CronJob('00 30 00 1 * *', function () {
    schedule.monthlyScoreSnapshot().catch(async err => await systemErrorHandler(err));
});

const yearlyJobs = new CronJob('00 00 00 01 Jan *', function () {
    schedule.yearlyXbotReset().catch(async err => await systemErrorHandler(err));
});

minuteJobs.start();
dailyJobs.start();
monthlyJobs.start();
yearlyJobs.start();

bot.use(throttler);

bot.start(async ctx => await customReply(ctx, phrases.xboxPower, { reply_to_message_id: ctx.message.message_id }));
bot.help(ctx => customReply(ctx, bigString.help, { reply_to_message_id: ctx.message.message_id }));

bot.command('list', ctx => customReply(ctx, bigString.cmdList, { reply_to_message_id: ctx.message.message_id }));
bot.command('how_to', ctx => customReply(ctx, bigString.howTo, { reply_to_message_id: ctx.message.message_id }));
bot.command('xbox_list', ctx => customReply(ctx, bigString.xboxCmdList, { reply_to_message_id: ctx.message.message_id }));
bot.command('xbot_list', ctx => customReply(ctx, bigString.xbotGameCmdList, { reply_to_message_id: ctx.message.message_id }));

bot.command('ping', ctx => customReply(ctx, 'pong', { reply_to_message_id: ctx.message.message_id }));
bot.command('privacy', ctx => customReply(ctx, bigString.privacy));

bot.command('intercept', ctx => console.log(ctx.message)); // Used for debugging. Puts the message contents in the logs.

bot.command('update', ctx => systemCmd.update(ctx));  // Updated the telegram user info by initiator or user in the reply.
bot.command('gamertag_set', ctx => xbox.gamertagSet(ctx)); // Assigns the Xbox Live gamertag to a Telegram user.

bot.command('live_score', ctx => xbox.getGamerscore(ctx)); // Shows the XBL score for initiator or user in the reply.
bot.command('live_upd', ctx => xbox.updateGamerscore(ctx)); // Manual XBL score update. 1 update per day for each individual user.

// bot.command('destiny2') // Not implemented. Supposed to show stats for Destiny 2 game.

bot.on('callback_query', async ctx => {
    const button = ctx.update.callback_query.data;
    await cbHandler.handler(ctx, button);
});

bot.on(
    ['message', 'edited_message'],
    Composer.branch(
        ({ chat }) => isGroupChat(chat),
        groupComposer,
        Composer.command(groupCommands, async (ctx, next) => {
            await customReply(ctx, phrases.notGroup);
            await next();
        })
    ),
    Composer.branch(
        ctx => isChatAdmin(ctx),
        adminComposer,
        Composer.command(adminCommands, async (ctx, next) => {
            await customReply(ctx, phrases.notChatAdmin);
            await next();
        })
    ),
    Composer.branch(
        ctx => isBotDeveloper(ctx),
        devComposer,
        Composer.command(devCommands, async (ctx, next) => {
            await customReply(ctx, phrases.notBotAdmin);
            await next();
        })
    ),
);

bot.catch(async (err, ctx) => await botErrorHandler(err, ctx));

systemCmd.easterEggSetup();

bot.launch();
