const { Composer } = require('telegraf');
const adminComposer = new Composer;

const system = require('../commands/system');

async function isChatAdmin(ctx) {
    const message = ctx.message !== undefined ? ctx.message : ctx.update.edited_message
    const userData = await ctx.getChatMember(message.from.id);
    const adminStatuses = ['administrator', 'creator'];
    return adminStatuses.includes(userData.status) ? true : false;
};

adminComposer.command('config', ctx => system.configureBot(ctx));
/*
Further commands aren't implemented.
They were supposed to had options to administer the xbot mini-game.
The xbot_admin was meant to allow group chat admins to show the list of currently registered users within a group chat,
remove them from the game, or pause/unpause their participation.
The xbot_reset command was meant to wipe all the records and registered group chat members for a current group chat.
*/
// bot.command('xbot_admin', Telegraf.admin(ctx => ))
// bot.command('xbot_reset', Telegraf.admin(ctx => ))

/*
 A necessary whitelist solution to make negative user scenario work.
 Without it, user cannot be notified that the command cannot be used in current conditions.
 In this case, listed commands can only be initiated by a group chat member with an administrator privileges.

 NOTE: In the current state this only checks for the admin role, not for the actual permissions,
 This means that even a vanity admin (fancy signature alongside the name), without actual admin permissions can use this command.
*/
const adminCommands = ['config'];

module.exports = {
    adminComposer,
    isChatAdmin,
    adminCommands
}
