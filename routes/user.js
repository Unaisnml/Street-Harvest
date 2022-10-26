const { response } = require("express");
const express = require("express");
const { USER_COLLECTION } = require("../config/collections");
const productHelpers = require("../helpers/product-helpers");
const router = express.Router();
const userHelpers = require("../helpers/user-helpers");
const twilioHelpers = require("../helpers/twilio-helpers");
const categoryHelpers = require("../helpers/category-helpers");
const adminHelpers = require("../helpers/admin-helpers");
const bannerHelpers = require("../helpers/banner-helpers");

const verifyLogin = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.redirect("/userLogin");
  }
};

/* GET home page. */
router.get("/", async (req, res, next) => {
  try {
    let cartCount = null;
    let wishListCount = null;
    let banner = null;
    let products = null;
    let category = null;
    if (req.session.user) {
      let users = req.session.user;
      cartCount = await userHelpers.getCartCount(req.session.user._id);
      wishListCount = await userHelpers.getWishListCount(req.session.user._id);
      category = await categoryHelpers.getAllCategory();
      banner = await bannerHelpers.getAllBanners();
      products = await productHelpers.getAllProducts();
      console.log(products);
      res.render("user/user-home", {
        users,
        category,
        banner,
        products,
        wishListCount,
        cartCount,
        user: true,
      });
    } else {
      category = await categoryHelpers.getAllCategory();
      banner = await bannerHelpers.getAllBanners();
      let products = await productHelpers.getAllProducts();
      console.log("12323 =", category);
      res.render("user/user-home", { category, products, banner, user: true });
    }
  } catch (error) {
    next(error);
  }
});

/* USER Signup. */
router.get("/userSignup", async (req, res, next) => {
  try {
    category = await categoryHelpers.getAllCategory();
    if (req.session.loggedIn) {
      res.redirect("/");
    } else {
      res.render("user/signup", {
        signupErr: req.session.signupErr,
        user: true,
        category,
      });
      req.session.signupErr = false;
    }
  } catch (error) {
    next(error);
  }
});

router.get("/otp", async (req, res) => {
  try {
    res.render("user/otp", { user: true, loginErr: req.session.loginErr });
  } catch (error) {
    next(error);
  }
});

router.post("/userSignup", (req, res) => {
  try {
    userHelpers.verifyUser(req.body).then((response) => {
      if (response.status) {
        req.session.body = req.body;

        twilioHelpers.doSms(req.body).then((data) => {
          console.log(req.body);

          req.session.body = req.body;
          if (data) {
            console.log(data);
            res.render("user/otp", { user: true });
          } else {
            res.redirect("/userSignup");
          }
        });
      } else {
        req.session.signupErr = true;
        res.redirect("/userSignup");
      }
    });
  } catch (error) {
    res.render("/err", { error });
  }
});

router.post("/otp", (req, res, next) => {
  try {
    twilioHelpers.otpVerify(req.body, req.session.body).then((response) => {
      if (response) {
        userHelpers.doSignup(req.session.body).then((response) => {
          res.redirect("/userLogin");
        });
      } else {
        req.session.message = "INVALID OTP";
        res.redirect("/otp");
      }
    });
  } catch (error) {
    res.render("/err", { error });
  }
});

/* USER Login. */
router.get("/userLogin", async (req, res, next) => {
  try {
    category = await categoryHelpers.getAllCategory();
    if (req.session.loggedIn) {
      let users = req.session.user;
      res.render("user/user-home", { users, user: true });
    } else {
      res.render("user/login", {
        loginerr: req.session.loginerr,
        user: true,
        category,
      });
      req.session.loginerr = false;
    }
  } catch (error) {
    next(error);
  }
});

router.post("/userLogin", function (req, res) {
  try {
    userHelpers.doLogin(req.body).then((response) => {
      if (response.status) {
        req.session.loggedIn = true;
        req.session.user = response.user;
        res.redirect("/");
      } else {
        req.session.loginerr = true;
        res.redirect("/userLogin");
      }
    });
  } catch (error) {
    next(error);
  }
});

