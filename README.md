# Xbox Live Assistant Telegram Bot

Description

This is a telegram bot aimed to the group chats with communities formed around the Xbox Live Network.

Originally, the bot source code was private and hosted by me exclusively, but I got tired of supporting the bot on my own and decided to share this project with everyone who's willing to use/improve/fork it, or just peek into the code to borrow some functions for their own bots.

To eliminate all potential security risks this repository does not contain a commit history from private repositry.

Setting up the infrastructure

Getting a scraper

This step is necesarry, as this bot is using a third-party Xbox Live API solution that doesn't require users in Telegram to sign in and authorize the application using their own credentials. Instead, this bot is using its own scraper account that'll be gathering the information from the Xbox Live network, and the end-user will only have to specify his gamertag using a bot account.

You can create a brand new Xbox Live account, either by using your own existing email, or creating a new outlook email, provided by Microsoft. Key things to keep in mind:
- 2FA and/or Paswordless login must be disabled (not supported by the library)
- Only use basic email and password for authorization

It's important to know that account's security might be triggered from time to time when you're trying to deploy a bot from an unknown location for the first time, especially if you migrating your server to a different country, or constantly traveling with your machine that you use for development. This will prevent your scraper account from authorizing and you'd have to go log in on the Microsoft website and mark recent login attempt in a new location as your own action. Further login attempts should be successful.

Local instance

There are several ways you can set up your local instance.
You'd need to set up a .env file locally, which is described in a section down below.
Preferrably, you need to use the remote machine for a database all the time, but if you're willing to use a local database for debugging purposes, then you'd have to install and initialize a liquibase script on your local machine to set up the database for it to be ready to work with a bot. You can find all necessarry files in the "./liquibase/" folder, and refer to offical Liquibase documentation to learn how to work with the library, if you're not already familiar with it.

Configuring .env (local development)

Using the .env.sample file as a template, create as much .env configuration files as you need, I was working with three: ".env.feature", ".env.dev", ".env.prod".
These three files are already included in ".gitignore" list, so they won't be pushed to the repository, anything else you will have to include into the ignore list yourself, so please pay attention to that, as security matters.
The sample file has all the necesarry comments.

After the files are set up, to switch between the configurations you'd have to use NODE_ENV variable.
For anyone new to environment variables, entering the following command into the terminal:
`export NODE_ENV=feature`
Will make the bot work with ".env.feature" config file.
For more details, you can refer to the "./config/index.js" file to see how the config initialization works.

Remote instance

This project is designed with remote deployment in mind, everything is being set up automatically with GitHub Actions.
Unlike in local development, you don't need to create .env files to configure the enviroment you work with, instead, you have to provide all the information in repository's secrets, located in repository settings.

Configuring the database

Nothing has to be done, other than setting up a PostgreSQL database and putting the right database configuration and credentials into the .env configuration file (or repository secrets for remote deployment).
The project is using Liquibase library to manage the database, there's an init script in the project that will configure the database and populate it with all the necesarry fields and columns.
Refer to the Liquibase website for documentation on how to work with Liquibase.

GitHub Actions secrets

I had three bots in Telegram, two of them were used for debugging, DEV was always-on remotely hosted instance, FEATURE was an instance that I'd have to host on my local machine, and only the database were hosted on the server. PROD, as the name implies, used for production instance that is the released version for all Telegram users.

Bot configuration:
- `BOT_ADMIN_ID` - telegram user_id of a person who'll be considered an owner of the bot, needed for admin commands.
- `BOT_ID_DEV` - telegram user_id of a bot used for DEV instance.
- `BOT_ID_PROD` - telegram user_id of a bot used for PROD instance.
- `BOT_TOKEN_DEV` - token of a telegram bot used for DEV instance.
- `BOT_TOKEN_PROD` - token of a telegram bot used for PROD instance.

GitHub Configuration:
- `GIT_AUTH_SSH` - git SSH key that is authorized to access the repo. Needed if the repository is private.
- `GIT_REPO` - needed for GitActions to clone the repository for deployment.

SSH tunnel configuration:
- `HOST` - URL/hostname of the remote machine that GitHub Actions will use to connect via SSH.
- `SSHKEY` - remote machine SSH key that is used to connect via SSH.
- `USERNAME` - name of the user on the remote machine that will be logged in via SSH.

Xbox Live scraper account credentials, names are pretty self-explanatory:
- `XBL_USER`
- `XBL_PASSWORD`

GitHub Actions Flow

The YML files are pretty verbal and more experienced users can use them as a reference to understand what each script does and what can trigger it.

