const check = require('../../libs/utils/systemChecks');
const xbotHelp = require('../../libs/helpers/xbot');

const dbGet = require('../../libs/database/get');
const dbPost = require('../../libs/database/post');

const phrases = require('../../textData/phrases');
const generate = require('../../libs/helpers/stringCreators');
const action = require("../../libs/utils/systemActions");

module.exports = {
    async join(ctx) {
        const extraReply = { reply_to_message_id: ctx.message.message_id };

        const userId = ctx.message.from.id;
        const chatId = ctx.message.chat.id;

        await check.isRegistered(userId);
        await dbPost.xbotUser(userId, chatId);
        await action.customReply(ctx, phrases.xbotJoinSuccess, extraReply);
    },

    async play(ctx) {
        const chatId = ctx.message.chat.id;
        const playStatusData = await dbGet.xbotLaunchInfo(chatId);
        if (playStatusData[0]) await xbotHelp.announceCurrentWinner(ctx, playStatusData[1]);
        else await xbotHelp.chooseWinner(ctx, chatId);
    },

    async userStatus(ctx) {
        const extraReply = { reply_to_message_id: ctx.message.message_id };

        const userId = ctx.message.from.id;
        const chatId = ctx.message.chat.id;

        await check.isRegXbotUser(userId, chatId);
        await dbPost.xbotPlayerStatus(userId, chatId);
        const newStatus = await dbGet.xbotPlayerData(userId, chatId)
            .then(res => res.active);
        newStatus ? await action.customReply(ctx, phrases.xbotUnpaused, extraReply) : await action.customReply(ctx, phrases.xbotPaused, extraReply);

    },


    async showPlayerStats(ctx) {
        const extraReply = { reply_to_message_id: ctx.message.message_id };

        const userId = ctx.message.from.id;
        const chatId = ctx.message.chat.id;

        await check.isRegXbotUser(userId, chatId);
        const playerData = await dbGet.xbotPlayerData(userId, chatId);
        const isActiveText = playerData.active ? 'Включено' : 'Приостановлено'
        await action.customReply(ctx, `В этом году ты победил ${playerData.current_year_wins} раз(а).\nЗа всё время ты победил ${playerData.all_time_wins} раз(а).\nУчастие в игре в данном чате - ${isActiveText}.`, extraReply);

    },

    async leaderboard(ctx, isYearly) {
        const userId = ctx.message.from.id;
        const chatId = ctx.message.chat.id;

        let lbData = {
            firstReply: phrases.xbotAlltimeLbStart,
            getUsersQuery: `SELECT tg.*, all_time_wins
            FROM xbot_game xg
            JOIN telegram_users tg
            ON tg.user_id = xg.user_id
            WHERE xg.chat_id = '${chatId}' and xg.all_time_wins != '0'
            ORDER BY xg.all_time_wins DESC;`
        }
        if (isYearly) {
            lbData.firstReply = phrases.xbotLbStart;
            lbData.getUsersQuery = `SELECT tg.*, current_year_wins
            FROM xbot_game xg
            JOIN telegram_users tg
            ON tg.user_id = xg.user_id
            WHERE xg.chat_id = '${chatId}' AND xg.current_year_wins != '0'
            ORDER BY xg.current_year_wins DESC;`;
        }

        await action.customReply(ctx, lbData.firstReply)
        const chatLbUserData = await dbGet.customRequest(lbData.getUsersQuery);
        const message = generate.createLbReply(chatLbUserData, userId, false, isYearly);
        await action.customReply(ctx, message, { parse_mode: 'html', reply_to_message_id: ctx.message.message_id })
    }
}
