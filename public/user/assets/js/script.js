function addToCart(prodId) {
  $.ajax({
    url: "/add-to-cart/" + prodId,
    method: "get",
    success: (response) => {
      if (response.status) {
        Swal.fire({
          
          icon: 'success',
          title: 'Added to Cart',
          showConfirmButton: false,
          timer: 800
        })
        let count = $("#cart-count").html();
        count = parseInt(count) + 1;
        $("#cart-count").html(count);

      } else {
        location.href = "/userLogin";
      }
    },
  });
}

function addtoWishList(prodId) {
  $.ajax({
    url: "/add-to-wishList/" + prodId,
    method: "get",
    success: (response) => {
      if (response.status) {
        Swal.fire({
          
          icon: 'success',
          title: 'Added to Wishlist',
          showConfirmButton: false,
          timer: 800
        })
        let count = $("#whishlist-count").html();
        count = parseInt(count) + 1;
        $("#whishlist-count").html(count);
      } else {
        location.href = "/userLogin";
      }
    },
  });
}
