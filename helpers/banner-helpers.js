const db = require("../config/connection");
const collection = require("../config/collections");
const { response } = require("../app");
const objectId = require("mongodb").ObjectId;



module.exports = {

    addBanner: (banner, callback) =>{
        console.log(banner);
        db.get().collection('banner').insertOne(banner).then((data) =>{
            callback(data.insertedId)
        })
    },

    getAllBanners:()=>{
        return new Promise(async(resolve,reject)=>{
            let banners= await db.get().collection(collection.BANNER_COLLECTION).find().toArray()
            resolve(banners)
        })
    },

    deleteBanner: (banId)=>{
return new Promise ((resolve,reject)=>{
    db.get().collection(collection.BANNER_COLLECTION).deleteOne({_id:objectId(banId)}).then((response)=>{
        resolve(response)
    })
})
    }

}