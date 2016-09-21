# Project Mongomart
## for M101JS: MongoDB for Node.js Developers, Mongo University
## Original author: Shannon Bradshaw

## How to Run this App
1.
```
git clone https://github.com/zhangtreefish/mongomart.git
```
2.
```
cd mongomart
npm install
```

3.
start a mongod process by:
```
  mkdir mongo_server
  mongod --dbpath mongo_server
```
At mongomart directory, do:
```
  mongoimport --drop -d mongomart -c item data/items.json
  mongoimport --drop -d mongomart -c cart data/cart.json
```
inside a mongo shell, verify the collections item and cart

4.
```
node mongomart.js
```
   open localhost:3000


