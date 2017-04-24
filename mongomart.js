/*
  Copyright (c) 2008 - 2016 MongoDB, Inc. <http://mongodb.com>

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/


var express = require('express'),
    bodyParser = require('body-parser'),
    nunjucks = require('nunjucks'),
    MongoClient = require('mongodb').MongoClient,
    assert = require('assert'),
    ItemDAO = require('./items').ItemDAO,
    CartDAO = require('./cart').CartDAO;


// Set up express
var app = express();
app.set('view engine', 'html');
app.set('views', __dirname + '/views');
app.use('/static', express.static(__dirname + '/static'));
app.use(bodyParser.urlencoded({extended: true}));


/*
 Configure nunjucks to work with express
 Not using consolidate because I'm waiting on better support for template inheritance with
 nunjucks via consolidate. See: https://github.com/tj/consolidate.js/pull/224
*/
var env = nunjucks.configure('views', {
    autoescape: true,
    express: app
});

var nunjucksDate = require('nunjucks-date');
nunjucksDate.setDefaultFormat('MMMM Do YYYY, h:mm:ss a');
env.addFilter("date", nunjucksDate);

var ITEMS_PER_PAGE = 5;

// Hardcoded USERID for use with the shopping cart portion
var USERID = "558098a65133816958968d88";

MongoClient.connect(process.env.MONGODB_URI, function (err, db) {
    "use strict";

    assert.equal(null, err);
    console.log("Successfully connected to MongoDB.");

    var items_col = new ItemDAO(db);
    var cart_col = new CartDAO(db);

    db.collection('item').createIndex(
       {
         title: "text",
         slogan: "text",
         description: "text",
         cateogry: "text"
       })

    var router = express.Router();

    function cartTotal(userCart) {
        var total = 0;
        var i;
        for (i = 0; i < userCart.items.length; i += 1) {
            var item = userCart.items[i];
            total += item.price * item.quantity;
        }
        return total;
    }


    // Homepage
    router.get("/", function (req, res) {
        var page = req.query.page
            ? parseInt(req.query.page)
            : 0;
        var category = req.query.category || "All";

        items_col.getCategories(function (categories) {

            items_col.getItems(category, page, ITEMS_PER_PAGE, function (pageItems) {

                items_col.getNumItems(category, function (itemCount) {

                    var numPages = 0;
                    if (itemCount > ITEMS_PER_PAGE) {
                        numPages = Math.ceil(itemCount / ITEMS_PER_PAGE);
                    }

                    res.render('home', {category_param: category,
                            categories: categories,
                            useRangeBasedPagination: false,
                            itemCount: itemCount,
                            pages: numPages,
                            page: page,
                            items: pageItems});
                });
            });
        });
    });


    router.get("/search", function (req, res) {
        var page = req.query.page
            ? parseInt(req.query.page)
            : 0;
        var query = req.query.query || "";

        items_col.searchItems(query, page, ITEMS_PER_PAGE, function (foundItems) {

            items_col.getNumFoundItems(query, function (itemsCount) {

                var numPages = 0;

                if (itemsCount > ITEMS_PER_PAGE) {
                    numPages = Math.ceil(itemsCount / ITEMS_PER_PAGE);
                }

                res.render('search', {queryString: query,
                        itemsCount: itemsCount,
                        pages: numPages,
                        page: page,
                        items: foundItems});
            });
        });
    });


    router.get("/item/:itemId", function (req, res) {
        var itemId = parseInt(req.params.itemId);

        items_col.getItem(itemId, function (item) {
            if (item === null) {
                res.status(404).send("Item not found.");
                return;
            }

            var stars = 0;
            var numReviews = 0;
            var reviews = [];

            if ("reviews" in item) {
                numReviews = item.reviews.length;
                var i;
                for (i = 0; i < numReviews; i += 1) {
                    stars += item.reviews[i].stars;
                }

                if (numReviews > 0) {
                    stars = stars / numReviews;
                    reviews = item.reviews;
                }
            }

            items_col.getRelatedItems(function (relatedItems) {

                res.render("item",
                        {
                    userId: USERID,
                    item: item,
                    stars: stars,
                    reviews: reviews,
                    numReviews: numReviews,
                    relatedItems: relatedItems
                });
            });
        });
    });


    router.post("/item/:itemId/reviews", function (req, res) {
        var itemId = parseInt(req.params.itemId);
        var review = req.body.review;
        var name = req.body.name;
        var stars = parseInt(req.body.stars);

        items_col.addReview(itemId, review, name, stars, function (itemDoc) {
            res.redirect("/item/" + itemId);
        });
    });


    /*
     *
     * Since we are not maintaining user sessions in this application, any interactions with
     * the cart will be based on a single cart associated with the the USERID constant we have
     * defined above.
     *
     */
    router.get("/cart", function (req, res) {
        res.redirect("/user/" + USERID + "/cart");
    });


    router.get("/user/:userId/cart", function (req, res) {
        var userId = req.params.userId;
        cart_col.getCart(userId, function (userCart) {
            var total = cartTotal(userCart);
            res.render("cart",
                    {
                userId: userId,
                updated: false,
                cart: userCart,
                total: total
            });
        });
    });


    router.post("/user/:userId/cart/items/:itemId", function (req, res) {
        var userId = req.params.userId;
        var itemId = parseInt(req.params.itemId);

        var renderCart = function(userCart) {
            var total = cartTotal(userCart);
            res.render("cart",
                {
                   userId: userId,
                   updated: true,
                   cart: userCart,
                   total: total
                }
            );
        };

        cart_col.itemInCart(userId, itemId, function(itemInCart) {
            if (itemInCart == null) {
                items.getItem(itemId, function(item) {
                    item.quantity = 1;
                    cart_col.addItem(userId, item, function (addedCart) {
                        renderCart(addedCart);
                    });
                });
            } else {
                cart_col.updateQuantity(userId, itemId, itemInCart.quantity+1, function(userCart) {
                    renderCart(userCart);
                });
            }
        });
    });


    router.post("/user/:userId/cart/items/:itemId/quantity", function (req, res) {
        var userId = req.params.userId;
        var itemId = parseInt(req.params.itemId);
        var quantity = parseInt(req.body.quantity);

        cart_col.updateQuantity(userId, itemId, quantity, function (userCart) {
            var total = cartTotal(userCart);
            res.render("cart",
                    {
                userId: userId,
                updated: true,
                cart: userCart,
                total: total
            });
        });
    });

    // Use the router routes in our application
    app.use('/', router);

    // Start the server listening
    // var server;
    // server = app.listen(3000, function () {
    //     var port = server.address().port;
    //     console.log('Mongomart server listening on port %s.', port);
    // });
    var server = app.listen(process.env.PORT || 8080, function () {
      var port = server.address().port;
      console.log("App now running on port", port);
    });
});
