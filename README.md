# Project Mongomart
## for M101JS: MongoDB for Node.js Developers, Mongo University
### Original author: Shannon Bradshaw

## How to Run this App Locally
```
git clone https://github.com/zhangtreefish/mongomart.git
cd mongomart
npm install
```

Start a mongod process by:
```
mkdir mongo_server
mongod --dbpath mongo_server
```
At the mongomart directory, populate the collections as below:
```
mongoimport --drop -d mongomart -c item data/items.json
mongoimport --drop -d mongomart -c cart data/cart.json
```
Connect to the mongod by entering 'mongo' at another terminal;
Inside the mongo shell, verify the collections item and cart by:
```
use mongomart
db.item.find().pretty()
db.cart.find().pretty()
```
To view the mongomart app, enter the following at the mongomart
directory, and then open localhost:3000:

```
node mongomart.js
```
To run in development: (Windows): set DEBUG=express:* & node mongomart.js
