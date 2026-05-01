const { Telegram, Markup } = require('telegraf');
const { token } = require('../../config');
const tg = new Telegram(token);

const dbGet = require('../database/get');
const dbPost = require('../database/post');

const generate = require('../helpers/stringCreators');
const phrases = require('../../textData/phrases');
const map = require('../utils/mappers');

/* Отвечает на сообщение пользователя, если есть id-сообщения (extraReply),
    то отвечает реплаем, в ином случае пишет обычное сообщение */

async function customReply(ctx, text, ...extraReply){
    if(extraReply === undefined){
        return await ctx.reply(text)
            .then(res => res)
            .catch(err => console.error(err.stack));
    }
    else {
        return await ctx.reply(text, ...extraReply)
            .then(res => res)
            .catch(err => console.error(err.stack));
    }
};

// Уведомляет пользователя о каком-либо событии, произошедшем без прямого взаимодействия с ботом.

async function notifyUser(userId, message) {
    const availableChats = await dbGet.chatsWithMentions();
    if (availableChats.length != 0) {
        availableChats.forEach(async element => {
            const userData = await map.activeMember(element, userId);
            if (userData[1]) tg
                .sendMessage(element, message, { parse_mode: 'html' })
                .catch(err => console.log(err.stack));
        })
    }
};

function randomIntFromInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
};

function pseudoHonestRandom(array) {
    let s, z, b, t, i, n = () => Math.floor(Math.random() * s.length);
    s = array;
    z = 1000000;
    b = s.map(_ => 0);
    t = Date.now();
    t = t-Math.floor(t / z) * z;
    // console.log(`Take ${t} random numbers`);
    for(i = 0; i < t; i++) b[n()]++;
    // console.log(`Breakdown:`);
    // s.forEach((n, i) => console.log(`${n} ${Math.floor(b[i]/t*10000)/100}%`));
    // console.log(`\nChosen ${s[n()]}`);
    return s[n()];
};

// Создаёт конфиг чата

async function createChatConfig(ctx, chatId) {
    await customReply(ctx, phrases.createChatConfig)
    await dbPost.newChatConfig(chatId);

    const newConfigData = await dbGet.chatConfig(chatId);
    const configReply = await generate.createConfigReply(newConfigData);

    await new Promise(resolve => setTimeout(resolve, 1500));
    await customReply(ctx, 'Успешно создал конфиг:\n\n' + configReply, { parse_mode: 'html' });
};

// Меняет конфиг чата

async function changeChatConfig(chatId, column) {
    await dbPost.configValue(chatId, column);
    const newValue = await dbGet.configValue(chatId, column);
    return newValue ? 'Включено' : 'Отключено';
};

async function updateChatConfigMessageText(ctx, chatId, inlineKeyboard) {
    const configData = await dbGet.chatConfig(chatId);
    const newConfigReply = await generate.createConfigReply(configData);

    await ctx.editMessageText(newConfigReply, { parse_mode: 'html', ...inlineKeyboard});
}

async function handleTtlData(oldTtlData, newTtlData, sendMessageMethod) {
    if (!oldTtlData) {
        const messageData = await sendMessageMethod;
        newTtlData.messageId = messageData.message_id;
        await dbPost.createTtlMsg(newTtlData);
    }
    else {
        if (oldTtlData.is_removed == false) await removeInlineKeyboard(newTtlData.chatId, oldTtlData.message_id, false);
        const messageData = await sendMessageMethod;
        newTtlData.messageId = messageData.message_id;
        await dbPost.updateTtlMsg(newTtlData);
    }
};

async function removeInlineKeyboard(chatId, messageId, isByUser) {
    const editedMessage = await tg.editMessageReplyMarkup(chatId, messageId, Markup.removeKeyboard()).then(res => res)
    await dbPost.ttlKeyboardRemoved(chatId, messageId);

    const deletionReason = isByUser ? phrases.keyboardDelete.byUser : phrases.keyboardDelete.byTtl;
    const informationalSection = `${phrases.keyboardDelete.baseText}${deletionReason}${phrases.keyboardDelete.useAgain}`;
    const newMessageText = editedMessage.text + `\n\n${informationalSection}`;

    const infoTextOffset = newMessageText.indexOf(phrases.keyboardDelete.baseText);
    if (editedMessage.entities !== undefined) {
        editedMessage.entities.push({ offset: infoTextOffset, length: informationalSection.length, type: 'italic' });
    }
    await tg.editMessageText(chatId, messageId, '', newMessageText, { entities: editedMessage.entities });
};

async function sendMessageWithTtl(ctx, command, messageMethod) {
    const newTtlData = map.getDataForNewTtl(ctx, command);
    const oldTtlData = await dbGet.ttlMsgDataByCmd(newTtlData.chatId, command);

    await handleTtlData(oldTtlData, newTtlData, messageMethod);
};

async function sendGroupNotification(notification) {
    const { systemErrorHandler } = require('../../botScript/errors/handler');

    const subs = await dbGet.chatsWithNotify();

    const delay = ms => new Promise(res => setTimeout(res, ms));
    for (i = 0; i < subs.length; i++) {
        if (i != 0) await delay(3100);
        await tg.sendMessage(subs[i], notification.text, { entities: notification.entities })
            .catch(err => systemErrorHandler(err, subs[i]));
    };
};

module.exports = {
    customReply,
    notifyUser,
    pseudoHonestRandom,
    createChatConfig,
    changeChatConfig,
    updateChatConfigMessageText,
    randomIntFromInterval,
    removeInlineKeyboard,
    sendMessageWithTtl,
    sendGroupNotification
}
