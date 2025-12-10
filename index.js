const express= require('express');
const cors= require('cors');
require('dotenv').config();

const port =process.env.PORT || 5000 ;

const app=express();
app.use(cors());
app.use(express.json());



const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = process.env.URI;


const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
   
    await client.connect();

    const database= client.db('scholarstream')
    const userCollections = database.collection('user')

    app.post('/users',async(req,res)=>{

      const userInfo=req.body
      userInfo.role="Student"
      userInfo.createdAt = new Date();

      const result= await userCollections.insertOne(userInfo)
      res.send(result);

    })


    app.get('/users/role/:email',async(req,res)=>{
      const{email} = req.params;


  const query = { email: email };
  const result = await userCollections.findOne(query);

  console.log("User Found:", result);
  res.send(result);
      
    })
    
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/',(req,res)=>{
    res.send("Hello, Sabbir")
})

app.listen(port,()=>{
    console.log(`server is going on ${port}`);
    
})