The main workflow is the following:
1. Developing the new feature on any branch that has a custom name, other than feature, develop, and main.
2. Pushing the changes to the custom branch, making a PR to merge the code into a feature branch.
3. Feature branch merge will trigger deployment of Liquibase changes, and if Liquibase changes have successfully deployed, or there are no changes, it will trigger bot deployment, if not successful, the deployment will be cancelled.
4. Feature branch is always turning off the feature bot instance after deployment, because it is assumed that feature branch code is used with on a locally hosted bot instance, and it's only needed to update the database on a remote machine.
5. Whenever the feature branch is tested and ready to be merged with develop branch, once again, the PR merge will trigger same chain for deployent - Liquibase script, then bot instance.
6. Develop is the first stage where both the bot and the database are running fully on a remote machine after deployment.
7. For production everything is the same as for develop brain, merge PR from develop to main, and it will trigger deployment.

There's also a GitHub Action to start a container for feature or develop branches outside of deployment procedure.
On a feature branch, it will use the same bot token as it was using on dev, but the code and the database will be, as expected, from feature branch. This allows to access feature branch code while hosting the bot on a remote machine, rather than locally.

Using the bot

Locally, bot can be started by the npm script "xbot", while in the root folder of the repo:
`npm run xbot`
Remotely, bot starts itself once either DEV or PROD environment is deployed, for FEATURE env, again, you'd have to use a local start, or turn on the container with Feature code, using the corresponding action, but that'll use a DEV bot token, keep that in mind.

For the end-user there's a set of help commands available to navigate the bot.
However, below you can find a userflow, to understand the point of this bot.

Userflow:
1. User registers in the bot by using the "/register" command. This fills in telegram user data in the database for future use.
2. User inputs his gamertag into the bot by using the "/gamertag" command. This step isn't checking if username is valid and exists, so it relies on user to fill it in correctly. Bot provides guidance on how to input the gamertag and what to do next.
For our example we will use the gamertag#1564:
`/gamertag gamertag1564`
3. User then have a chance to check if his gamerscore can be obtained, by using the "/live_upd" command. The bot will prompt user if everything was successfull or an error has occured. The command can be used with successfull outcome by each user only once within a day.
4. To check the gamertag and known gamerscore associated with telegram user, user can use the "/live_score" command.

Group chat userflow:
1. Group chat admins can use the "/configure" command to set up additional features for the chat, this allows to toggle notifications from bot developers, XboxP3 (Phil Spencer) in the chat leaderboards, and service notifications for users.
2. All users in the group chat can call the leaderboard of the Group Chat, either all-time, or monthly (commands "/live_lb" and "/monthly_lb" respectively).
3. Users can check if other members of the group chat have the associated gamertag and if it's present, see the gamerscore as well. This can be done by replying to a message of other chat member while using the "/live_score" command.
4. There's an additional pointless mini-game in the bot, "user of the day", all it does is counting. Everyday any user in a group chat can execute this game by using the "/xbot" command.

Some cool quirks and custom-made features in the bot:
- Duplicate-proof, GamerTag123 === gamertag123
- Cyrillic gamertags support, built-in conversion to extremely weird Xbox Live pattern, so user can enter their gamertag as he sees it on modern-era Xbox Live platforms (PC, xCloud, Xbox One and newer generation consoles).
- Custom-made monthly score, third-party API doesn't support the built-in Xbox Live monthly score, so bot keeps track of monthly scores the best way it could. This means the score can be a bit innacurate sometimes, and if user registers their gamertag mid-month, the monthly score will be zero even if it's not zero in the Xbox Live.
- Group chat leaderboards, both all-time and monthly gamerscore leaderboards for the group chat. Took a while to come up with implementation, let alone refactoring it to make it less like spaghetti-code and more like clean and clever solution.
- Composers with replies, ability to separate comands for use in specific types of chats or by a specific type of user. The good thing about my solution is that it gives user a response with clarification why he can't use the command,
- Time-To-Live (ttl) inline keyboards, hopefully a foolproof solution to inline keyboards that otherwise would confuse the hell out of this bot if muptiple users were to use them simultaneously in the same group chat, so I eliminated potential race conditions and allowed users to conveniently control the group chat settings for the bot. In first iterations, the cofiguration process were similar to CLI, where you had to use a command and option to edit the configuration parameter, e.g. "/config bot_lb". Now it's fancy and yes, I'm quite proud of it.
- Unified error handler, convenient, yet painful way to reduce the downtime and server-side errors. As much as I love it, sometimes it's painful to debug, but it meant I had to deal with less complaints that the bot is down, so I'm proud of it.
- The same unified error handler is making it possible to see an unhandled error reports in the DMs of a bot developer whenever such occur, but it requires to start a bot at least once by the developer himself, and don't ever block the bot, obviously. Without such approach, telegram bots (at least based on telegraf library) are dying if they face unhandled exception, while leaving both users and developer without any notification that bot has died, meaning you have to go to the logs of your host machine and see what has caused an issue.
