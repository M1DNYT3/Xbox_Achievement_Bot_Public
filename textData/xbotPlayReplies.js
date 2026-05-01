const action = require('../libs/utils/systemActions');

const first = ['Xbox Game Pass just gor a new title!', 'It\'s wheely good fun for the whole family', 'You can invite your family for a wholesome experience today - '];
const second = ['Error. Failed to reach Xbox Cloud Gaming servers.', 'Region unsupported.', 'Connecting to the VPN network.', 'Connection established.', 'Your Xbox Cloud Gaming is ready - '];
const third = ['Searching for the Xbox Game Pass subscribers.', 'Retrieved the list of subscribers.', 'Found the most engaged subscriber!', 'Let us all greet the amazing '];
const fourth = ['Closing another freshly acquired studio.', 'Oh, wait, wrong line.', 'Who even picked those lines?', 'Oh well, let us all just nominate the unfortunate one.', 'Say hello to '];
const fifth = ['Can we stop playing this mini-game for at least one day.', 'Go play Halo or Forza, I dunno...', 'Ugh, alright-alright, roll for luck.', 'And our not so lucky fella today is '];
const sixth = ['Retrieving updated localization update', 'Update downloaded successfully', 'Installing the update', '???????? ????? ??????????? ??????????', '?????????? ???????', '?? ?? ? ??????? - '];
const seventh = ['Check out our new Xbox Game Pass lineup', 'An amazing RPG adventure, a game is a total hole...', '...-in-one for fun seekers!',  'Game On - '];
const eighth = ['Changing the console\'s region', 'Region has been set to US', 'Launching Xbox Cloud Gaming', 'Getting your game ready', 'You are 26th in the queue, estimated waiting time 15 minutes - '];

const repliesArray = [first, second, third, fourth, fifth, sixth, seventh, eighth];

async function xbotReplyChainStart(ctx, username) {
    const randomReplySet = action.pseudoHonestRandom(repliesArray);
    for (i = 0; i < randomReplySet.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        if (i != randomReplySet.length - 1) {
            await action.customReply(ctx, randomReplySet[i]);
        }
        else await action.customReply(ctx, randomReplySet[i] + username, { parse_mode: 'html' });
    }
};

module.exports = {
    xbotReplyChainStart
}
