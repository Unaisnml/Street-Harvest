const db = require("../config/connection");
const collection = require("../config/collections");
const bcrypt = require("bcrypt");
const { response } = require("express");
const objectId = require("mongodb").ObjectId;
const Razorpay = require("razorpay");
const { resolve } = require("path");
var instance = new Razorpay({
  key_id: process.env.KEY_ID,
  key_secret: process.env.KEY_SECRET
});

module.exports = {
  doSignup: (userData) => {
    return new Promise(async (resolve, reject) => {
      try {
        userData.Password = await bcrypt.hash(userData.Password, 10);
        db.get()
          .collection(collection.USER_COLLECTION)
          .insertOne(userData)
          .then((data) => {
            resolve(data.insertedId);
          });
      } catch (error) {
        reject(error);
      }
    });
  },

  verifyUser: (userData) => {
    let response = {};
    return new Promise(async (resolve, reject) => {
      try {
        let verify = await db
          .get()
          .collection(collection.USER_COLLECTION)
          .findOne({ Email: userData.Email });
        if (verify) {
          response.status = false;
          resolve(response);
        } else {
          response.status = true;
          resolve(response);
        }
      } catch (error) {
        reject(error);
      }
    });
  },

  doLogin: (userData) => {
    return new Promise(async (resolve, reject) => {
      try {
        let loginStatus = false;
        let response = {};
        let user = await db
          .get()
          .collection(collection.USER_COLLECTION)
          .findOne({ Email: userData.Email, blocked: false });
        if (user) {
          bcrypt.compare(userData.Password, user.Password).then((status) => {
            if (status) {
              response.user = user;
              response.status = true;
              resolve(response);
            } else {
              resolve({ status: false });
            }
          });
        } else {
          resolve({ status: false });
        }
      } catch (error) {
        reject(error);
      }
    });
  },

  getAllUsers: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let userdetails = await db
          .get()
          .collection(collection.USER_COLLECTION)
          .find()
          .toArray();
        resolve(userdetails);
      } catch (error) {
        reject(error);
      }
    });
  },

  getProductDetails: async (prodId) => {
    return new Promise(async (resolve, reject) => {
      try {
        db.get()
          .collection(collection.PRODUCT_COLLECTION)
          .findOne({ _id: objectId(prodId) })
          .then((response) => {
            resolve(response);
          });
      } catch (error) {
        reject(error);
      }
    });
  },

  addtoWishList: (proId, userId) => {
    let prodObj = {
      item: objectId(proId),
      quantity: 1,
    };
    return new Promise(async (resolve, reject) => {
      try {
        let userWish = await db
          .get()
          .collection(collection.WISHLIST_COLLECTION)
          .findOne({ user: objectId(userId) });
        if (userWish) {
          let proExist = userWish.products.findIndex(
            (products) => products.item == proId
          );

          if (proExist != -1) {
            db.get()
              .collection(collection.WISHLIST_COLLECTION)
              .updateOne(
                {
                  user: objectId(userId),
                  "products.item": objectId(proId),
                },
                {
                  $inc: { "products.$.quantity": 1 },
                }
              );
          } else {
            db.get()
              .collection(collection.WISHLIST_COLLECTION)
              .updateOne(
                { user: objectId(userId) },
                {
                  $push: { products: prodObj },
                }
              )
              .then((response) => {
                resolve(response);
              });
          }
        } else {
          let wishObj = {
            user: objectId(userId),
            products: [prodObj],
          };
          await db
            .get()
            .collection(collection.WISHLIST_COLLECTION)
            .insertOne(wishObj)
            .then((response) => {
              resolve(response);
            });
        }
      } catch (error) {
        reject(error);
      }
    });
  },

  getWishListProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let wishListItems = await db
          .get()
          .collection(collection.WISHLIST_COLLECTION)
          .aggregate([
            {
              $match: { user: objectId(userId) },
            },
            {
              $unwind: "$products",
            },
            {
              $project: {
                item: "$products.item",
                quantity: "$products.quantity",
              },
            },
            {
              $lookup: {
                from: collection.PRODUCT_COLLECTION,
                localField: "item",
                foreignField: "_id",
                as: "products",
              },
            },
            {
              $project: {
                item: 1,
                quantity: 1,
                products: { $arrayElemAt: ["$products", 0] },
              },
            },
          ])
          .toArray();
        resolve(wishListItems);
      } catch (error) {
        reject(error);
      }
    });
  },

  getWishListCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let count = 0;
        let wishList = await db
          .get()
          .collection(collection.WISHLIST_COLLECTION)
          .findOne({ user: objectId(userId) });
        if (wishList) {
          count = wishList.products.length;
        }
        resolve(count);
      } catch (error) {
        reject(error);
      }
    });
  },

  deleteWishItem: (wishId, prodId) => {
    return new Promise((resolve, reject) => {
      try {
        db.get()
          .collection(collection.WISHLIST_COLLECTION)
          .updateOne(
            { _id: objectId(wishId) },
            {
              $pull: { products: { item: objectId(prodId) } },
            }
          )
          .then((response) => {
            resolve({ removeProduct: true });
          });
      } catch (error) {
        reject(error);
      }
    });
  },

  addToCart: (prodId, userId) => {
    let proObj = {
      item: objectId(prodId),
      quantity: 1,
    };
    return new Promise(async (resolve, reject) => {
      try {
        let userCart = await db
          .get()
          .collection(collection.CART_COLLECTION)
          .findOne({ user: objectId(userId) });
        if (userCart) {
          let proExist = userCart.products.findIndex(
            (product) => product.item == prodId
          );
          if (proExist != -1) {
            db.get()
              .collection(collection.CART_COLLECTION)
              .updateOne(
                { user: objectId(userId), "products.item": objectId(prodId) },
                {
                  $inc: { "products.$.quantity": 1 },
                }
              )
              .then(() => {
                resolve();
              });
          } else {
            db.get()
              .collection(collection.CART_COLLECTION)
              .updateOne(
                { user: objectId(userId) },
                {
                  $push: { products: proObj },
                }
              )
              .then((response) => {
                resolve();
              });
          }
        } else {
          let cartObj = {
            user: objectId(userId),
            products: [proObj],
          };
          db.get()
            .collection(collection.CART_COLLECTION)
            .insertOne(cartObj)
            .then((response) => {
              resolve();
            });
        }
      } catch (error) {
        reject(error);
      }
    });
  },

  getCartProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let cartItems = await db
          .get()
          .collection(collection.CART_COLLECTION)
          .aggregate([
            {
              $match: { user: objectId(userId) },
            },
            {
              $unwind: "$products",
            },
            {
              $project: {
                item: "$products.item",
                quantity: "$products.quantity",
              },
            },
            {
              $lookup: {
                from: collection.PRODUCT_COLLECTION,
                localField: "item",
                foreignField: "_id",
                as: "product",
              },
            },
            {
              $project: {
                item: 1,
                quantity: 1,
                product: { $arrayElemAt: ["$product", 0] },
              },
            },
          ])
          .toArray();
        resolve(cartItems);
      } catch (error) {
        reject(error);
      }
    });
  },

  getCartCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let count = 0;
        let cart = await db
          .get()
          .collection(collection.CART_COLLECTION)
          .findOne({ user: objectId(userId) });
        if (cart) {
          count = cart.products.length;
        }
        resolve(count);
      } catch (error) {
        reject(error);
      }
    });
  },

  changeProductQuantity: (details) => {
    details.count = parseInt(details.count);
    details.quantity = parseInt(details.quantity);
    return new Promise((resolve, reject) => {
      try {
        if (details.count == -1 && details.quantity == 1) {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { _id: objectId(details.cart) },
              {
                $pull: { products: { item: objectId(details.product) } },
              }
            )
            .then((response) => {
              resolve({ removeProduct: true });
            });
        } else {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              {
                _id: objectId(details.cart),
                "products.item": objectId(details.product),
              },
              {
                $inc: { "products.$.quantity": details.count },
              }
            )
            .then((response) => {
              resolve({ status: true });
            });
        }
      } catch (error) {
        reject(error);
      }
    });
  },

  deleteCartItem: (cartId, prodId) => {
    return new Promise((resolve, reject) => {
      try {
        db.get()
          .collection(collection.CART_COLLECTION)
          .updateOne(
            { _id: objectId(cartId) },
            {
              $pull: { products: { item: objectId(prodId) } },
            }
          )
          .then((response) => {
            resolve({ removeCartProduct: true });
          });
      } catch (error) {
        reject(error);
      }
    });
  },

  getTotalAmount: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let total = await db
          .get()
          .collection(collection.CART_COLLECTION)
          .aggregate([
            {
              $match: { user: objectId(userId) },
            },
            {
              $unwind: "$products",
            },
            {
              $project: {
                item: "$products.item",
                quantity: "$products.quantity",
              },
            },
            {
              $lookup: {
                from: collection.PRODUCT_COLLECTION,
                localField: "item",
                foreignField: "_id",
                as: "product",
              },
            },
            {
              $project: {
                item: 1,
                quantity: 1,
                product: { $arrayElemAt: ["$product", 0] },
              },
            },
            {
              $group: {
                _id: null,
                total: {
                  $sum: {
                    $multiply: ["$quantity", { $toInt: "$product.Price" }],
                  },
                },
              },
            },
          ])
          .toArray();
        if (total.length == 0) {
          resolve(total);
        } else {
          resolve(total[0].total);
        }
      } catch (error) {
        reject(error);
      }
    });
  },

  checkOut: (order, products, total) => {
    return new Promise((resolve, reject) => {
      try {
        let status = order["payement-method"] == "COD" ? "placed" : "pending";
        let orderObj = {
          deliveryDetails: {
            mobile: order.mobile,
            address: order.address,
            pincode: order.pincode,
          },
          userId: objectId(order.userId),
          payementMethod: order["payement-method"],
          products: products,
          totalAmount: total,
          status: status,
          date: new Date(),
        };

        db.get()
          .collection(collection.ORDER_COLLECTION)
          .insertOne(orderObj)
          .then((response) => {
            db.get()
              .collection(collection.CART_COLLECTION)
              .deleteOne({ user: objectId(order.userId) });
            resolve(response.insertedId);
          });
      } catch (error) {
        reject(error);
      }
    });
  },

  getCartProductList: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let cart = await db
          .get()
          .collection(collection.CART_COLLECTION)
          .findOne({ user: objectId(userId) });
        resolve(cart.products);
      } catch (error) {
        reject(error);
      }
    });
  },

  getUserOrders: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let orders = await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .find({ userId: objectId(userId) })
          .sort({ date: -1 })
          .toArray();
        resolve(orders);
      } catch (error) {
        reject(error);
      }
    });
  },

  getOrderProduct: (orderId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let orderItems = await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .aggregate([
            {
              $match: {
                _id: new objectId(orderId),
              },
            },
            {
              $unwind: {
                path: "$products",
              },
            },
            {
              $lookup: {
                from: "product",
                localField: "products.item",
                foreignField: "_id",
                as: "result",
              },
            },
            {
              $unwind: {
                path: "$result",
              },
            },
            {
              $project: {
                products: 1,
                result: 1,
                date: 1,
                totalAmount: 1,
                payementMethod: 1,
                status: 1,
              },
            },
          ])
          .toArray();

        resolve(orderItems);
      } catch (error) {
        reject(error);
      }
    });
  },

  changeStatus: (orderId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let changeOrderStatus = await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .updateOne(
            { _id: objectId(orderId) },
            {
              $set: {
                status: "packed",
                value: false,
                shipped: true,
                delivered: false,
              },
            }
          );
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  },

  changeStatusShipped: (orderId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let changeOrderStatus = await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .updateOne(
            { _id: objectId(orderId) },
            {
              $set: {
                status: "Shipped",
                value: false,
                shipped: false,
                delivered: true,
              },
            }
          );
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  },

  changeStatusDelivered: (orderId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let changeOrderStatus = await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .updateOne(
            { _id: objectId(orderId) },
            {
              $set: {
                status: "Delivered",
                value: true,
                shipped: false,
                delivered: true,
              },
            }
          );
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  },

  changeStatusCancelled: (orderId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let changeOrderStatus = await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .updateOne(
            { _id: objectId(orderId) },
            { $set: { status: "Cancelled", Cancelled: true } }
          );
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  },

  buttonChange: (orderId) => {
    let response = {};
    return new Promise(async (resolve, reject) => {
      try {
        let order = await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .findOne({ _id: objectId(orderId) });
        if (order) {
          if (order.shipped) {
            response.id = orderId;
            response.status = true;
            response.pack = false;
            resolve(response);
          } else if (order.delivered) {
            response.id = orderId;
            response.status = false;
            resolve(response);
          } else {
            response.pack = true;
            response.status = false;
            response.id = orderId;
            resolve(response);
          }
        }
      } catch (error) {
        reject(error);
      }
    });
  },

  changeStatusDelivered: (orderId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let changeOrderStatus = await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .updateOne(
            { _id: objectId(orderId) },
            {
              $set: {
                status: "Delivered",
                value: true,
                shipped: false,
                delivered: true,
              },
            }
          );
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  },

  generateRazorpay: (orderId, total) => {
    return new Promise((resolve, reject) => {
      try {
        var options = {
          amount: total * 100, // amount in the smallest currency unit
          currency: "INR",
          receipt: "" + orderId,
        };
        instance.orders.create(options, function (err, order) {
          if (err) {
            console.log(err);
          } else {
            resolve(order);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  },

  verifyPayment: (details) => {
    return new Promise((resolve, reject) => {
      try {
        const crypto = require("crypto");
        let hmac = crypto.createHmac("sha256", "n3cB52QmfcVasQQssvsTWPBb");
        hmac.update(
          details["payement[razorpay_order_id]"] +
            "|" +
            details["payement[razorpay_payment_id]"]
        );
        hmac = hmac.digest("hex");
        if (hmac == details["payement[razorpay_signature]"]) {
          resolve();
        } else {
          reject();
        }
      } catch (error) {
        reject(error);
      }
    });
  },

  changePaymentStatus: (orderId) => {
    return new Promise((resolve, reject) => {
      try {
        db.get()
          .collection(collection.ORDER_COLLECTION)
          .updateOne(
            { _id: objectId(orderId) },
            {
              $set: {
                status: "placed",
              },
            }
          )
          .then(() => {
            resolve();
          });
      } catch (error) {
        reject(error);
      }
    });
  },

  applyCoupon: (couponName, userId) => {
    let userrId = objectId(userId);
    return new Promise(async (resolve, reject) => {
      try {
        try {
          let result = await db
            .get()
            .collection(collection.COUPON_COLLECTION)
            .findOne({ CouponName: couponName });
          if (result) {
            var d = new Date();
            let str = d.toJSON().slice(0, 10);
            if (str >= result.Expiry_Date) {
              resolve({ expired: true });
            } else {
              let user = await db
                .get()
                .collection(collection.COUPON_COLLECTION)
                .findOne({
                  CouponName: couponName,
                  users: { $in: [objectId(userId)] },
                });
              if (user) {
                resolve({ used: true });
              } else {
                resolve(result);
              }
            }
          } else {
            resolve({ notAvailable: true });
          }
        } catch (error) {
          reject(error);
        }
      } catch (error) {
        reject(error);
      }
    });
  },
  getPersonalDetails: (userId) => {
    return new Promise((resolve, reject) => {
      try {
        userSignupDetails = db
          .get()
          .collection(collection.USER_COLLECTION)
          .findOne({ _id: objectId(userId) });
        resolve(userSignupDetails);
      } catch (error) {
        reject(error);
      }
    });
  },

  userAddress: (userId) => {
    return new Promise((resolve, reject) => {
      try {
        let address = db
          .get()
          .collection(collection.USER_COLLECTION)
          .aggregate([
            {
              $match: { _id: objectId(userId) },
            },
            {
              $unwind: "$Addresses",
            },
            {
              $project: {
                id: "$Addresses._addId",
                name: "$Addresses.name",
                email: "$Addresses.email",
                mobile: "$Addresses.mobile",
                address: "$Addresses.address",
                town: "$Addresses.town",
                pincode: "$Addresses.pincode",
                district: "$Addresses.district",
                state: "$Addresses.state",
              },
            },
          ])
          .toArray();
        resolve(address);
      } catch (error) {
        reject(error);
      }
    });
  },

  profileDetails: (addressData, userId) => {
    create_random_id(15);
    function create_random_id(string_Length) {
      var randomString = "";
      var numbers = "1234567890";
      for (var i = 0; i < string_Length; i++) {
        randomString += numbers.charAt(
          Math.floor(Math.random() * numbers.length)
        );
      }
      addressData._addId = "ADD" + randomString;
    }
    let subAddress = {
      _addId: addressData._addId,
      name: addressData.name,
      email: addressData.email,
      mobile: addressData.mobile,
      address: addressData.address,

      town: addressData.town,
      district: addressData.district,
      pincode: addressData.pincode,

      state: addressData.state,
    };
    return new Promise(async (resolve, reject) => {
      try {
        let user = await db
          .get()
          .collection(collection.USER_COLLECTION)
          .findOne({ _id: objectId(userId) });

        if (user.Addresses) {
          if (user.Addresses.length < 4) {
            db.get()
              .collection(collection.USER_COLLECTION)
              .updateOne(
                { _id: objectId(userId) },
                {
                  $push: { Addresses: subAddress },
                }
              )
              .then(() => {
                resolve();
              });
          } else {
            resolve({ full: true });
          }
        } else {
          Addresses = [subAddress];
          db.get()
            .collection(collection.USER_COLLECTION)
            .updateOne({ _id: objectId(userId) }, { $set: { Addresses } })
            .then(() => {
              resolve();
            });
        }
      } catch (error) {
        reject(error);
      }
    });
  },

  deleteAddress: (addressId, userId) => {
    return new Promise((resolve, reject) => {
      try {
        db.get()
          .collection(collection.USER_COLLECTION)
          .updateOne(
            { _id: objectId(userId) },
            {
              $pull: { Addresses: { _addId: addressId } },
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

  updateAddress: (address, addressId, userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let user = await db
          .get()
          .collection(collection.USER_COLLECTION)
          .updateOne(
            { _id: objectId(userId), "Addresses._addId": addressId },
            {
              $set: {
                "Addresses.$.name": address.name,
                "Addresses.$.email": address.email,
                "Addresses.$.mobile": address.mobile,
                "Addresses.$.address": address.address,
                "Addresses.$.town": address.town,
                "Addresses.$.district": address.district,
                "Addresses.$.state": address.state,
                "Addresses.$.pincode": address.pincode,
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

  updateName: (userName, userId) => {
    return new Promise((resolve, reject) => {
      try {
        db.get()
          .collection(collection.USER_COLLECTION)
          .updateOne(
            { _id: objectId(userId) },
            { $set: { Name: userName.name } }
          )
          .then(() => {
            resolve();
          });
      } catch (error) {
        reject(error);
      }
    });
  },

  updateUserPassword: (userId, userPassword) => {
    return new Promise(async (resolve, reject) => {
      try {
        userPassword.Password = await bcrypt.hash(userPassword.Password, 10);

        db.get()
          .collection(collection.USER_COLLECTION)
          .updateOne(
            { _id: objectId(userId) },
            { $set: { Password: userPassword.Password } }
          )
          .then((data) => {
            resolve(data);
          });
      } catch (error) {
        reject(error);
      }
    });
  },

  placeAddress: (addressId, userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let address = await db
          .get()
          .collection(collection.USER_COLLECTION)
          .aggregate([
            {
              $match: { _id: objectId(userId) },
            },
            {
              $unwind: "$Addresses",
            },
            {
              $match: { "Addresses._addId": addressId },
            },
            {
              $project: {
                id: "$Addresses._addId",
                name: "$Addresses.name",
                email: "$Addresses.email",
                mobile: "$Addresses.mobile",
                address: "$Addresses.address",
                town: "$Addresses.town",
                pincode: "$Addresses.pincode",
                district: "$Addresses.district",
                state: "$Addresses.state",
              },
            },
          ])
          .toArray();
        resolve(address[0]);
      } catch (error) {
        reject(error);
      }
    });
  },

  orderValue: (orderId) => {
    let response = {};
    return new Promise(async (resolve, reject) => {
      try {
        let order = await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .findOne({ _id: objectId(orderId) });
        if (order) {
          if (order.value) {
            response.status = true;
            response.id = order._id;

            resolve(response);
          } else {
            if (order.cancel) {
            } else {
              response.status = false;
              response.id = order._id;
              resolve(response);
            }
          }
        } else {
          response.status = false;
          response.id = order._id;
          resolve(response);
        }
      } catch (error) {
        reject(error);
      }
    });
  },

  getUserCount: (req, res) => {
    return new Promise(async (resolve, reject) => {
      try {
        let user = await db
          .get()
          .collection(collection.USER_COLLECTION)
          .find()
          .count();

        resolve(user);
      } catch (error) {
        reject(error);
      }
    });
  },

  getOrderCount: (req, res) => {
    return new Promise(async (resolve, reject) => {
      try {
        let user = await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .find()
          .count();

        resolve(user);
      } catch (error) {
        reject(error);
      }
    });
  },

  totalDelivered: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let totalDeliveredCount = await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .find({ status: "Delivered" })
          .count();
        resolve(totalDeliveredCount);
      } catch (error) {
        reject(error);
      }
    });
  },

  totalCancelled: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let cancelled = await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .find({ status: "Cancelled" })
          .count();
        resolve(cancelled);
      } catch (error) {
        reject(error);
      }
    });
  },

  totalMonthAmount: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let amount = await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .aggregate([
            {
              $setWindowFields: {
                output: {
                  Tamount: {
                    $sum: "$totalAmount",
                  },
                },
              },
            },
            {
              $project: {
                Tamount: 1,
              },
            },
          ])
          .toArray();
        resolve(amount[0]);
      } catch (error) {
        reject(error);
      }
    });
  },

  totalCOD: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let count = await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .find({ payementMethod: "COD" })
          .count();
        resolve(count);
      } catch (error) {
        reject(error);
      }
    });
  },

  totalONLINE: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let onlineCount = await db
          .get()
          .collection(collection.ORDER_COLLECTION)
          .find({ payementMethod: "ONLINE" })
          .count();
        resolve(onlineCount);
      } catch (error) {
        reject(error);
      }
    });
  },
};
