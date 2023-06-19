const db = require("../config/connection");
const collection = require("../config/collections");
const { response } = require("../app");
const objectId = require("mongodb").ObjectId;

module.exports = {
  addBanner: (banner, callback) => {
    try {
      db.get()
        .collection("banner")
        .insertOne(banner)
        .then((data) => {
          callback(data.insertedId);
        });
    } catch (error) {
      reject(error);
    }
  },

  getAllBanners: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let banners = await db
          .get()
          .collection(collection.BANNER_COLLECTION)
          .find()
          .toArray();
        resolve(banners);
      } catch (error) {
        reject(error);
      }
    });
  },

  deleteBanner: (banId) => {
    return new Promise((resolve, reject) => {
      try {
        db.get()
          .collection(collection.BANNER_COLLECTION)
          .deleteOne({ _id: objectId(banId) })
          .then((response) => {
            resolve(response);
          });
      } catch (error) {
        reject(error);
      }
    });
  },
};
