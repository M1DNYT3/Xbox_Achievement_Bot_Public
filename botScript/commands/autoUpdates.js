const { token, botAdminId } = require('../../config');

const dbGet = require('../../libs/database/get');
const dbPost = require('../../libs/database/post');

const map = require('../../libs/utils/mappers');
const check = require('../../libs/utils/systemChecks');
const action = require('../../libs/utils/systemActions');
const xblHelp = require('../../libs/helpers/xbox');
const phrases = require("../../textData/phrases");

const errors = require('../errors/messages');

const { Telegram } = require('telegraf');
const tg = new Telegram(token);

const { forEach } = require('lodash');

module.exports = {

    // Updates Telegram user data for all registered users.

    async updateAllUsersData() {
        const userIds = await dbGet.allTgUsers();
        for (const [key, value] of Object.entries(userIds)) {
            const userInfo = await tg.getChat(value.user_id)
                .catch(err => console.error(err.message));

            // Sanitize before database write
            !userInfo ? userInfo.first_name = userInfo.first_name.replaceAll("'", "") : null

            if (userInfo != undefined) {
                await dbPost.tgUserData(userInfo.username, userInfo.first_name, userInfo.id);
                console.info(`Данные для ID ${userInfo.id} успешно обновлены.`);
            }
        }
    },

    /*
    Gets all the users with a registered gamertag, gets their gamerscores individually.
    For every failed attempt to get a gamerscore for the reason gamertag "Not found" there's a failure counter that goes up by 1.
    If there's more than one failed attempt on a single gamertag the gamertag gets deleted and the failure counter goes back to 0.

    Every successfull update resets the failure counter back to 0.
    */

    async updateAllGamerscores() {
        const users = await dbGet.xblUsers();

        tg.sendMessage(botAdminId, phrases.xblUpdateStartAdmin);

        const credentials = await xblHelp.getAuthCredentials();
        await check.isDataValid(credentials, errors.systemXblNoAuthCredentials);

        let success = 0;
        for (const [key, value] of Object.entries(users)) {

            const queryGamertag = await map.convertIfCyrillic(value.gamertag);
            let gamerscore = await xblHelp.retrieveGamerscore(queryGamertag, credentials);

            let retries = 1
            while (gamerscore === undefined && retries < 5) {
                const t = action.randomIntFromInterval(2000, 10000);
                await new Promise(resolve => setTimeout(resolve, t));

                gamerscore = await xblHelp.retrieveGamerscore(queryGamertag, credentials);

                retries++
            };

            if (gamerscore !== undefined && gamerscore !== 'Not found') {
                ++success;
                await dbPost.gamerscore(gamerscore, value.gamertag, false);
            }
            else if (gamerscore === 'Not found') await xblHelp.gamertagNotFound(value.user_id, value.gamertag);
        }
        tg.sendMessage(botAdminId, `Данные из Xbox Live успешно обновлены.\nУспешно: ${success}\nНе обновилось: ${users.length - success}`)
    },

    // Takes a gamerscore snapshot of every registered user for a beginning of a month. Part of a custom monthly score solution.

    async monthlyScoreSnapshot() {
        try {
            await dbPost.monthlySnapshot();
            await tg.sendMessage(botAdminId, phrases.monthlySnapshotSuccess);
        }
        catch (err) {
            console.error(err.stack);
            await tg.sendMessage(botAdminId, phrases.monthlySnapshotError);
            await tg.sendMessage(botAdminId, err.stack);
        }
    },

    // Resets the xbot mini-game play status for all group chats for the current day.

    async xbotDaily() {
        tg.sendMessage(botAdminId, phrases.xbotDailyCleanStart)
        try {
            await dbPost.xbotDailyRefresh();
            tg.sendMessage(botAdminId, phrases.xbotDailyCleanDone)
        }
        catch (err) {
            console.log(err.stack);
            await tg.sendMessage(botAdminId, phrases.xbotDailyError);
            await tg.sendMessage(botAdminId, err.stack);
        }
    },

    // Yearly xbot stat reset. Ideally only initiated automatically, but can be initiated manually, if needed.

    async yearlyXbotReset() {
        tg.sendMessage(botAdminId, phrases.xbotYearlyCleanStart)
        try {
            await dbPost.xbotYearReset();
            tg.sendMessage(botAdminId, phrases.xbotYearlyCleanDone);
        }
        catch (err) {
            console.log(err.stack);
            await tg.sendMessage(botAdminId, phrases.xbotYearlyCleanError);
            await tg.sendMessage(botAdminId, err.stack);
        }
    },

    async expiredTtlRemoval() {
        const expiredKeyboards = await dbGet.expiredKeyboards();
        if (!expiredKeyboards) forEach(expiredKeyboards, async element => {
            await action.removeInlineKeyboard(element.chat_id, element.message_id, false);
        });
    }

    /*
    Never got implemented.
    Has a dependence on another not implemented feature - record last known user activity.
    This feature supposed to check all registered users for last known activity time,
    and if it was less than 30 days - archive the user in the DB.
    This should've allowed bot to exclude non-active users from any attempt to interact with them, to prevent possible errors.
    */
    // archiveLongInactive() {}
}
