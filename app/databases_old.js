'use strict';

class Database_Mongo {
    //const __db_uri = 'mongodb://localhost:27017/cryptocurrency';
    constructor(hostAndPort, database, login, passwd) {
        this.__uri = hostAndPort + '/' + database;
        this.__db = require('monk')(this.__uri);
    }

    async disconnect() {
        this.__db.close(() => {
            console.log('database connection was closed.');
        });
    }

    async create_collection(__collectionName) {
        var __promise = new Promise((resolve, reject) => {
            try {
                let new_collection = this.__db.create(__collectionName);
                resolve(new_collection);
            } catch (err) {
                reject('create_collection(): ' + err);
            }
        });
        return __promise;
    }

    create_db(__dbName) {

    }

    insert_data(__collectionName, __data) {
        let collection = this.__db.get(__collectionName);
        collection.insert(__data);
    }

    remove_data(__collectionName, _id) {
        let collection = this.__db.get(__collectionName);
        collection.remove({ _id: _id });
    }

    drop_collection(__collectionName) {
        let collection = this.__db.get(__collectionName);
        collection.drop();
    }

}

let dbs = new Database_Mongo('localhost:27017', 'cryptocurrency', null, null);
(async() => {
    console.dir(dbs);
    /*let n_collection = await dbs.create_collection('timer').then((result) => {
        console.log(result);
    }).catch((err) => {
        console.log(ee);
    });*/
    dbs.insert_data('timer', { name: 'Amine' });
    let close_conn = await dbs.disconnect();
})();