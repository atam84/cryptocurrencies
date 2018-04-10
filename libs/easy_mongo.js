'use strict';

module.exports = class easy_mongo {
    constructor(uri, options /*, verbose = false */ ) {
        this.uri = uri;
        this.MongoClient = require('mongodb').MongoClient;
        this.__objectid = require('mongodb').ObjectId;
        this.__connector = null;
        this.__verbose = false;
    }

    set_verbose(verbose) {
        this.__verbose = verbose;
    }

    async drop_collection(__collection) {
        return new Promise((resolve, reject) => {
            this.__connector.collection(__collection).drop().then((result) => {
                if (this.__verbose) {
                    console.log('drop collection ' + __collection + '.');
                }
                resolve(true);
            }).catch((err) => {
                if (this.__verbose) {
                    console.error('*drop collection ' + __collection + ' fail.');
                    console.error(err);
                }
                reject(err);
            });
        });
    }

    async create_collection(__collectionName) {
        return new Promise((resolve, reject) => {
            this.__connector.createCollection(__collectionName).then((result) => {
                if (this.__verbose) {
                    console.log('create collection ' + __collectionName + ' ok.');
                }
                resolve(true);
            }).catch((err) => {
                if (this.__verbose) {
                    console.log('create collection ' + __collectionName + ' fail.');
                }
                reject(err);
            });
        });
    }

    async connect() {
            return new Promise((resolve, reject) => {
                this.MongoClient.connect(this.uri).then((result) => {
                    if (this.__verbose) {
                        console.log('database connection ok.');
                    }
                    this.__connector = result;
                    resolve(true);
                }).catch((err) => {
                    if (this.__verbose) {
                        console.error('database connection fail.');
                        console.error(err);
                    }
                    this.__connector = err;
                    reject(false);
                });
            });
        }
        // mark for review
    async delete_doc(__collection, __doc_selector) {
            if (this.__verbose) {
                console.log('delete document.');
            }
            this.__connector.collection(__collection).deleteOne(__doc_selector, {}, (err, result) => {
                if (err) {
                    console.error('Mongodb Driver insertOne() - error from : easy_mongo class method delete_doc()');
                    console.error(err);
                }
            });
        }
        // mark for review
    async insert_doc(__collection, __doc) {
            if (this.__verbose) {
                console.log('insert document.');
            }
            var doc = __doc;
            var doc_id = new this.__objectid();
            if (!doc._id) {
                doc._id = doc_id.toHexString();
            }
            this.__connector.collection(__collection).insertOne(doc, {
                forceServerObjectId: false,
                bypassDocumentValidation: true
            }, (err, result) => {
                if (err) {
                    console.error('Mongodb Driver insertOne() - error from : easy_mongo class method insert_doc()');
                    console.error(err);
                }
            });
        }
        // mark for review
    async insert_manydocs(__collection, __docs_array) {
        if (this.__verbose) {
            console.log('insert many documents.');
        }
        var docs = [];
        var doc = undefined;
        var counter = __docs_array.length;
        for (var i = 0; i < counter; i++) {
            doc = __docs_array[i];
            if (!doc._id) {
                doc._id = this.__objectid().toHexString();
            }
            docs.push(__docs_array[i]);
        }
        try {
            this.__connector.collection(__collection).insertMany(docs);
        } catch (err) {
            console.error(err);
        }
    }

    async updateOne(__collection, __filter, __update) {
            return new Promise((resolve, reject) => {
                this.__connector.collection(__collection).updateOne(__filter, { $set: __update }, { upsert: true, bypassDocumentValidation: true }).then((result) => {
                    if (this.__verbose) {
                        console.log('update/insert document ok ' + result);
                    }
                    resolve(result);
                }).catch((err) => {
                    console.error('! Err: update/insert document fail.');
                    console.error(err);
                    reject(err);
                });
            });
        }
        // mark for review

    async findOne(__collection, __filter, __projection = {}) {
        return new Promise((resolve, reject) => {
            this.__connector.collection(__collection).findOne(__filter, __projection).then((result) => {
                if (this.__verbose) {
                    console.log('find document ok ' + result);
                }
                resolve(result);
            }).catch((err) => {
                console.error('! Err: find document fail.');
                console.error(err);
                reject(err);
            });

        });
    }
    async disconnect() {
        this.__connector.close(false, function(err, result) {
            if (true) {
                console.log('closing database.');
                console.log('err : ' + err);
                console.log('result : ' + result);
            }
        });
    }
}


/* Quik example

(async() => {
    const e_mongo = new easy_mongo('mongodb://localhost:27017/cryptocurrency');
    let connecting = await e_mongo.connect().then((result) => {
        console.log(' YAHHH Connected.');
    }).catch((err) => {
        console.log('ERROR');
    });
    for (let i = 0; i < 10; i++) {
        e_mongo.insert_doc('timer', { name: 'ATam84+' + i });
    }
    //e_mongo.insert_doc('timer', { _id: 200, name: 'ATam84+' });
    //e_mongo.insert_manydocs('timer', [{ _id: 201, name: 'ATam84+' }, { _id: 202, name: 'ATam84+' }, { name: 'ATam84+' }]);
    //await e_mongo.drop_collection('timer');   ok
    //await e_mongo.delete_doc('timer', { _id: 200 });  ok
    await e_mongo.create_collection('totox');
    e_mongo.disconnect();
})();

*/