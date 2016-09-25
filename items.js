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


var MongoClient = require('mongodb').MongoClient,
    assert = require('assert');


function ItemDAO(database) {
    "use strict";

    this.db = database;

    this.getCategories = function(callback) {
        "use strict";
        var categories = [];
        var sum_grand = 0;

        var cursor = this.db.collection('item').aggregate([
            {$match:{category:{$exists: true, $ne: null}}},
            {$group:{_id:"$category", num: { $sum:1}}},
            {$sort:{_id:1}}
        ]);

        cursor.toArray(function(err, docs) {
            if(err) throw err;
            var sum_category = docs.length;
            for (var i = 0; i< sum_category; i++) {
                categories.push(docs[i]);
                sum_grand += docs[i].num;
            }

             var CATEGORY_ALL = {
                _id: "All",
                num: sum_grand
            };

            categories.unshift(CATEGORY_ALL);
            categories.sort(function(a,b) {
                return a["_id"].localeCompare(b["_id"]);
            });

            callback(categories);
        });
    }


    this.getItems = function(category, page, itemsPerPage, callback) {
        "use strict";

        var pageItems = [];
        var query = {};

        if (category !== "All") {
            query = {category: category};
        }
        var cursor = this.db.collection('item').find(query)
            .sort({_id: 1})
            .skip(page*itemsPerPage)
            .limit(itemsPerPage)
        cursor.forEach (
            function(doc) {
                pageItems.push(doc);
            },
            function(err) {
                assert.equal(err, null);
            }
        );

        callback(pageItems);
    }


    this.getNumItems = function(category, callback) {
        "use strict";

        var numItems = 0;
        var query = {};  //if category is "All" or unspecified

        if (category !== "All") {
            query = {category: category};
        }
        this.db.collection('item').find(query)
            .toArray(function(err, docs) {
                if(err) throw err;
                numItems = docs.length;
                callback(numItems);
            });
     }


    this.searchItems = function(query, page, itemsPerPage, callback) {
        "use strict";

        var searchItemArray = [];
        var cursor = this.db.collection('item').find({$text:{$search: query}})
            .skip(page*itemsPerPage).limit(itemsPerPage);
        cursor.forEach(
            function(doc) {
                searchItemArray.push(doc);
            },
            function(err) {
                assert.equal(err, null);
            }
        );

        callback(searchItemArray);
    }


    this.getNumSearchItems = function(query, callback) {
        "use strict";

        var numSearchItems = 0;
        this.db.collection('item').find({$text:{$search: query}})
            .toArray(function(err, docs) {
                if(err) throw err;
                numSearchItems = docs.length;
                callback(numSearchItems);
        });
    }


    this.getItem = function(itemId, callback) {
        "use strict";

        var cursor = this.db.collection('item').find({_id: itemId});
        var item = null;
        cursor.toArray(function(err, docs) {
            if(err) throw err;
            item = docs[0];
            callback(item);  //if called outside toArray: item null
        });
    }


    this.getRelatedItems = function(callback) {
        "use strict";

        this.db.collection("item").find({})
            .limit(4)
            .toArray(function(err, relatedItems) {
                assert.equal(null, err);
                callback(relatedItems);
            });
    };


    this.addReview = function(itemId, comment, name, stars, callback) {
        "use strict";

        /*
         * TODO-lab4
         *
         * LAB #4: Implement addReview().
         *
         * Using the itemId parameter, update the appropriate document in the
         * "item" collection with a new review. Reviews are stored as an
         * array value for the key "reviews". Each review has the fields:
         * "name", "comment", "stars", and "date".
         *
         */

        var reviewDoc = {
            name: name,
            comment: comment,
            stars: stars,
            date: Date.now()
        }

        // TODO replace the following two lines with your code that will
        // update the document with a new review.
        var doc = this.createDummyItem();
        doc.reviews = [reviewDoc];

        // TODO Include the following line in the appropriate
        // place within your code to pass the updated doc to the
        // callback.
        callback(doc);
    }


    this.createDummyItem = function() {
        "use strict";

        var item = {
            _id: 1,
            title: "Gray Hooded Sweatshirt",
            description: "The top hooded sweatshirt we offer",
            slogan: "Made of 100% cotton",
            stars: 0,
            category: "Apparel",
            img_url: "/img/products/hoodie.jpg",
            price: 29.99,
            reviews: []
        };

        return item;
    }
}


module.exports.ItemDAO = ItemDAO;
