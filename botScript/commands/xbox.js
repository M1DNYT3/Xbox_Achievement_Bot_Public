const _ = require('lodash');

const { botId } = require('../../config');

const check = require('../../libs/utils/systemChecks');
const map = require('../../libs/utils/mappers');
const xblHelp = require('../../libs/helpers/xbox');

const errors = require('../errors/messages');

const dbPost = require('../../libs/database/post');
const dbGet = require('../../libs/database/get');

const phrases = require('../../textData/phrases');
const generate = require('../../libs/helpers/stringCreators');
const action = require("../../libs/utils/systemActions");

module.exports = {
    async gamertagSet(ctx) {
        const extraReply = { reply_to_message_id: ctx.message.message_id };

        const gamertag = await ctx.message.text.split(/^\/\w*@?\w*\s+/)[1].replaceAll("'", "");
        const userId = await ctx.message.from.id;

        await check.isRegistered(userId);
        await check.commandStringEntered(gamertag, errors.xblNoSubString);
        await check.gamertagDuplicate(userId, gamertag);
        await dbPost.gamertag(gamertag, userId);
        await action.customReply(ctx, `Твой новый геймертег – "${gamertag}"!`, extraReply);
    },

    async getGamerscore(ctx) {

        const extraReply = { reply_to_message_id: ctx.message.message_id };

        const userId = map.getUserByEntity(ctx)[0];

        await check.isRegistered(userId, true);
        const rawXblData = await dbGet.xblData(userId);
        const [gamertag, gamerscore] = [rawXblData.gamertag, rawXblData.gamerscore];
        await check.isDataValid(gamertag, errors.noGamertag);
        await check.isDataValid(gamerscore, errors.noGamerscore);
        await action.customReply(ctx, `Геймертег: ${gamertag}.\nСчёт в Xbox Live: ${gamerscore}.`, extraReply);
    },

    async updateGamerscore(ctx) {

        const extraReply = { reply_to_message_id: ctx.message.message_id };

        const userId = map.getUserByEntity(ctx)[0];
        await check.isRegistered(userId);
        const gamertag = await dbGet.xblData(userId)
            .then(res => res.gamertag);

        await check.isDataValid(gamertag, errors.noGamertag);
        await check.isXblScoreUpdatedToday(userId);

        await action.customReply(ctx, phrases.xblUpdateStart, extraReply);

        const credentials = await xblHelp.getAuthCredentials();
        await check.isDataValid(credentials, errors.xblNoAuthCredentials);

        const queryGamertag = await map.convertIfCyrillic(gamertag);
        const gamerscore = await xblHelp.retrieveGamerscore(queryGamertag, credentials);
        check.isGamerscoreRetrieved(gamerscore);

        await dbPost.gamerscore(gamerscore, gamertag, true);
        await action.customReply(ctx, phrases.xblUpdateDone, extraReply);

    },

    async chatLeaderboard(ctx, isMonthly) {
        const [userId, chatId] = [ctx.message.from.id, ctx.message.chat.id];
        let firstReply = phrases.liveLbStart;
        if (isMonthly) firstReply = phrases.liveLbMonthlyStart;
        await action.customReply(ctx, firstReply);
        const chatConfig = await dbGet.chatConfig(chatId);
        const users = await dbGet.xblUsers();

        const parsedIds = map.parseUserIds(users);
        let chatUsers = await map.getActiveChatUsers(chatId, parsedIds);
        if (chatConfig !== undefined && chatConfig.bot_in_leaderboard == false) {
            chatUsers = _.difference(chatUsers, [botId])
        };

        let getScoresQuery = `SELECT gamertag, gamerscore, user_id
            FROM xbox_live WHERE user_id = ANY(ARRAY[${chatUsers}])
            AND gamerscore IS NOT NULL ORDER BY gamerscore DESC`
        if (isMonthly) {
            getScoresQuery = `SELECT user_id, gamertag, gamerscore - month_start_score AS month_score
            FROM xbox_live WHERE user_id = ANY(ARRAY[${chatUsers}])
            AND gamerscore IS NOT NULL AND month_start_score != 0 AND gamerscore - month_start_score != 0
            ORDER BY month_score DESC`;
        };
        const scoresRawData = await dbGet.customRequest(getScoresQuery);
        const message = generate.createLbReply(scoresRawData, userId, true, isMonthly);
        await action.customReply(ctx, message, { parse_mode: 'html', reply_to_message_id: ctx.message.message_id })
    },

    async manualMonthlyUpdate(ctx) {
        const extraReply = { reply_to_message_id: ctx.message.message_id };

        const userId = ctx.message.from.id;
        await check.isRegistered(userId);
        const [gamertag, gamerscore, monthScore] = await dbGet.xblData(userId)
            .then(res => [res.gamertag, res.gamerscore, res.month_start_score]);

        await check.isDataValid(gamertag, errors.noGamertag);
        await check.isDataValid(gamerscore, errors.noGamerscore);

        if (monthScore !== undefined && monthScore !== null && monthScore != 0) {
            await action.customReply(ctx, `Твой счёт на начало месяца уже обновлён.\nГеймертег: ${gamertag}\nСчёт за месяц: ${gamerscore - monthScore}`, extraReply);
        }
        else {
            await dbPost.monthlyScore(userId, gamerscore);
            await action.customReply(ctx, phrases.manualMonthlySnapshotSuccess, extraReply);
        }
    }
}
