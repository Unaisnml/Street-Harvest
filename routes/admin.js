const express = require("express");
const { response } = require("../app");
const adminHelpers = require("../helpers/admin-helpers");
const userHelpers = require("../helpers/user-helpers");
const categoryHelpers = require("../helpers/category-helpers");
const productHelpers = require("../helpers/product-helpers");
const bannerHelpers = require("../helpers/banner-helpers");
const router = express.Router();

const verifyLogin = (req,res,next) =>{
  if(req.session.adminloggedIn){
    next()
  }else{
    res.redirect('/admin')
  }
}

/* Admin Login*/
router.get("/", (req, res, next)=> {
  if (req.session.adminloggedIn) {
    res.redirect("/admin");
  } else {
    res.render("partials/admin-login", {
      adminLogin: true,
      adminLogErr: req.session.adminLogErr,
    });
    req.session.adminLogErr = false;
  }
});

router.post("/", (req, res, next) => {
  adminHelpers.adminLogin(req.body).then(async (response) => {
    if (response.status) {
      req.session.adminloggedIn = true;
      req.session.admin = response.admin;
      let admin = req.session.admin;
      let userCount = await userHelpers.getUserCount();
      let orderCount = await userHelpers.getOrderCount();
      let totalDelivered = await userHelpers.totalDelivered();
      let cancelled = await userHelpers.totalCancelled();
      let monthamount = await userHelpers.totalMonthAmount();
      let codCount = await userHelpers.totalCOD();
      let ONLINECount = await userHelpers.totalONLINE();

      res.render("admin/admin-home", {
        admin,
        userCount,
        orderCount,
        totalDelivered,
        cancelled,
        monthamount,
        codCount,
        ONLINECount,
        admin: true,
      });
    } else {
      req.session.loginerr = true;
      res.redirect("/admin");
    }
  });
});

/* Admin Logout*/
router.get("/adminLogout", (req, res, next)=> {
  req.session.adminloggedIn = null;
  req.session.adminloggedIn = false;
  req.session.admin = null;
  res.redirect("/admin");
});

/* Admin Dashboard Management. */
router.get("/dash-board", (req, res,next) => {
  res.redirect("/admin");
});

/* Admin User Management. */
router.get("/manage-users",  (req, res, next) =>{
  adminHelpers.getAllUsers().then((userdetails) => {
    res.render("admin/view-users", { admin: true, userdetails });
  });
});

router.get("/block-user/:id", (req, res, next) => {
  adminHelpers.blockUser(req.params.id, req.body).then(() => {
    res.redirect("/admin/manage-users");
  });
});

router.get("/unblock-user/:id", (req, res, next) => {
  adminHelpers.unblockUser(req.params.id, req.body).then(() => {
    res.redirect("/admin/manage-users");
  });
});

/* Admin Category Management. */

router.get("/add-category", function (req, res, next) {
  res.render("admin/add-category", { admin: true });
 
});


router.post('/add-category',(req,res,next)=>{
  try{
    categoryHelpers.addCategory(req.body).then((response)=>{
      console.log(req.body);
      res.json(response)
    })
  }catch(err){
    console.log(err)
    next()
  }
  })

router.get("/view-category", function (req, res, next) {
  categoryHelpers.getAllCategory().then((catDetails) => {
    res.render("admin/view-category", { admin: true, catDetails });
  });
});

router.get("/delete-category/:id", (req, res, next) => {
  let catId = req.params.id;
  categoryHelpers.deleteCategory(catId).then((response) => {
    res.redirect("/admin/view-category");
  });
});

/* Admin Product Management. */
router.get("/add-product", function (req, res, next) {
  categoryHelpers.getAllCategory().then((catDetails) => {
    res.render("admin/add-product", { admin: true, catDetails });
  });
});

router.post("/add-product", (req, res, next) => {
  productHelpers.addProduct(req.body, (id) => {
    let image = req.files.Image;
    image.mv("./public/product-images/" + id + ".jpg", (err, done) => {
      if (!err) {
        res.render("admin/add-product", { admin: true });
      } else {
        console.log(err);
      }
    });
  });
});

router.get("/view-product", function (req, res, next) {
  productHelpers.getAllProducts().then((products) => {
    res.render("admin/view-products", { products, admin: true });
  });
});

