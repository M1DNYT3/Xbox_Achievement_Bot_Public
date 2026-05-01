const _ = require('lodash');

const { botAdminId, botId } = require('../../config');

const errors = require('../../botScript/errors/messages');
const dbGet = require('../database/get')

async function isRegistered(userId, ...aliasCmd) {
    let errMsg = errors.tgNotRegistered;
    if (aliasCmd) errMsg = errors.tgAliasNotRegistered;

    const result = await dbGet.tgUserData(userId);
    if (!result) throw Error(errMsg);
};

async function isReplyToBot(replyAuthor) {
    if (replyAuthor != botId ) throw Error(errors.notBotMessage);
};

async function isDataValid(data, errorMsg) {
    if (data === undefined || data === null) throw Error(errorMsg);
};

function isGamerscoreRetrieved(gamerscore) {
    if (gamerscore === undefined) throw Error(errors.xblCommunicationError);
    if (gamerscore === 'Not found') throw Error(errors.gamertagNotFound);
};

async function gamertagDuplicate(userId, gamertag) {
    const allGamers = await dbGet.xblUsers();
    const lowerCaseGamers = _.forEach(allGamers, function (value) {
        value.gamertag = value.gamertag.toLowerCase()
    });
    const lowerCaseTag = gamertag.toLowerCase();
    const duplicate = await _.find(lowerCaseGamers, { 'gamertag': lowerCaseTag });
    if (duplicate && userId != duplicate.user_id) throw Error(errors.gamertagOccupied);
};

async function commandStringEntered(cmdString, errMsg) {
    if (cmdString == '' || !cmdString) throw Error(errMsg);
};

async function isRegXbotUser(userId, chatId) {
    const result = await dbGet.xbotPlayerData(userId, chatId);
    if (!result) throw Error(errors.xbotNotRegistered);
};

async function isXblScoreUpdatedToday(userId) {
    const xblRawData = await dbGet.xblData(userId);
    const result = xblRawData.manual_update;
    if (result === true && result !== undefined) throw Error(errors.updateLimitExceeded);
    if (result === undefined) throw Error('Unable to fetch user data from the database');
};

async function isBotAdmin(authorId) {
    if (authorId !== botAdminId) throw Error(errors.notBotAdmin);
};

async function isChatConfigExist(config) {
    if (!config) throw Error(errors.noChatConfig);
};

async function isEnoughUsers(array) {
    if (array.length <= 2) throw Error(errors.notEnoughUsers);
};

async function isCommandAuthor(cbAuthorId, chatId, messageId) {
    const result = await dbGet.ttlMsgDataByMsg(chatId, messageId);
    if (result !== undefined && result.author_id != cbAuthorId) throw Error(errors.notKeyboardAuthor);
};

module.exports = {
    isRegistered,
    isChatConfigExist,
    isReplyToBot,
    isDataValid,
    isBotAdmin,
    commandStringEntered,
    isEnoughUsers,
    isRegXbotUser,
    isXblScoreUpdatedToday,
    gamertagDuplicate,
    isGamerscoreRetrieved,
    isCommandAuthor
}
