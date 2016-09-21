# Project Mongomart
## for M101JS: MongoDB for Node.js Developers, Mongo University
## Original author: Shannon Bradshaw

## How to Run this App
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
At mongomart directory, do:
```
mongoimport --drop -d mongomart -c item data/items.json
mongoimport --drop -d mongomart -c cart data/cart.json
```
Inside a mongo shell, verify the collections item and cart

```
node mongomart.js
```
Open localhost:3000 to view the mongomart app!
