const { token, botAdminId } = require('../../config');

const phrases = require('../../textData/phrases');
const errors = require('./messages');

const dbGet = require('../../libs/database/get');
const dbPost = require('../../libs/database/post');

const map = require('../../libs/utils/mappers');
const { customReply } = require('../../libs/utils/systemActions');

const { Telegram } = require("telegraf");
const tg = new Telegram(token);

async function aliasRegistration(ctx, extraReply) {
    const alias = map.getUserByEntity(ctx)[3];

    if (alias == 'reply') await customReply(ctx, phrases.replyUserNotRegistered, extraReply);
    else if (alias == 'message') await customReply(ctx, phrases.currentUserNotRegistered, extraReply);
};

async function handleChatKick(chatId) {
    const chatConfig = await dbGet.chatConfig(chatId);
    if (chatConfig.changelog == true) await dbPost.configValue(chatId, 'changelog');
    if (chatConfig.mentions == true) await dbPost.configValue(chatId, 'mentions');
}

async function systemErrorHandler(err, ...args) {
    console.error(err.stack);
    switch (err.message) {
        case errors.systemXblNoAuthCredentials:
            await tg.sendMessage(botAdminId, phrases.xblUnexpectedError);
            await tg.sendMessage(botAdminId, err.stack);
            break;
        case errors.tgChatNotFound:
            if (args !== undefined && new RegExp('^-[0-9]*').test(args[0])) await handleChatKick(args[0]);
            console.error(err.message);
            break;
        case errors.sameMsgContent:
            console.info('Ignoring the error');
            break;
        case errors.tgKickedFromGroup:
            await handleChatKick(args[0]);
            break;
        case errors.tgKickedFromSuperGroup:
            await handleChatKick(args[0]);
            break;
        default:
            await tg.sendMessage(botAdminId, phrases.unexpectedError);
            await tg.sendMessage(botAdminId, err.stack);
            break;
    }
};

async function botErrorHandler(err, ctx) {

    // This is needed in case error is caused not by a message.
    let extraReply = {};
    if (ctx.message !== undefined ) {
        extraReply = { reply_to_message_id: ctx.message.message_id };
    };

    switch (err.message) {
        case errors.tgNotRegistered:
            await customReply(ctx, phrases.currentUserNotRegistered, extraReply);
            break;
        case errors.tgAliasNotRegistered:
            await aliasRegistration(ctx, extraReply);
            break;
        case errors.tgAlreadyRegistered:
            await customReply(ctx, phrases.userAlreadyRegistered, extraReply);
            break;
        case errors.xbotNotRegistered:
            await customReply(ctx, phrases.xbotNotRegistered, extraReply);
            break;
        case errors.notBotAdmin:
            await customReply(ctx, phrases.creatorOnly, extraReply);
            break;
        case errors.xblNoSubString:
            await customReply(ctx, phrases.xblNoSubString, extraReply);
            break;
        case errors.updateLimitExceeded:
            await customReply(ctx, phrases.updateLimitExceeded, extraReply);
            break;
        case errors.noGamertag:
            await customReply(ctx, phrases.noGamertag, extraReply);
            break;
        case errors.noGamerscore:
            await customReply(ctx, phrases.noGamerscore, extraReply);
            break;
        case errors.gamertagNotFound:
            await customReply(ctx, phrases.gamertagNotFound, extraReply);
            break;
        case errors.gamertagOccupied:
            await customReply(ctx, phrases.gamertagOccupied, extraReply);
            break;
        case errors.xbotDuplicate:
            await customReply(ctx, phrases.xbotAlreadyRegistered, extraReply);
            break;
        case errors.notEnoughUsers:
            await customReply(ctx, phrases.xbotNotEnoughUsers, extraReply);
            break;
        case errors.xbotNoChatData:
            await customReply(ctx, phrases.xbotNoChatData);
            break;
        case errors.xblNoAuthCredentials:
            await customReply(ctx, phrases.xblUserFetchError, extraReply);
            break;
        case errors.notKeyboardAuthor:
            await ctx.answerCbQuery(phrases.notKeyboardAuthor, {show_alert: true});
            break;
        case errors.noReplyMessage:
            await customReply(ctx, phrases.noReplyMessage, extraReply);
            break;
        case errors.notBotMessage:
            await customReply(ctx, phrases.notBotMessage, extraReply);
            break;
        default:
            console.log(err.stack);
            await customReply(ctx, phrases.unexpectedError, extraReply);
            break;
    }
}

module.exports = {
    botErrorHandler,
    systemErrorHandler,
    aliasRegistration
}
