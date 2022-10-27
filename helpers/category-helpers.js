let db = require("../config/connection");
let collection = require("../config/collections");
const { response } = require("../app");
const { upperCase } = require("upper-case");
let objectId = require("mongodb").ObjectId;

module.exports = {
  addCategory: (catData) => {
    return new Promise(async (resolve, reject) => {
      try {
        console.log("catData");
        catData.category = catData.category.toUpperCase();

        let categoryExist = await db
          .get()
          .collection(collection.CATEGORY_COLLECTION)
          .findOne({ category: catData.category });

        if (categoryExist) {
          resolve({ exist: true });
        } else {
          catData.deleted = false;
          db.get()
            .collection(collection.CATEGORY_COLLECTION)
            .insertOne(catData);
          resolve({ exist: false });
        }
      } catch (error) {
        reject(error);
      }
    });
  },

  getAllCategory: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let catDetails = await db
          .get()
          .collection(collection.CATEGORY_COLLECTION)
          .find({deleted:false})
          .toArray();
        resolve(catDetails);
        console.log("category=",catDetails)
      } catch (error) {
        reject(error);
      }
    });
  },

  showCategory: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let ShowingCatagory = await db
          .get()
          .collection(collection.CATEGORY_COLLECTION)
          .find({deleted:false})
          .toArray();
        resolve(ShowingCatagory);
      } catch (error) {
        reject(error);
      }
    });
  },

  deleteCategory: (catId) => {
    return new Promise((resolve, reject) => {
      try {
        db.get()
          .collection(collection.CATEGORY_COLLECTION)
          .updateOne(
            { _id: objectId(catId) },
            {
              $set: {
                deleted: true,
              },
            }
          )
          .then((response) => {
            resolve(response);
          });
      } catch (error) {
        reject(error);
      }
    });
  },
};
