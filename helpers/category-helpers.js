let db = require("../config/connection");
let collection = require("../config/collections");
const { response } = require("../app");
const { upperCase } = require("upper-case");
let objectId = require("mongodb").ObjectId;

module.exports = {

  // addCategory: (catData) => {
  //     return new Promise((resolve,reject) =>{
  //         db.get().collection(collection.CATEGORY_COLLECTION).insertOne(catData).then((data) =>{
  //             resolve(data.insertedId)
  //         })
  //     })
  // },


  // verifyCategory: (catData) => {
  //   console.log(catData);
  //   let response = {};
  //   return new Promise(async (resolve, reject) => {
  //     let verify = await db
  //       .get()
  //       .collection(collection.CATEGORY_COLLECTION)
  //       .findOne({ category: catData.category });
  //       console.log(verify);
  //     if (verify) {
  //       response.status = false;
  //       resolve(response);
  //     } else {
  //       response.status = true;
  //       resolve(response);
  //     }
  //   });
  // },

  addCategory : (catData)=>{
    return new Promise(async(resolve,reject)=>{
        console.log('catData');
        catData.category = catData.category.toUpperCase();

        let categoryExist = await db.get().collection(collection.CATEGORY_COLLECTION)
        .findOne({category:catData.category})

        if (categoryExist){
            resolve({exist:true})
        }else{
            db.get().collection(collection.CATEGORY_COLLECTION).insertOne(catData)
            resolve({exist:false})
        }
       
    })
    
},

  getAllCategory: () => {
    return new Promise(async (resolve, reject) => {
      let catDetails = await db
        .get()
        .collection(collection.CATEGORY_COLLECTION)
        .find()
        .toArray();
      resolve(catDetails);
    });
  },

  showCategory :()=>{
    return new Promise(async(resolve,reject)=>{
        let ShowingCatagory = await db.get().collection(collection.CATEGORY_COLLECTION).find().toArray()
    resolve(ShowingCatagory)
})
},

  deleteCategory: (catId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.CATEGORY_COLLECTION)
        .deleteOne({ _id: objectId(catId) })
        .then((response) => {
          resolve(response);
        });
    });
  },
};
