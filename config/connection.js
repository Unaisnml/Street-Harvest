const mongoClient = require('mongodb').MongoClient
const state = {
    db:null
}


module.exports.connect = function (done) {
    // const url = 'mongodb://localhost:27017'
    // const dbname = 'eComerce'
    const url = 'mongodb+srv://UNAISKSD:Unais%40673@cluster0.zfkt1ce.mongodb.net/streetharvest?retryWrites=true&w=majority'
    const dbname = 'streetharvest'

    mongoClient.connect(url, (err, data) =>{
        if (err) return done(err)
        state.db = data.db(dbname)
        done()
    })
}


module.exports.get = function () {
    return state.db
}