/* USER Logout. */
router.get("/userLogout", function (req, res, next) {
  try {
    req.session.loggedIn = null;
    req.session.loggedIn = false;
    req.session.user = null;
    res.redirect("/");
  } catch (error) {
    next(error);
  }
});

/* Category Product View. */
router.get("/category", async (req, res, next) => {
  try {
    let catagory = req.query.category;
    let cartCount = null;
    let wishListCount = null;
    let users = req.session.user;
    if (req.session.user) {
      cartCount = await userHelpers.getCartCount(req.session.user._id);
      wishListCount = await userHelpers.getWishListCount(req.session.user._id);
    }

    let showCategory = await categoryHelpers.showCategory();
    let catProducts = await productHelpers.categoryProducts(catagory);
    let category = await categoryHelpers.getAllCategory();
    res.render("user/category", {
      catProducts,
      user: true,
      users,
      category,
      showCategory,
      wishListCount,
      cartCount,
    });
  } catch (error) {
    next(error);
  }
});

/* Single Product View. */
router.get("/single-product/:id", async (req, res, next) => {
  try {
    let prodId = req.params.id;
    let cartCount = null;
    let wishListCount = null;
    if (req.session.user) {
      cartCount = await userHelpers.getCartCount(req.session.user._ids);
      wishListCount = await userHelpers.getWishListCount(req.session.user._id);
    }
    console.log(prodId);
    let proDetails = await userHelpers.getProductDetails(prodId);
    console.log(proDetails);
    let users = req.session.user;
    let category = await categoryHelpers.getAllCategory();
    res.render("user/product-details", {
      proDetails,
      cartCount,
      wishListCount,
      users,
      category,
      user: true,
    });
  } catch (error) {
    next(error);
  }
});

/* USER Add to WishList. */
router.get("/add-to-wishList/:id", verifyLogin, (req, res, next) => {
  try {
    let prodId = req.params.id;
    let userId = req.session.user._id;
    userHelpers.addtoWishList(prodId, userId).then(() => {
      res.json({ status: true });
    });
  } catch (error) {
    next(error);
  }
});

/* USER View WhishList. */
router.get("/wishList", verifyLogin, async (req, res) => {
  try {
    let users = req.session.user;
    let wishListCount = null;
    let cartCount = null;
    let products = await userHelpers.getWishListProducts(req.session.user._id);
    let category = await categoryHelpers.getAllCategory();
    wishListCount = await userHelpers.getWishListCount(req.session.user._id);
    if (req.session.user) {
      cartCount = await userHelpers.getCartCount(req.session.user._id);
    }
    res.render("user/WishList", {
      users,
      products,
      cartCount,
      wishListCount,
      category,
      user: true,
    });
  } catch (error) {
    next(error);
  }
});

/* USER Remove WhishList. */
router.get(
  "/delete-wishItem/:wishId/:prodId",
  verifyLogin,
  (req, res, next) => {
    try {
      let wishId = req.params.wishId;
      let prodId = req.params.prodId;
      userHelpers.deleteWishItem(wishId, prodId).then((response) => {
        res.json(response);
      });
    } catch (error) {
      next(error);
    }
  }
);

/* USER Add to Cart. */
router.get("/add-to-cart/:id", verifyLogin, (req, res, next) => {
  try {
    let prodId = req.params.id;
    let userId = req.session.user._id;
    userHelpers.addToCart(prodId, userId).then(() => {
      res.json({ status: true });
    });
  } catch (error) {
    next(error);
  }
});

/* USER View Cart. */
router.get("/cart", verifyLogin, async (req, res, next) => {
  try {
    let wishListCount = null;
    let cartCount = null;
    let category = await categoryHelpers.getAllCategory();
    let products = await userHelpers.getCartProducts(req.session.user._id);
    wishListCount = await userHelpers.getWishListCount(req.session.user._id);
    cartCount = await userHelpers.getCartCount(req.session.user._id);
    let totalValue = 0;
    if (products.length > 0) {
      totalValue = await userHelpers.getTotalAmount(req.session.user._id);
    }
    let users = req.session.user;
    res.render("user/cart", {
      products,
      users,
      wishListCount,
      cartCount,
      totalValue,
      category,
      user: true,
    });
  } catch (error) {
    next(error);
  }
});

