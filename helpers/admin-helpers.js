let db = require('../config/connection');
let collection = require('../config/collections');
const bcrypt = require('bcrypt');
const { response } = require('../app');
let objectId = require('mongodb').ObjectId


module.exports = {
    
    adminLogin: (adminData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let response = {}
            let admin = await db.get().collection(collection.ADMIN_COLLECTION).findOne({Email:adminData.Email})
            if (admin) {
                bcrypt.compare(adminData.Password, admin.Password).then((status) =>{
                    if (status) {
                        response.admin = admin;
                        response.status = true;
                        resolve(response);
                    } else {
                        resolve({status: false})
                    }
                })
            }else{
                resolve({ status: false})
            }
        })
    },

    getAllUsers: () =>{
        return new Promise(async(resolve,reject) =>{
            let userdetails = await db.get().collection(collection.USER_COLLECTION).find().toArray()
            resolve(userdetails)
        })
     },

    blockUser: (userId, userdetails) =>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(userId)}, {
                $set:{
                    blocked:true
                }
            }).then((response)=>{
                resolve()
            })
        })
    },
    unblockUser: (userId, userDetails) =>{
        return new Promise ((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(userId)}, {
                $set:{
                    blocked:false
                }
            }).then((response)=>{
                resolve()
            })
        })
    },

    addCoupon: (couponDetails) => {
        couponDetails.Value = parseInt(couponDetails.Value)
        return new Promise(async (resolve, reject) => {
            try {
                await db.get().collection(collection.COUPON_COLLECTION).insertOne(couponDetails)
                resolve()
            } catch (error) {
                reject(error)
            }
        })
    },
    getCoupons: () => {
        return new Promise(async (resolve, reject) => {
            try {
                let coupons = await db.get().collection(collection.COUPON_COLLECTION).find().toArray()
                resolve(coupons)
            } catch (error) {
                reject(error)
            }
    
        })
    },

    deleteCoupon:(couponId)=>{
        return new Promise ((resolve,reject)=>{
            db.get().collection(collection.COUPON_COLLECTION)
            .deleteOne({_id:objectId(couponId)}).then((response)=>{
                resolve(response)
            })
        })
    },

    viewCoupon: () => {
        return new Promise(async (resolve, reject) => {
        try {    
                let viewCoupon = await db
                  .get()
                  .collection(collection.COUPON_COLLECTION)
                  .find()
                  .toArray();
                resolve(viewCoupon);
            
        } catch (error) {
            
        }
      })
      },

      adminOrders:()=>{
        return new Promise(async(resolve, reject)=>{
        try {
            
                let adminorderlist=db.get().collection(collection.ORDER_COLLECTION)
                .find().sort({date: -1}).toArray()
                resolve(adminorderlist)
           
        } catch (error) {
            reject(error)
        }
    })
    },

    getOrderProduct:(orderID)=>{
        return new Promise(async(resolve, reject)=>{
        try {
          
           
                let orderItems=await db.get().collection(collection.ORDER_COLLECTION).aggregate(
                    [
                        {
                          '$match': {
                            '_id': new objectid(orderID)
                          }
                        }, {
                          '$unwind': {
                            'path': '$products'
                          }
                        }, {
                          '$lookup': {
                            'from': 'product', 
                            'localField': 'products.item', 
                            'foreignField': '_id', 
                            'as': 'result'
                          }
                        }, {
                          '$unwind': {
                            'path': '$result'
                          }
                        }, {
                          '$project': {
                            'products':1, 
                            'result': 1, 
                            'date': 1, 
                            'total': 1, 
                            'paymentMethod': 1, 
                            'status': 1
                          }
                        }
                      ]
                    
                ).toArray()
               
                resolve(orderItems)
    
          
        } catch (error) {
            reject(error)
        }
    })
    },
   
}