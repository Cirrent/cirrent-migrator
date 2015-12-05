var mysql = require('mysql'),
    cfg = require('../config.js'),
    utils = require('../utils.js'),
    ENSURE_SQL = 'CREATE TABLE IF NOT EXISTS `__migrations__` (`id` bigint not null, PRIMARY KEY (`id`)) ENGINE=InnoDB DEFAULT CHARSET=utf8;';


module.exports = {
    exec: function(query, values, cb) {
        cb || (cb = values);
        var conn = mysql.createConnection({
          host     : cfg.host,
          user     : cfg.user,
          password : cfg.password,
          database : cfg.db,
          multipleStatements: true
        });
        conn.connect(function(err) {
            err && utils.panic(err);

            conn.beginTransaction(function(err) {
                err && utils.panic(err);

                conn.query(query, values, function(err, result) {
                    if (err) {
                        return conn.rollback(function() {
                            utils.panic(err);
                        });
                    }      

                    conn.commit(function(err) {
                        if (err) {
                          return conn.rollback(function() {
                            utils.panic(err);
                          });
                        }
                        cb(result); 
                    });   
                });   
            });
        });
    },
    appliedMigrations: function(cb) {
        this.ensureMigrationTableExists(function() {
            this.exec('select * from __migrations__', null, function(result) { 
                result = result || [];               
                cb(result.map(function(row) {
                    return parseInt(row.id);
                }));
            });
        }.bind(this));
    },
    applyMigration: function(migration, cb) {
        var sql = utils.getSql(migration);
        this.exec(sql, null, function(result) {
            console.log('Applying ' + migration);
            console.log(result)
            console.log('===============================================');
            var values = [migration.match(/^(\d)+/)[0]];
            this.exec(
                "insert into __migrations__ set id = ?",
                values,
                cb
            );
        }.bind(this));
    },
    rollbackMigration: function(migration, cb) {
        var sql = utils.getSql(migration);
        this.exec(sql, null, function(result) {
            console.log('Reverting ' + migration);
            console.log(result)
            console.log('===============================================');
            var values = [migration.match(/^(\d)+/)[0]];
            this.exec(
                'delete from __migrations__ where id = ?',
                values,
                cb
            );
        }.bind(this));
    },
    ensureMigrationTableExists: function(cb) {
        this.exec(ENSURE_SQL, null, cb)
    }
};
