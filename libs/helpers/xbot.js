const action = require('../utils/systemActions');
const check = require('../utils/systemChecks');
const map = require('../utils/mappers');

const xbotText = require('../../textData/xbotPlayReplies');
const phrases = require('../../textData/phrases');

const errors = require('../../botScript/errors/messages');

const dbGet = require('../database/get');
const dbPost = require('../database/post');

async function playTheGame(ctx, rawUserData, chatId, winnerId,) {
    const userPing = map.definePingType(rawUserData, winnerId);
    await dbPost.xbotWinner(chatId, winnerId);
    await xbotText.xbotReplyChainStart(ctx, userPing);
};

async function makeInactive(ctx, userId, chatId) {
    const extraReply = { reply_to_message_id: ctx.message.message_id };

    await action.customReply(ctx, phrases.xbotUserInactive);
    await new Promise(resolve => setTimeout(resolve, 1500));
    try {
        await dbPost.xbotPlayerStatus(userId, chatId);
        await action.customReply(ctx, phrases.xbotInactiveFinished, extraReply)
    }
    catch (err) {
        await action.customReply(ctx, phrases.xbotInactiveFinishedErr, extraReply)
    }
};

async function chooseWinner(ctx, chatId) {
    const allChatPlayers = await dbGet.xbotChatPlayers(chatId);
    await check.isDataValid(allChatPlayers, errors.xbotNoChatData);
    await check.isEnoughUsers(allChatPlayers);
    const randomPlayer = action.pseudoHonestRandom(allChatPlayers);
    const winnerId = randomPlayer.user_id;
    const rawUserData = await dbGet.tgUserData(winnerId);
    const userStatus = await map.activeMember(chatId, winnerId);
    if (userStatus[1]) playTheGame(ctx, rawUserData, chatId, winnerId)
    else makeInactive(ctx, winnerId, chatId);
};

async function announceCurrentWinner(ctx, userId) {
    const rawUserData = await dbGet.tgUserData(userId);
    const winnerName = rawUserData.username === 'undefined' ? rawUserData.first_name : rawUserData.username;
    await action.customReply(ctx, `Сегодня победил - ${winnerName}`, { reply_to_message_id: ctx.message.message_id })
};

module.exports = {
    announceCurrentWinner,
    chooseWinner
};
