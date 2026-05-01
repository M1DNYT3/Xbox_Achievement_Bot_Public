const { authenticate } = require('@xboxreplay/xboxlive-auth')
const XboxLiveAPI = require('@xboxreplay/xboxlive-api');

const { xboxLiveCredentials } = require('../../config');

const action = require('../utils/systemActions');
const dbGet = require('../database/get');
const dbPost = require('../database/post');

async function getAuthCredentials() {
    const result = await authenticate(xboxLiveCredentials.email, xboxLiveCredentials.password)
        .then(res => ([res.user_hash, res.xsts_token]))
    return result;
};

async function gamertagNotFound(userId, gamertag) {
    const counter = await dbGet.xblData(userId)
        .then(res => res.not_found_count);
    if (counter < 2) await dbPost.xblNotFoundUpdate(gamertag);
    else {
        const firstName = await dbGet.tgUserData(userId)
            .then(res => res.first_name);
        const message = `<a href="tg://user?id=${userId}">${firstName}</a>, твой геймертег "${gamertag}" был удалён из таблицы Xbox Live.\nЭто случилось потому что Xbox Live по нему 3 раза ничего не нашёл.`
        try {
            dbPost.xblNotFoundReset(gamertag);
            action.notifyUser(userId, message);
        }
        catch (err) {
            console.error(err.stack);
        }
    }
};

async function retrieveGamerscore(gamertag, credentials) {
    const response = await XboxLiveAPI.getPlayerSettings(gamertag, {
        userHash: credentials[0],
        XSTSToken: credentials[1]
    }, ['Gamerscore'])
        .then(res => res)
        .catch(err => { if (err.stack.includes('Not found')) return 'Not found' });
    if (response === 'Not found') return response;
    if (response !== undefined && response !== 'Not found') return response[0].value;
};

module.exports = {
    gamertagNotFound,
    retrieveGamerscore,
    getAuthCredentials
}
