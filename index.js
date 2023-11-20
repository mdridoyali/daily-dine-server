const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require('jsonwebtoken')
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

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
    const paymentCollection = client.db("DineDB").collection("payments");


    // JWT related api
    app.post('/jwt', async (req, res) => {
      const user = req.body
      // console.log('email',user)
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' })
      res.send({ token })
    })


    //middleware
    const verifyToken = (req, res, next) => {
      // console.log('inside verify token', req.headers.authorization)
      if (!req.headers.authorization) {
        return res.status(401).send({ message: 'unauthorize access' })
      }
      const token = req.headers.authorization.split(' ')[1]
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: 'unauthorize access' })
        }
        req.decoded = decoded
        next()
      })
    }

    // use verify admin after verifyToken
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email
      const query = { email: email }
      const user = await usersCollection.findOne(query)
      const isAdmin = user?.role === 'admin'
      if (!isAdmin) {
        return res.status(403).send({ message: 'forbidden access' })
      }
      next()
    }


    // users related api

    app.get('/user/admin/:email', verifyToken, async (req, res) => {
      const email = req.params.email
      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'forbidden access' })
      }
      const query = { email: email }
      const user = await usersCollection.findOne(query);
      let admin = false
      if (user) {
        admin = user?.role === 'admin'
      }
      res.send({ admin })
    })

    app.get('/users', verifyToken, verifyAdmin, async (req, res) => {
      // console.log(req.headers)
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

    app.patch('/users/admin/:id', verifyToken, verifyAdmin, async (req, res) => {
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

    app.delete('/users/:id', verifyToken, verifyAdmin, async (req, res) => {
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

    app.get('/menu/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await menuCollection.findOne(query)
      res.send(result)
    })

    app.post('/menu', verifyToken, verifyAdmin, async (req, res) => {
      const menuItem = req.body
      const result = await menuCollection.insertOne(menuItem)
      res.send(result)
    })
    app.delete('/menu/:id', verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await menuCollection.deleteOne(query)
      res.send(result)
    })

    app.patch('/menu/:id', async (req, res) => {
      const id = req.params.id
      const item = req.body
      const query = { _id: new ObjectId(id) }
      const updatedDoc = {
        $set: {
          name: item.name,
          price: item.price,
          category: item.category,
          recipe: item.recipe,
          image: item.image
        }
      }
      const result = await menuCollection.updateOne(query, updatedDoc)
      res.send(result)
    })


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

    // Payment intent
    app.get('/payment/:email', verifyToken, async(req, res)=>{
      const query = {email: req.params.email}
      if(req.params.email !== req.decoded.email){
        return res.status(403).send({message: 'forbidden access'})
      }
      const result = await paymentCollection.find(query).toArray();
      res.send(result)
    })

    app.post('/create-payment-intent', async (req, res) => {
      const { price } = req.body
      const amount = parseInt(price * 100);
      console.log(amount, ' amount')
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        payment_method_types: ['card']
      })
      res.send({
        clientSecret: paymentIntent.client_secret,
      })
    })

    app.post('/payments', async(req, res)=>{
      const payment = req.body;
      // console.log(payment)
      const paymentResult = await paymentCollection.insertOne(payment)
      // carefully delete ease item from the cart
      const query = {_id: {
         $in: payment.cartIds.map(id => new ObjectId(id))
      }}
      const deleteResult = await cartsCollection.deleteMany(query)
      res.send({paymentResult, deleteResult})
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







