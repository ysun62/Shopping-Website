// This function calls getLoggedInUser() which calls getProducts()
let onPageLoad = function() {
    getLoggedInUser(function() {
        getProducts(function(){
            getCartSize();
            getCart();
        });
    });
};

// callback makes sure this function (getLoggedInUser) finishes first, then continues to the next function
let getLoggedInUser = function(callback) {
    $.getJSON(getLoggedInUserURL, function(response) {
        app.loggedInUser = response.user;
        callback();
    });
};

// This function indirectly gets all the products from the database
let getProducts = function(callback) {
    $.getJSON(getProductListURL, function(response) {
        app.products = response.products;
        processProducts(function() {

            // This callback ensures getProducts() finishes first before calling getCartSize() and getCart()
            callback();
        });
        
    });
};

// This function loops through the product array and assigns new attributes to each one
let processProducts = function(callback) {
    let index = 0;
    app.products.map((product) => {
        Vue.set(product, 'index', index++);
        Vue.set(product, 'showReviews', false);
        Vue.set(product, 'isHidden', false);
        Vue.set(product, 'yourReview', { body: '', numStars: 0, rating: 0 });
        Vue.set(product, 'otherReviews', []);
        Vue.set(product, 'alreadyPresent', false);
        // Vue.set(product, )
    });

    // This callback ensures processProducts() finishes right before the callback inside getProducts()
    callback();
};

// This function loops through the cart array and assigns indices to each one
let processCart = function() {
    let index = 0;
    app.cart.map((c) => {
        Vue.set(c, 'index', index++);
    });
};

// This function indirectly gets yourReview from the database
let getYourReview = function(productIndex) {
    // exit the function if the user is not logged in
    if(app.loggedInUser === null) {
        return;
    }

    let product = app.products[productIndex];
    $.getJSON(getYourReviewURL, { product_id: product.id, user_email: app.loggedInUser }, function(response) {
        if (response.review != null) {
            product.yourReview = response.review;
            product.yourReview.rating = response.review.rating;
            product.yourReview.numStars = response.review.rating;
        }
        // console.log(response.review);
        Vue.set(product.yourReview, 'hasBeenSaved', false);
    });
  
};

// This function saves yourReview after clicking "Save"
let saveReview = function(productIndex) {
    // exit the function if the user is not logged in
    if (app.loggedInUser === null) {
        return;
    }

    let product = app.products[productIndex];
    product.yourReview.hasBeenSaved = false;

    if(product.yourReview.body === '') {
        alert('Review cannot be blank!');
        return;
    }

    $.post(saveReviewURL, {product_id: product.id, user_email: app.loggedInUser, body: product.yourReview.body, rating: product.yourReview.rating}, function(response) {
        product.yourReview.hasBeenSaved = true;
        setTimeout(function() {
            product.yourReview.hasBeenSaved = false; // product.yourReview.hasBeenSaved sets back to false after 9.99s
        }, 1500);
    });

};

// This function indirectly gets the other reviews from the database
let getOtherReviews = function(productIndex) {
    let product = app.products[productIndex];
    $.getJSON(getOtherReviewsURL, {product_id: product.id}, function(response) {
        product.otherReviews = response.other_reviews;
    });
    // console.log(app.loggedInUser); testing
};

// This function allows user to either open up or close the review section
let toggleReviewsSection = function(productIndex) {
    let product = app.products[productIndex];

    for(let i=0; i<app.products.length; i++) {
        if(i!=productIndex) {
            app.products[i].showReviews = false;
        }
    }

    product.showReviews = !product.showReviews;
};


// This function filters products based on what the user types in the search bar
let filterProducts = function() {
    for(let i=0; i<app.products.length; i++) {
        var product = app.products[i];
        var name = product.name;

        // Comparing two strings, name and search_string
        if(name.toLowerCase().includes(app.search_string.toLowerCase())) {
            product.isHidden = false;
        } else {
            product.isHidden = true;
        }
    }
}

// This function indirectly updates the # of stars for yourReview to the database.
// And calculates average star reviews for each product.
let clickStar = function(productIndex, Numstar) {
    let product = app.products[productIndex];
    product.yourReview.rating = Numstar;
    product.yourReview.numStars = product.yourReview.rating;

   // Calculating average
    let sum = 0;
    let length = product.otherReviews.length + 1; // Total length of reviews

    // Your review
    if(product.yourReview.rating > 0) {
        sum += product.yourReview.rating;
    } else {
        length--;
    }

   // Other reviews
    for(let i=0; i<product.otherReviews.length; i++) {
        if(product.otherReviews[i].rating > 0) {
            sum += product.otherReviews[i].rating;
        } else {
            length--;
        }
    }

   product.avg = Math.round(sum/length); // Rounding the product.avg to its nearest integer
   // console.log(product.avg); testing
};

let hoverStar = function(productIndex, Numstar) {
    let product = app.products[productIndex];
    product.yourReview.rating = Numstar;
    // console.log(productIndex);
    // console.log(starIndex);
};

let leaveStar = function(productIndex) {
    let product = app.products[productIndex];
    product.yourReview.rating = product.yourReview.numStars;
};

let getCartProductID = function(productIndex) {
    $.getJSON(getCartProductIDURL, {email: app.loggedInUser}, function(response) {
        app.cart = response.cart;
        processCart();
    });
    // console.log(app.cart[0].product_id);
    updateCart(productIndex);
};