/* Change Product quantiry. */
router.post("/change-product-quantity", verifyLogin, (req, res, next) => {
  try {
    let userId = req.session.user._id;
    userHelpers.changeProductQuantity(req.body).then(async (response) => {
      response.total = await userHelpers.getTotalAmount(userId);
      res.json(response);
    });
  } catch (error) {
    next(error);
  }
});

/* Change Delete-cartItem. */
router.get(
  "/delete-cartItem/:cartId/:prodId",
  verifyLogin,
  (req, res, next) => {
    try {
      let cartId = req.params.cartId;
      let prodId = req.params.prodId;
      userHelpers.deleteCartItem(cartId, prodId).then((response) => {
        res.json(response);
      });
    } catch (error) {
      next(error);
    }
  }
);

/* Checkout */
router.get("/checkout", verifyLogin, async (req, res, next) => {
  try {
    let addressId = req.query.id;
    let userId = req.session.user._id;
    let users = req.session.user;
    let total = await userHelpers.getTotalAmount(req.session.user._id);
    let products = await userHelpers.getCartProducts(req.session._id);
    let category = await categoryHelpers.getAllCategory();
    let viewCoupon = await adminHelpers.viewCoupon();
    let selectAddress = await userHelpers.placeAddress(addressId, userId);
    let userAddress = await userHelpers.userAddress(req.session.user._id);
    res.render("user/checkout", {
      users,
      total,
      products,
      category,
      selectAddress,
      userId,
      userAddress,
      viewCoupon,
      user: true,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/checkout", verifyLogin, async (req, res, next) => {
  try {
    let products = await userHelpers.getCartProductList(req.body.userId);
    let totalPrice = await userHelpers.getTotalAmount(req.body.userId);
    userHelpers.checkOut(req.body, products, totalPrice).then((orderId) => {
      if (req.body["payement-method"] == "COD") {
        res.json({ codSuccess: true });
      } else {
        userHelpers.generateRazorpay(orderId, totalPrice).then((response) => {
          res.json(response);
        });
      }
    });
  } catch (error) {
    next(error);
  }
});

/*Apply Coupon */
router.post("/apply-coupon", verifyLogin, async (req, res, next) => {
  try {
    console.log(req.body);
    let response = await userHelpers.applyCoupon(
      req.body.couponName,
      req.body.userId
    );
    if (response.CouponName) {
      req.session.CouponName = response.CouponName;
    }
    res.json(response);
  } catch (error) {
    console.log(error);
    next(error);
  }
});

/* Verify Payement */
router.post("/verify-payment", verifyLogin, (req, res, next) => {
  try {
    console.log(req.body);
    userHelpers
      .verifyPayment(req.body)
      .then(() => {
        userHelpers.changePaymentStatus(req.body["order[receipt]"]).then(() => {
          console.log("payment successfull");
          res.json({ status: true });
        });
      })
      .catch((err) => {
        console.log(err);
        res.json({ status: false, errMsg: "" });
      });
  } catch (error) {
    next(error);
  }
});

/* Order Success */
router.get("/order-success", verifyLogin, (req, res, next) => {
  try {
    let users = req.session.user;
    res.render("user/order-success", { users, user: true });
  } catch (error) {
    next(error);
  }
});

/* View Orders */
router.get("/orders", verifyLogin, async (req, res, next) => {
  try {
    let orders = await userHelpers.getUserOrders(req.session.user._id);
    let cartCount = await userHelpers.getCartCount(req.session.user._id);
    let wishListCount = await userHelpers.getWishListCount(
      req.session.user._id
    );
    let users = req.session.user;
    res.render("user/orders", {
      users,
      cartCount,
      wishListCount,
      orders,
      user: true,
    });
  } catch (error) {
    next(error);
  }
});

/* View order Single Product */
router.get("/view-order-products/:id", verifyLogin, async (req, res, next) => {
  try {
    let users = req.session.user;
    let products = await userHelpers.getOrderProduct(req.params.id);
    let orders = await userHelpers.getUserOrders(req.session.user._id);
    let value = await userHelpers.orderValue(req.params.id);
    let wishListCount = await userHelpers.getWishListCount(
      req.session.user._id
    );
    let cartCount = await userHelpers.getCartCount(req.session.user._id);
    res.render("user/view-order", {
      user: true,
      users,
      products,
      orders,
      wishListCount,
      cartCount,
      value,
    });
  } catch (error) {
    next(error);
  }
});

/* Cancel Item */
router.get("/item-cancelled/:id", verifyLogin, async (req, res, next) => {
  try {
    orderId = req.params.id;

    let changeStatusCancelled = await userHelpers.changeStatusCancelled(
      orderId
    );
    res.redirect("/orders");
  } catch (error) {
    next(error);
  }
});

/* Profile */
router.get("/profile", verifyLogin, async (req, res, next) => {
  try {
    let cartCount = null;
    if (req.session.user) {
      cartCount = await userHelpers.getCartCount(req.session.user._id);
    }
    userDetails = req.session.user._id;
    let wishListCount = null;
    if (req.session.user) {
      wishListCount = await userHelpers.getWishListCount(req.session.user._id);
    }
    let userSignupDetails = await userHelpers.getPersonalDetails(
      req.session.user._id
    );
    let users = req.session.user;
    let userAddress = await userHelpers.userAddress(req.session.user._id);

    res.render("user/profile", {
      user: true,
      users,
      userDetails,
      cartCount,
      wishListCount,
      userSignupDetails,
      userAddress,
    });
  } catch (error) {
    next(error);
  }
});

/* Add address*/
router.post("/add-address", verifyLogin, async (req, res, next) => {
  try {
    let userProfileDetails = await userHelpers.profileDetails(
      req.body,
      req.session.user._id
    );
    res.redirect("/profile");
  } catch (error) {
    next(error);
  }
});

/* Delete address*/
router.get("/delete-address/:id", verifyLogin, async (req, res, next) => {
  try {
    userId = req.session.user._id;
    addressId = req.params.id;
    let deleteAddress = await userHelpers.deleteAddress(addressId, userId);
    res.redirect("/profile");
  } catch (error) {
    next(error);
  }
});

/* Edit address*/
router.post("/edit-address/:id", verifyLogin, (req, res, next) => {
  try {
    addressId = req.params.id;
    userId = req.session.user._id;
    userHelpers.updateAddress(req.body, addressId, userId).then((response) => {
      res.redirect("/profile");
    });
  } catch (error) {
    next(error);
  }
});

/* Update-profile*/
router.post("/update-profile", verifyLogin, async (req, res, next) => {
  try {
    let userName = await userHelpers.updateName(req.body, req.session.user._id);
    res.redirect("/profile");
  } catch (error) {
    next(error);
  }
});

/* Change Password */
router.post("/change-password", verifyLogin, async (req, res, next) => {
  try {
    userId = req.session.user._id;

    let userPassword = await userHelpers.updateUserPassword(userId, req.body);

    res.redirect("/profile");
  } catch (error) {}
});

/* Contact */
router.get("/contact", async (req, res, next) => {
  try {
    let category = null;
    category = await categoryHelpers.getAllCategory();
    res.render("user/contact", { user: true, category });
  } catch (error) {
    next(error);
  }
});

/* Banner Item */
router.get("/shop-now", async (req, res, next) => {
  try {
    let products = await productHelpers.getAllProducts();
    let category = await categoryHelpers.getAllCategory();
    let users = req.session.user;
    let cartCount = null;
    let wishListCount = null;
    if (req.session.user) {
      cartCount = await userHelpers.getCartCount(req.session.user._id);
    }
    if (req.session.user) {
      wishListCount = await userHelpers.getWishListCount(req.session.user._id);
    }
    res.render("user/banner-item", {
      user: true,
      products,
      category,
      users,
      cartCount,
      wishListCount,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
