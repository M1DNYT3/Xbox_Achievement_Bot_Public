const _ = require('lodash');

const { dbPoolConfig, botId } = require('../../config');

const { Pool } = require('pg');
const db = new Pool(dbPoolConfig);

db.on('error', (err, client) => {
    console.error('Postgress connection error:\n' + err)
});


/**
 * Needed to check if there's a P3 gamertag set up for the bot in the table.
 * Used to pre-setup the database to work with an easter egg in a group chat config.
 */

async function easterEggPlayer() {
    return await db
        .query(`SELECT * FROM xbox_live WHERE gamertag = 'P3' and user_id = ${botId}`)
        .then(res => res.rows[0])
        .catch(err => console.error(err.stack))
};

/**
* @returns Object with data from the 'telegram_users' table for selected user_id.
* The keys are "user_id", "username", "first_name".
*/

async function tgUserData(userId) {
    return await db
        .query(`SELECT * FROM telegram_users WHERE user_id = ${userId}`)
        .then(res => res.rows[0])
        .catch(err => console.error(err.stack))
};

/**
* Returns a collection with all userIds from 'telegram_users' table.
*/

async function allTgUsers() {
    return await db
        .query('SELECT user_id FROM telegram_users')
        .then(res => res.rows)
        .catch(err => console.error(err.stack));
};

/**
* Returns a collection with all userIds from 'xbot_game' table for a specified chat.
*/

async function xbotChatPlayers(chatId) {
    return await db
        .query(`SELECT user_id FROM xbot_game WHERE chat_id = '${chatId}' AND active = true`)
        .then(res => res.rows)
        .catch(err => console.error(err.stack))
};

/**
* Gets and filters data to determine if the game was launched today for selected chat.
* If chat has a winner returns [ true, user_id ].
* If chat don't have a winner returns [ false, null ].
*/

async function xbotLaunchInfo(chatId) {
    return await db
        .query(`SELECT won_today, user_id FROM xbot_game WHERE chat_id = '${chatId}' AND won_today = true`)
        .then(res => (res.rows.length != 0 ? [true, res.rows[0].user_id] : [false, null]))
        .catch(err => console.error(err.stack));
};

/**
* Returns object with data from the 'xbot_game' table.
* The service keys are "user_id", "chat_id".
* The game keys are "all_time_wins", "current_year_wins", "active", "current_year_wins", "won_today".
*/

async function xbotPlayerData(userId, chatId) {
    return await db
        .query(`SELECT * FROM xbot_game WHERE user_id = '${userId}' AND chat_id = '${chatId}'`)
        .then(res => res.rows[0])
        .catch(err => console.error(err.stack));
};

/**
* Returns a collection of users who have entered a gamertag.
* Collection keys are "user_id", "gamertag".
*/

async function xblUsers() {
    return await db
        .query('SELECT user_id, gamertag FROM xbox_live WHERE gamertag IS NOT NULL;')
        .then(res => res.rows)
        .catch(err => console.error(err.stack));
};

/**
* Returns object with data from the 'xbox_live' table.
* Service keys "user_id", "manual_update", "not_found_count".
* Xbox Live keys "gamertag", "gamerscore", "month_start_score".
*/

async function xblData(userId) {
    return await db
        .query(`SELECT * FROM xbox_live WHERE user_id = ${userId}`)
        .then(res => res.rows[0])
        .catch(err => console.error(err.stack));
};

/**
* Returns object with data from the 'chat_configs' table.
* The keys are "chat_id", "changelog", "mentions", "bot_in_leaderboard".
*/

async function chatConfig(chatId) {
    return await db
        .query(`SELECT * FROM chat_configs WHERE chat_id = ${chatId}`)
        .then(res => res.rows[0])
        .catch(err => console.error(err.stack));
};

async function configValue(chatId, column) {
    return await db
        .query(`SELECT ${column} FROM chat_configs WHERE chat_id = ${chatId}`)
        .then(res => _.values(res.rows[0])[0])
        .catch(err => console.error(err.stack));
};

async function chatsWithMentions() {
    return await db
        .query('SELECT chat_id FROM chat_configs WHERE mentions = true')
        .then(res => _.map(res.rows, 'chat_id'))
        .catch(err => console.error(err.stack));
};

async function chatsWithNotify() {
    return await db
        .query('SELECT chat_id FROM chat_configs WHERE changelog = true')
        .then(res => _.map(res.rows, 'chat_id'))
        .catch(err => console.error(err.stack));
};

async function customRequest(query) {
    return await db
        .query(query)
        .then(res => res.rows)
        .catch(err => console.error(err.stack));
};

async function ttlMsgDataByCmd(chatId, command) {
    return await db
        .query(`SELECT author_id, message_id, keyboard_date, is_removed FROM keyboard_ttl
        WHERE chat_id = ${chatId} and keyboard_type = '${command}'`)
        .then(res => res.rows[0])
        .catch(err => console.error(err.stack));
};

async function ttlMsgDataByMsg(chatId, messageId) {
    return await db
        .query(`SELECT author_id, keyboard_date, is_removed FROM keyboard_ttl
        WHERE chat_id = ${chatId} and message_id = '${messageId}'`)
        .then(res => res.rows[0])
        .catch(err => console.error(err.stack));
};

async function expiredKeyboards() {
    return await db
        .query(`SELECT message_id, chat_id FROM keyboard_ttl kt
        WHERE keyboard_date < NOW() - interval '5 minutes' and is_removed = false;`)
        .then(res => res.rows)
        .catch(err => console.error(err.stack));
};

module.exports = {
    easterEggPlayer,
    tgUserData,
    allTgUsers,

    xbotLaunchInfo,
    xbotChatPlayers,
    xbotPlayerData,

    xblUsers,
    xblData,

    ttlMsgDataByCmd,
    ttlMsgDataByMsg,
    expiredKeyboards,
    chatConfig,
    configValue,
    chatsWithMentions,
    chatsWithNotify,
    customRequest
}