// This function updates cart_size and cart page right after clicking the buy button w/o loading
// the page
let updateCart = function(productIndex) {
    var p = app.products[productIndex];

    if(app.loggedInUser === null) {
        p.buyQuantity = null;
        return;
    }
    else if(p.buyQuantity === null) {
        return;
    }

    // Loops through the current cart array; if products are in the cart, set alreadyPresent of
    // the product to true, and updates the buyQuantity of the products in the cart
    for(let j=0; j<app.cart.length; j++) {
        if(app.cart[j].product_id === p.id) {
            app.cart[j].buyQuantity = p.buyQuantity;
            p.alreadyPresent = true;
            newCartTotal();
        }
        
        // app.cart_total += app.cart[j].buyQuantity * app.cart[j].price;
    }
    // console.log(app.cart[0].buyQuantity);
    // console.log(app.cart_total);
    // if the clicked product is not in the cart, then inserts the product into the cart, and 
    // updates the cart_size
    if(p.alreadyPresent === false){
        app.cart.push(p);
        app.cart_size++;
        p.alreadyPresent = true;
        newCartTotal();
        // app.cart_total += p.buyQuantity * p.price;
    }    
};

// This function stores the buyQuantity of the clicked product into database
let storeCart = function(productIndex) {
    var p = app.products[productIndex];

    if (app.loggedInUser === null) {
        alert('Please Log In!');
        return;
    }
    else if(p.buyQuantity === null) {
        return;
    }

    $.post(storeCartURL, {
       buyNum: p.buyQuantity,
       product_id: p.id,
       email: app.loggedInUser,
       already_present: p.alreadyPresent
    }, function(){
        // app.cart_total += p.buyQuantity * p.price;
        // getCart();
        getCartProductID(productIndex);
    });
};

// This function gets the cart_size for this user from database to the page
let getCartSize = function() {
    if(app.loggedInUser == undefined) {
        return;
    }

    $.getJSON(getCartSizeURL, {
        email: app.loggedInUser
    }, function(response) {
        // Gets cart_size from api function
        app.cart_size = response.size;
    });
};

// This function gets the products in cart from database to cart array
let getCart = function() {
    if(app.loggedInUser === null) {
        return;
    }

    $.getJSON(getCartURL, {
        email: app.loggedInUser
    }, function(response) {
        app.cart = response.cart; // Gets the cart array from api
        app.cart_total = response.cartTotal; // Gets the cart_total from api

        // After getting the cart, set alreadyPresent for every existing product to true
        for(let i=0; i<app.products.length; i++) {
            for(let j=0; j<app.cart.length; j++) {
                if(app.cart[j].product_id === app.products[i].id) {
                    app.products[i].alreadyPresent = true;
                }
            }
        }
        processCart();
    });
};

// This function removes a specific product in the cart
let removeProduct = function(productIndex) {
    if(app.loggedInUser === null) {
        return;
    }

    var p = app.cart[productIndex];
    app.cart.splice(productIndex, 1); // Removes the specific product from the cart
    app.cart_size--; // Decrement the cart_size by 1


    // Upon removing the product, updates the shopping page
    for(let i=0; i<app.products.length; i++) {
        if(p.product_id === app.products[i].id) {
            app.products[i].buyQuantity = null;
            app.products[i].alreadyPresent = false;
        }
    }
    // Reset the indices for products in cart
    processCart();

    $.post(removeProdURL, {
        email: app.loggedInUser,
        product_id: p.product_id,
    }, function() {
        // Whenever a product is removed from the cart, cart_total gets updated
        app.cart_total -= p.buyQuantity * p.price;
    });
};

// This function removes all products in cart after placing order
let removeAll = function() {
    if(app.loggedInUser === null) {
        return;
    }

    $.post(removeAllURL, {
        email: app.loggedInUser
    });
};

// This function resets cart_total back to 0 after the modal
let resetCartTotal = function() {
    if(app.loggedInUser === null) {
        return;
    }
    app.cart_total = 0;

    // Also clears the cart
    app.cart = [];
    app.cart_size = 0;
    for(let i=0; i<app.products.length; i++) {
        app.products[i].buyQuantity = null;
        app.products[i].alreadyPresent = false;
    }
};

let newCartTotal = function() {
    app.cart_total = 0;
    for(let i=0; i<app.cart.length; i++) {
        // console.log(app.cart_total+'in');
        app.cart_total += app.cart[i].price * app.cart[i].buyQuantity;
    }
    app.cart_total = Math.round(10 * app.cart_total) / 10;
};

// This function updates buyQuantity for the product on the shopping page AND the database
// when the buyQuantity for the same product in the cart gets modified
let updateBuyQuantity = function(productIndex) {
    if(app.loggedInUser === null) {
        return;
    }

    var p = app.products[productIndex];
    if(app.cart[productIndex].buyQuantity > 0) {
        p.buyQuantity = app.cart[productIndex].buyQuantity;
        storeCart(productIndex);
    }
    newCartTotal();
};

let app = new Vue({
   el: "#vue-div",
   delimiters: ['${', '}'],
   unsafeDelimiters: ['!{', '}'],
   data: {
       page: 'shopping',
       cart: [], //Declares an array called "cart"
       cart_total: 0,
       cart_size: 0,
       products: [], // Declares an array called "products"
       star_indices: [1, 2, 3, 4, 5], // Declares an array called "star_indices"
       search_string: '', // Declares an empty string
       loggedInUser: undefined
   },
   methods: {
       getYourReview: getYourReview,
       saveReview: saveReview,
       toggleReviewsSection: toggleReviewsSection,
       getOtherReviews: getOtherReviews,
       clickStar: clickStar,
       filterProducts: filterProducts,
       updateCart: updateCart,
       storeCart: storeCart,
       getCart: getCart,
       getCartSize: getCartSize,
       removeProduct: removeProduct,
       removeAll: removeAll,
       resetCartTotal: resetCartTotal,
       updateBuyQuantity: updateBuyQuantity
   }
});

// Calls onPageLoad()
onPageLoad();


