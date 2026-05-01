const { dbPoolConfig, botId } = require('../../config');

const { Pool } = require('pg');
const db = new Pool(dbPoolConfig);

db.on('error', (err, client) => {
    console.error('Postgress connection error:\n' + err)
});

async function easterEggPlayer() {
    await db
        .query(`INSERT INTO xbox_live (user_id, gamertag) VALUES (${botId}, 'P3');`)
        .then(res => res)
};

async function tgUserData(username, firstName, userId) {
    await db
        .query(`UPDATE telegram_users SET username = '${username}', first_name = '${firstName}' WHERE user_id = ${userId}`)
        .then(res => res)
};

async function xbotUser(userId, chatId) {
    await db
        .query(`INSERT INTO xbot_game (user_id, chat_id) VALUES (${userId}, ${chatId});`)
        .then(res => res)
};

async function xbotWinner(chatId, winnerId) {
    await db
        .query(`UPDATE xbot_game
    SET (won_today, current_year_wins, all_time_wins) = (true, current_year_wins + 1, all_time_wins + 1)
    WHERE chat_id = '${chatId}' AND user_id = '${winnerId}'`)
        .then(res => res)
}

async function gamertag(gamertag, userId) {
    await db
        .query(`UPDATE xbox_live SET gamertag = '${gamertag}' WHERE user_id = ${userId}`)
        .then(res => res)
};

async function monthlyScore(userId, monthValue) {
    await db
        .query(`UPDATE xbox_live SET month_start_score = ${monthValue} where user_id = ${userId}`)
        .then(res => res)
};

async function monthlySnapshot() {
    await db
        .query('UPDATE xbox_live SET month_start_score = gamerscore')
        .then(res => res)
}

async function gamerscore(gamerscore, gamertag, isManual) {
    let manualFlag = 'false';
    if (isManual) manualFlag = 'true';
    await db
        .query(`UPDATE xbox_live SET (gamerscore, not_found_count, manual_update) = (${gamerscore}, 0, ${manualFlag}) WHERE gamertag = '${gamertag}'`)
        .then(res => res)
};

async function xblNotFoundUpdate(gamertag) {
    await db
        .query(`UPDATE xbox_live SET not_found_count = not_found_count + 1 WHERE gamertag = '${gamertag}'`)
        .then(res => res)
};

async function xblNotFoundReset(gamertag) {
    await db
        .query(`UPDATE xbox_live SET not_found_count = 0, gamertag = null WHERE gamertag = '${gamertag}'`)
        .then(res => res)
};

async function newTgUser(userId, username, firstName) {
    await db
        .query(`INSERT INTO telegram_users (user_id, username, first_name) VALUES (${userId}, '${username}', '${firstName}');
        INSERT INTO xbox_live (user_id) VALUES (${userId})`)
        .then(res => res)
};

async function xbotDailyRefresh() {
    await db
        .query('UPDATE xbot_game SET won_today = false')
        .then(res => res)
};

async function xbotYearReset() {
    await db
        .query('UPDATE xbot_game SET current_year_wins = 0')
        .then(res => res)
};

async function xbotPlayerStatus(userId, chatId) {
    await db
        .query(`UPDATE xbot_game SET active = NOT active WHERE chat_id = '${chatId}' AND user_id = '${userId}';`)
        .then(res => res)
};

async function createTtlMsg(newTtlData) {
    const { chatId, command, authorId, messageId, messageDate } = newTtlData;
    await db
        .query(`INSERT INTO keyboard_ttl (chat_id, keyboard_type, author_id, message_id, keyboard_date)
        VALUES (${chatId}, '${command}', ${authorId}, ${messageId}, '${messageDate}');`)
        .then(res => res)
};

async function updateTtlMsg(newTtlData) {
    const { chatId, command, authorId, messageId, messageDate } = newTtlData;
    await db
        .query(`UPDATE keyboard_ttl SET (author_id, message_id, keyboard_date, is_removed) =
        (${authorId}, ${messageId}, '${messageDate}', false)
        WHERE chat_id = ${chatId} and keyboard_type = '${command}';`)
        .then(res => res)
};

async function ttlKeyboardRemoved(chatId, messageId) {
    await db
        .query(`UPDATE keyboard_ttl SET is_removed= true
        WHERE chat_id = ${chatId} and message_id = '${messageId}';`)
        .then(res => res)
};

async function newChatConfig(chatId) {
    await db
        .query(`INSERT INTO chat_configs (chat_id) VALUES (${chatId})`)
        .then(res => res)
};

async function configValue(chatId, column) {
    await db
        .query(`UPDATE chat_configs SET ${column} = NOT ${column} WHERE chat_id = ${chatId}`)
        .then(res => res)
};

module.exports = {
    easterEggPlayer,
    tgUserData,
    newTgUser,

    xbotUser,
    xbotWinner,
    xbotDailyRefresh,
    xbotYearReset,
    xbotPlayerStatus,

    gamertag,
    gamerscore,
    monthlyScore,
    monthlySnapshot,
    xblNotFoundUpdate,
    xblNotFoundReset,

    createTtlMsg,
    updateTtlMsg,
    ttlKeyboardRemoved,
    newChatConfig,
    configValue
}
