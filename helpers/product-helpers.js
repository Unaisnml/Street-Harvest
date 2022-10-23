let db = require("../config/connection");
let collection = require("../config/collections");
var objectId = require("mongodb").ObjectId;
const { response } = require("../app");

module.exports = {
  addProduct: (product, callback) => {
    product.deleted = false;
    console.log(product);
    db.get()
      .collection("product")
      .insertOne(product)
      .then((data) => {
        callback(data.insertedId);
      });
  },

  getAllProducts: () => {
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find({deleted:false})
        .toArray();
      resolve(products);
    });
  },

  getProductDetails: (prodId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .findOne({ _id: objectId(prodId) })
        .then((products) => {
          resolve(products);
        });
    });
  },

  updateProduct: (prodId, prodetails) => {
    return new Promise((resolve, reject) => {
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
    });
  },

  deleteProduct: (prodId) => {
    return new Promise((resolve, reject) => {
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
    });
  },

  categoryProducts: (data) => {
    console.log(data, "ddddd");
    return new Promise(async (resolve, reject) => {
      let products = await db
        .get()
        .collection(collection.PRODUCT_COLLECTION)
        .find({ Category: data })
        .toArray();
      console.log(products, "dd");
      resolve(products);
    });
  },
};
