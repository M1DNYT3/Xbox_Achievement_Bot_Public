require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` })

module.exports = {
    token: process.env.BOT_TOKEN,
    dbPoolConfig: {
        host: process.env.PGHOST,
        database: process.env.PGDATABASE,
        user: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        port: process.env.PGPORT,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
        ssl: false
    },
    botAdminId: process.env.BOT_ADMIN_ID,
    botId: process.env.BOT_ID,
    xboxLiveCredentials: {
        email: process.env.XBL_USER,
        password: process.env.XBL_PASSWORD
    }
}
