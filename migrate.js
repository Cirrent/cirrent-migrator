var path = require('path');

require('./').run({
    basedir: __dirname,
    migrationsDir: path.resolve(__dirname, 'migrations'),
    user: 'root',
    host: 'localhost',
    db: 'test'
});
