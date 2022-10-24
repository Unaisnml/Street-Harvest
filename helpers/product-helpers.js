let db = require("../config/connection");
let collection = require("../config/collections");
var objectId = require("mongodb").ObjectId;
const { response } = require("../app");

module.exports = {
  addProduct: (product, callback) => {

try{

    product.deleted = false;
    console.log(product);
    db.get()
      .collection("product")
      .insertOne(product)
      .then((data) => {
        callback(data.insertedId);
      });

    } catch (error) {
      reject(error)
    }

  },

  getAllProducts: () => {
    return new Promise(async (resolve, reject) => {
try{

      let products = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find({deleted:false})
        .toArray();
      resolve(products);

    } catch (error) {
      reject(error)
    }

    });
  },

  getProductDetails: (prodId) => {
    return new Promise((resolve, reject) => {

try{

      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .findOne({ _id: objectId(prodId) })
        .then((products) => {
          resolve(products);
        });

      } catch (error) {
        reject(error)
      }

    });
  },

  updateProduct: (prodId, prodetails) => {
    return new Promise((resolve, reject) => {

try{

      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .updateOne(
          { _id: objectId(prodId) },
          {
            $set: {
              Name: prodetails.Name,
              Description: prodetails.Description,
              Price: prodetails.Price,
              Category: prodetails.Category,
            },
          }
        )
        .then((response) => {
          resolve();
        });

      } catch (error) {
        reject(error)
      }

    });
  },

  deleteProduct: (prodId) => {
    return new Promise((resolve, reject) => {

try{

      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .updateOne(
          { _id: objectId(prodId) },
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
        reject(error)
      }

    });
  },

  categoryProducts: (data) => {
    return new Promise(async (resolve, reject) => {

      try{

      let products = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find({ Category: data, deleted:false })
        .toArray();
      console.log(products, "dd");
      resolve(products);

    } catch (error) {
      reject(error)
    }

    });
  },
};
