const { Markup } = require('telegraf');

const config = Markup.inlineKeyboard([
    [Markup.button.callback('P3 в лидерборде', 'bot_lb'),
    Markup.button.callback('Обновления', 'changelog'),
    Markup.button.callback('Упоминания', 'mentions')],
    [Markup.button.callback('OK', 'done')]
]);

const notificationConfirmation = Markup.inlineKeyboard([
    Markup.button.callback('Подтвердить', 'notifyConfirm'),
    Markup.button.callback('Отменить', 'notifyCancel')
])

module.exports = {
    config,
    notificationConfirmation
}
