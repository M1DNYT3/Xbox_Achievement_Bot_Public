const action = require('../../libs/utils/systemActions');
const check = require('../../libs/utils/systemChecks');
const systemBtn = require('./system');
const text = require('../../textData/keyboardEntries')

async function handler(ctx, button) {
    const chatId = ctx.update.callback_query.message.chat.id;
    const messageId = ctx.update.callback_query.message.message_id;
    const cbAuthorId = ctx.update.callback_query.from.id;
    await check.isCommandAuthor(cbAuthorId, chatId,messageId);

    let newValue;
    switch(button) {
        case 'bot_lb':
            newValue = await action.changeChatConfig(chatId, 'bot_in_leaderboard')
            await ctx.answerCbQuery(`Бот учитывается в таблице лидеров (тег P3) - ${newValue}`, {show_alert: true});
            await action.updateChatConfigMessageText(ctx, chatId, systemBtn.config);
            break;
        case 'mentions':
            newValue = await action.changeChatConfig(chatId, 'mentions')
            await ctx.answerCbQuery(`Сервисные упоминания в чате - ${newValue}`, {show_alert: true});
            await action.updateChatConfigMessageText(ctx, chatId, systemBtn.config);
            break;
        case 'changelog':
            newValue = await action.changeChatConfig(chatId, 'changelog');
            await ctx.answerCbQuery(`Уведомления об обновлении бота - ${newValue}`, {show_alert: true});
            await action.updateChatConfigMessageText(ctx, chatId, systemBtn.config);
            break;
        case 'done':
            await action.removeInlineKeyboard(chatId, messageId, true);
            break;
        case 'notifyConfirm':
            const notificationMessage = ctx.update.callback_query.message;

            await action.sendGroupNotification(notificationMessage);
            await ctx.answerCbQuery('Отправлено', { show_alert: true });
            await action.removeInlineKeyboard(chatId, messageId, true);
            break;
        case 'notifyCancel':
            await ctx.answerCbQuery('Отправка отменена', { show_alert: true })
            await action.removeInlineKeyboard(chatId, messageId, true);
            break;
        default:
            await ctx.answerCbQuery('Не знаю, как ты это сделал, но это действие не поддерживается ботом.', {show_alert: true});
            break;
    };
};

module.exports = {
    handler
}
