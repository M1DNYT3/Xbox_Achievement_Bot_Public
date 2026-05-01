const _ = require("lodash");

const phrases = require('../../textData/phrases');

// Генерирует ответ с информацией о конфигурации чата.

async function createConfigReply(configData) {

    const configValues = [ configData.bot_in_leaderboard, configData.changelog, configData.mentions ];
    let configValuesText = []
    configValues.forEach(element => {
        const textValue = element == true ? '&#9989;' : '&#10060;'
        configValuesText.push(textValue);
    });
    const configNames = [
        'Бот учитывается в таблице лидеров (тег P3)',
        'Уведомления об обновлении бота',
        'Сервисные упоминания в чате'
    ];
    let replyLines = ''
    for(i = 0; i < configValues.length; i++) {
        replyLines = replyLines + `<b>${configNames[i]}</b> - ${configValuesText[i]}\n`
    }
    return replyLines;
};

function lbUserLine(userIndex, userInfo, userData, isFromMessage, gSymbol){
    return isFromMessage
        ? `<b>${(userIndex + 1)}</b>. <b>${userInfo} (Это ты)</b> — ${gSymbol}${userData}\n`
        : `<b>${(userIndex + 1)}</b>. ${userInfo} — ${gSymbol}${userData}\n`;
};

function userInfoBlock(isXbl, isCyclicLb){
    const monthlyData = isCyclicLb ? phrases.monthlyScoreUpdate : phrases.scoreUpdate
    return isXbl ? monthlyData : phrases.emptyScore;
};

function defineUsername(mainUsername, backupUsername){
    return (mainUsername === 'undefined') ? backupUsername : mainUsername;
};

// Генерирует строки указанного лидерборда.
// TODO: перейти на объекты с данными

function createLines(userData, options) {
    let lines = gSymbol = '';
    if (options.isXbl) gSymbol = '&#127318;';

    for(i = 0; i < options.listLimit; i++) {
        if (!options.isXbl) userData.names[i] = defineUsername(userData.names[i], userData.backupNames[i]);

        const isFromMessage = (userData.userIds[i] == options.userFromMessage);
        lines = lines + lbUserLine(i, userData.names[i], userData.scores[i], isFromMessage, gSymbol);
    }

    const currentUserIndex = userData.userIds.indexOf(options.userFromMessage.toString());
    if ((currentUserIndex + 1) > options.listLimit) {
        lines = lines + `\nТвоя позиция:\n<b>${(currentUserIndex + 1)}</b>. ${userData.names[currentUserIndex]} — {gSymbol}${userData.scores[currentUserIndex]}\n`;
    }
    else if (currentUserIndex == -1) {
        lines = lines + userInfoBlock(options.isXbl, options.isCyclicLb);
    }

    lines = lines + `\nВсего игроков в таблице чата: ${userData.userIds.length}.`;

    return lines;
};

// Создаёт полноценный ответ с лидербордом.

function createLbReply(data, userFromMessage, isXbl, isCyclicLb) {
    if (data === undefined) data = [];
    const positions = data.length;
    let listLimit = 10;

    const lbData = isXbl ? phrases.xblLbData : phrases.xbotLbData;
    const lbCycleData = isCyclicLb ? lbData.cycle : lbData.global;

    let mainEntry = lbCycleData.mainEntryTop;

    if (positions > 2 && positions <= 10) {
        mainEntry = lbCycleData.mainEntry
        listLimit = positions;
    }
    else if (positions <= 2) {
        return phrases.notEnoughGamers;
    };

    const userData = {
        scores: _.map(data, lbCycleData.scoreDataColumn),
        userIds: _.map(data, 'user_id')
    };
    if (isXbl) {
        userData.names = _.map(data, 'gamertag');
        userData.backupNames = '';
    }
    else {
        userData.names = _.map(data, 'username');
        userData.backupNames = _.map(data, 'first_name');
    };

    const options = {
        isXbl,
        isCyclicLb,
        userFromMessage,
        listLimit
    };

    const leaderboardData = createLines(userData, options);

    return mainEntry + leaderboardData;
};

module.exports = {
    createLbReply,
    createConfigReply
}
