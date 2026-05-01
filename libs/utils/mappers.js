const _ = require('lodash');
const { token } = require('../../config');

const { Telegram } = require('telegraf');
const tg = new Telegram(token);

/* Функция конвертирует киррилический текст в латиницу по алгоритму Xbox Live.
Необходимо для запросов в бэкенд Xbox Live, так как киррилицу он не распознаёт. */

function convertIfCyrillic(gamertag) {
    if (/^[а-яёА-ЯЁ]+\s?/.test(gamertag)) {
        const cyrillic = 'абвгдеёжзийклмнопрстуфхцшщъыьюяАБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦШЩЬЫЪЭЮЯ';
        const latin = 'a6BrAeex3NNKAMHonpcTyoxuwwbbboRAbBrAEEX3NNKAMHOnPCTyoXUWWbbb3OR';

        for (let i = 0; i < cyrillic.length; i++) {
            const cyrLetter = cyrillic[i];
            const latLetter = latin[i];

            gamertag = gamertag.replaceAll(cyrLetter, latLetter)
        }
        return gamertag
    }
    else {
        return gamertag
    }
};

function definePingType(rawUserData, userId) {
    if (rawUserData.username === 'undefined') {
        return `<a href="tg://user?id=${userId}">${rawUserData.first_name}</a>`
    }
    else return `@${rawUserData.username}`
}

// Добавить описание

function parseUserIds(obj) {
    const parsedObj = obj.map(function (item) {
        const newObj = {
            id: item.user_id
        }
        return Object.values(newObj)
    })
    return _.flatten(parsedObj);
};

/**
 * Returns array [userId, username, firstName, alias]
 */

function getUserByEntity(ctx) {
    const messageData = ctx.message;
    if (!messageData.reply_to_message) {
        return [messageData.from.id,
            messageData.from.username,
            messageData.from.first_name,
            'message'
        ]
    }
    else {
        return [messageData.reply_to_message.from.id,
            messageData.reply_to_message.from.username,
            messageData.reply_to_message.from.first_name,
            'reply'
        ];
    }
};

/**
 * Checks if user have ever entered the specified chat. If not, returns [null, false].
 * If user has ever entered the chat, checks if his status belongs to active group, then returns
 * [userId, statusCheck: boolean].
 * @param {string} chatId
 * @param {string} userId
 * @returns [userId OR null, isActive: boolean]
 */

async function activeMember(chatId, userId) {
    const statuses = ['member', 'administrator', 'creator', 'restricted'];
    let userData = await tg.getChatMember(chatId, userId)
        .catch(_err => null);
    if (userData === null) {
        return [null, false]
    }
    else return [userId, userData !== undefined && statuses.includes(userData.status)]
};

// Создаёт массив с юзерами чата и фильтрует массив на основе указанных статусов

async function getActiveChatUsers(chatId, array) {
    const mapToArr = await Promise.all(array.map(async element => await activeMember(chatId, element)));
    const mapToFilteredArr = mapToArr
        .filter(([, bool]) => bool)
        .map(([value]) => value)
    return mapToFilteredArr;
};

function getDataForNewTtl(ctx, command) {
    const chatId = ctx.message.chat.id;
    const authorId = ctx.message.from.id;
    const messageDate = new Date(ctx.message.date * 1000).toISOString();
    return {
        chatId,
        authorId,
        messageDate,
        command
    };
}

module.exports = {
    convertIfCyrillic,
    parseUserIds,
    getUserByEntity,
    getActiveChatUsers,
    definePingType,
    activeMember,
    getDataForNewTtl
}