router.get("/edit-product/:id", async (req, res, next) => {
  let product = await productHelpers.getProductDetails(req.params.id);
  let categorydetails = await categoryHelpers.getAllCategory();
  console.log(req.params.id);
  res.render("admin/edit-product", { product, categorydetails, admin: true });
});

router.post("/edit-product/:id", (req, res, next) => {
  let id = req.params.id;
  productHelpers.updateProduct(req.params.id, req.body).then(() => {
    res.redirect("/admin/view-product");
    if (req.files.Image) {
      let image = req.files.Image;
      image.mv("./public/product-images/" + id + ".jpg");
    }
  });
});

router.get("/delete-product/:id", (req, res, next) => {
  let prodId = req.params.id;
  productHelpers.deleteProduct(prodId).then((response) => {
    res.redirect("/admin/view-product");
  });
});

router.get("/coupon", async (req, res, next) => {
  try {
    let coupons = await adminHelpers.getCoupons();
    res.render("admin/admin-Coupon", {
      admin: true,
      coupons,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.post("/coupon", async (req, res, next) => {
  try {
    await adminHelpers.addCoupon(req.body);
    res.redirect("/admin/coupon");
  } catch (error) {
    console.log(error);
    next(error);
  }
});

router.get("/delete-coupon/:id", (req, res, next) => {
  let couponId = req.params.id;
  adminHelpers.deleteCoupon(couponId).then((response) => {
    res.redirect("/admin/coupon");
  });
});


router.get("/add-banner", (req, res, next)=> {
  try {
    res.render("admin/add-banner", { admin: true });
  } catch (error) {
    next(error);
  }
});

router.post("/add-banner", (req, res, next) => {
  bannerHelpers.addBanner(req.body, (id) => {
    console.log(req.body);
    let image = req.files.Image;
    image.mv("./public/banner-images/" + id + ".jpg", (err, done) => {
      if (!err) {
        res.render("admin/add-banner",{admin:true});
      } else {
        console.log(err);
      }
    });
  });
});

router.get("/view-orders", async (req, res, next) => {
  try {
    order = await adminHelpers.adminOrders();

    res.render("admin/order", { admin: true, order });
  } catch (error) {
    next(error);
  }
});

router.get("/view-orderproduct/:id", async (req, res, next) => {
  try {
    let singleId = req.params.id;

    let products = await userHelpers.getOrderProduct(req.params.id);
    let buttonchange = await userHelpers.buttonChange(singleId);
    console.log("singleId", singleId);
    console.log("products", products);

    res.render("admin/view-orderproduct", {
      products,
      singleId,
      admin: true,
      buttonchange,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/item-packed/:id", async (req, res, next) => {
  try {
    orderId = req.params.id;
    let changeStatusPacked = userHelpers.changeStatus(orderId);
    res.redirect("/admin/view-orders");
  } catch (error) {
    next(error);
  }
});

router.get("/item-shipped/:id", async (req, res, next) => {
  try {
    orderId = req.params.id;

    let changeStatusShipped = userHelpers.changeStatusShipped(orderId);
    res.redirect("/admin/view-orders");
  } catch (error) {
    next(error);
  }
});

router.get("/item-delivered/:id", async (req, res, next) => {
  try {
    orderId = req.params.id;

    let changeStatusDelivered = await userHelpers.changeStatusDelivered(
      orderId
    );
    res.redirect("/admin/view-orders");
  } catch (error) {
    next(error);
  }
});

// Banner Managemnt
router.get("/add-banner", (req, res, next)=> {
  try {
    res.render("admin/add-banner", { admin: true });
  } catch (error) {
    next(error);
  }
});

router.post("/add-banner", (req, res, next) => {
  bannerHelpers.addBanner(req.body, (id) => {
    console.log(req.body);
    let image = req.files.Image;
    image.mv("./public/banner-images/" + id + ".jpg", (err, done) => {
      if (!err) {
        res.render("admin/add-banner",{admin:true});
      } else {
        console.log(err);
      }
    });
  });
});

router.get("/view-banner", function (req, res, next) {
  bannerHelpers.getAllBanners().then((banners) => {
    res.render("admin/view-banner", { banners, admin: true });
  });
});


router.get("/delete-banner/:id", (req, res, next) => {
  let bandId = req.params.id;
  bannerHelpers.deleteBanner(bandId).then((response) => {
    res.redirect("/admin/view-banner");
  });
});

module.exports = router;
