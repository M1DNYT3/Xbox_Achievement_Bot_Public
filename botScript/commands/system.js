const map = require('../../libs/utils/mappers');
const action = require('../../libs/utils/systemActions');
const check = require('../../libs/utils/systemChecks');

const errors = require('../errors/messages');
const phrases = require('../../textData/phrases');
const generate = require('../../libs/helpers/stringCreators');
const systemBtn = require('../inlineKeyboards/system');

const dbPost = require('../../libs/database/post');
const dbGet = require('../../libs/database/get');


module.exports = {
    async easterEggSetup() {
        const P3 = await dbGet.easterEggPlayer();
        console.info('Checking the easter egg state.');
        if (!P3) await dbPost.easterEggPlayer().catch(e => console.error(e.message));
        else console.info('Easter egg is intact, no actions needed.')
    },

    async register(ctx) {
        const extraReply = { reply_to_message_id: ctx.message.message_id };

        const userId = ctx.message.from.id;
        const username = ctx.message.from.username;
        const firstName = ctx.message.from.first_name
        await dbPost.newTgUser(userId, username, firstName);
        await action.customReply(ctx, phrases.userIsRegistered, extraReply);
    },

    // Updates telegram user info, either for a user in a reply (if present), or for a user who initiated a command.

    async update(ctx) {
        const extraReply = { reply_to_message_id: ctx.message.message_id };
        const [userId, username, firstName] = map.getUserByEntity(ctx);
        firstName = firstName.replaceAll("'", "");
        await check.isRegistered(userId, true);
        await dbPost.tgUserData(username, firstName, userId)
        await action.customReply(ctx, phrases.tgUserInfoUpdated, extraReply)
    },

    async deleteMessage(ctx) {
        const message = ctx.message
        const reply = message.reply_to_message;

        await check.isDataValid(reply, errors.noReplyMessage);
        await check.isReplyToBot(reply.from.id);

        await ctx.deleteMessage(reply.message_id);
        await ctx.deleteMessage(message.message_id);
    },

    async notifySubscribers(ctx) {

        const message = ctx.message
        const reply = ctx.message.reply_to_message;

        await check.isDataValid(reply, errors.noReplyMessage);

        await action.customReply(
            ctx,
            phrases.confirmNotification,
            { reply_to_message_id: message.message_id }
        )
        const messageMethod = action.customReply(ctx, reply.text, {
            entities: reply.entities,
            ...systemBtn.notificationConfirmation
        });
        await action.sendMessageWithTtl(ctx, 'notify', messageMethod)
    },

    async configureBot(ctx) {
        const chatId = ctx.message.chat.id;
        const chatConfig = await dbGet.chatConfig(chatId);

        if (!chatConfig) action.createChatConfig(ctx, chatId);
        else {
            const replyData = await generate.createConfigReply(chatConfig);
            const messageMethod = action.customReply(ctx, replyData, {
                parse_mode: 'html',
                ...systemBtn.config,
                reply_to_message_id: ctx.message.message_id
            });

            await action.sendMessageWithTtl(ctx, 'config', messageMethod);
        }
    }
}
