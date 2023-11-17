const express = require("express");
const cors = require("cors");
const jwt = require('jsonwebtoken')
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middle were
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.w9fev91.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );


    const usersCollection = client.db("DineDB").collection("users");
    const menuCollection = client.db("DineDB").collection("menu");
    const reviewsCollection = client.db("DineDB").collection("reviews");
    const cartsCollection = client.db("DineDB").collection("carts");

    // JWT related api
    app.post('/jwt', async (req, res) => {
      const user = req.body
      console.log('email',user)
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })

      res.send({ token })
    })



    // users related api

    app.get('/users', async (req, res) => {
      const result = await usersCollection.find().toArray()
      res.send(result)
    })

    app.post('/users', async (req, res) => {
      const user = req.body
      // insert email if user dose not exits 
      // you can do this many ways (1. email unique 2. upsert 3. simple checking)
      const query = { email: user?.email }
      const existingUser = await usersCollection.findOne(query)
      if (existingUser) {
        return res.send({ message: 'user already exists', insertedId: null })
      }
      const result = await usersCollection.insertOne(user)
      res.send(result)
    })

    app.patch('/users/admin/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
          role: 'admin'
        }
      }
      const result = await usersCollection.updateOne(query, updateDoc)
      res.send(result)

    })

    app.delete('/users/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await usersCollection.deleteOne(query)
      res.send(result)
    })










    // menu related api
    app.get("/menu", async (req, res) => {
      const result = await menuCollection.find().toArray();
      res.send(result);
    });

    app.get("/reviews", async (req, res) => {
      const result = await reviewsCollection.find().toArray();
      res.send(result);
    });

    app.get("/carts", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await cartsCollection.find(query).toArray();
      res.send(result);
    });

    // Carts  collection
    app.post("/carts", async (req, res) => {
      const cartItem = req.body;
      const result = await cartsCollection.insertOne(cartItem);
      res.send(result);
    });

    app.delete('/carts/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await cartsCollection.deleteOne(query)
      res.send(result)

    })


  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("dine is open");
});

app.listen(port, () => {
  console.log(`dine is open on port ${port}`);
});

// const express = require("express");
// const cors = require("cors");
// const jwt = require("jsonwebtoken");
// const cookieParser = require("cookie-parser");
// const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
// require("dotenv").config();
// const app = express();
// const port = process.env.PORT || 5000;

// // middle Ware
// app.use(
//   cors({
//     origin: ["http://localhost:5173"],
//     credentials: true,
//   })
// );
// app.use(express.json());
// app.use(cookieParser());

// const uri = `mongodb+srv://${process.env.DB_CAR_USER}:${process.env.DB_CAR_PASS}@cluster0.w9fev91.mongodb.net/?retryWrites=true&w=majority`;

// // Create a MongoClient with a MongoClientOptions object to set the Stable API version
// const client = new MongoClient(uri, {
//   serverApi: {
//     version: ServerApiVersion.v1,
//     strict: true,
//     deprecationErrors: true,
//   },
// });

// // jwt middlewares
// const logger = async (req, res, next) => {
//   console.log("called", req.host, req.originalUrl);
//   next();
// };
// const verifyToken = async (req, res, next) => {
//   const token = req.cookies?.token;
//   console.log("value of token in middleware", token);
//   if (!token) {
//     return res.status(401).send({ message: "unauthorized" });
//   }
//   jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
//     if (err) {
//       console.log(err);
//       return res.status(401).send({ message: "unauthorized" });
//     } //error

//     //if token is valid then it would be decoded
//     console.log("value in the token", decoded);
//     req.user = decoded;
//     next();
//   });
// };

// async function run() {
//   try {
//     // Connect the client to the server	(optional starting in v4.7)
//     // await client.connect();

//     const servicesCollection = client.db("carDoctor").collection("services");
//     const bookingCollection = client.db("carDoctor").collection("bookings");

//     // auth related api
//     app.post("/jwt", logger, async (req, res) => {
//       const user = req.body;
//       console.log(user);
//       const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
//         expiresIn: "10h",
//       });
//       res
//         .cookie("token", token, {
//           httpOnly: true,
//           secure: false,
//           // sameSite: "none",
//         })
//         .send({ success: true });
//     });

//     // user related api
//     app.get("/services", logger, async (req, res) => {
//       const result = await servicesCollection.find().toArray();
//       res.send(result);
//     });

//     app.get("/services/:id", async (req, res) => {
//       const id = req.params.id;
//       const query = { _id: new ObjectId(id) };
//       options = {
//         projection: { title: 1, price: 1, service_id: 1, img: 1 },
//       };
//       const result = await servicesCollection.findOne(query, options);
//       res.send(result);
//     });

//     app.get("/bookings", logger, verifyToken, async (req, res) => {
//       // console.log(req.query.email);
//       // console.log('token', req.cookies.token)
//       // console.log("user in the valid token", req.user);
//       if (req.query?.email !== req.user?.email) {
//         return res.status(403).send({ message: "forbidden access" });
//       }
//       let query = {};
//       if (req.query?.email) {
//         query = { email: req.query.email };
//       }
//       const result = await bookingCollection.find(query).toArray();
//       res.send(result);
//     });

//     // bookings
//     app.post("/bookings", async (req, res) => {
//       const booking = req.body;
//       console.log(booking);
//       const result = await bookingCollection.insertOne(booking);
//       res.send(result);
//     });

//     app.delete("/bookings/:id", async (req, res) => {
//       const id = req.params.id;
//       const query = { _id: new ObjectId(id) };
//       const result = await bookingCollection.deleteOne(query);
//       res.send(result);
//     });

//     app.patch("/bookings/:id", async (req, res) => {
//       const id = req.params.id;
//       const filter = { _id: new ObjectId(id) };
//       const updateItem = req.body;
//       const updateDoc = {
//         $set: {
//           status: updateItem.status,
//         },
//       };
//       console.log(updateDoc);
//       const result = await bookingCollection.updateOne(filter, updateDoc);
//       res.send(result);
//     });

//     // Send a ping to confirm a successful connection
//     await client.db("admin").command({ ping: 1 });
//     console.log(
//       "Pinged your deployment. You successfully connected to MongoDB!"
//     );
//   } finally {
//     // Ensures that the client will close when you finish/error
//     // await client.close();
//   }
// }
// run().catch(console.dir);

// app.get("/", (req, res) => {
//   res.send("doctor is running");
// });

// app.listen(port, () => {
//   console.log(`car doctor server is running on port ${port}`);
// });
