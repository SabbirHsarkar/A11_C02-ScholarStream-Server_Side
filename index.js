
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express= require('express');
const cors= require('cors');
require('dotenv').config();

const port =process.env.PORT || 5000 ;

const app=express();
app.use(cors());
app.use(express.json());

const admin = require("firebase-admin");
const decoded = Buffer.from(process.env.FB_SERVICE_KEY, 'base64').toString('utf8')
const serviceAccount = JSON.parse(decoded);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});



const verifyFBToken= async(req,res,next)=>{
  const token=req.headers.authorization;

  if(!token){
    return res.status(401).send({message:'Unauthorized access'})
  }
try{
const idToken=token.split(' ')[1]
const decoded=await admin.auth().verifyIdToken(idToken)
console.log("decoded",decoded);
req.decoded_email=decoded.email;
next();

}
catch(error){
return res.status(401).send({message:'Unauthorized access'})
}

}

const verifyAdmin = async (req, res, next) => {
  const email = req.decoded_email;

  const user = await userCollections.findOne({ email });

  if (!user || user.role !== "admin") {
    return res.status(403).send({ message: "Forbidden access" });
  }

  next();
};









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
    const scholarshipsCollection = database.collection('scholarships')

    app.post('/users',async(req,res)=>{
      const userInfo=req.body
     
      userInfo.createdAt = new Date();

      const result= await userCollections.insertOne(userInfo)
      res.send(result);

    })
 

    app.get('/users',verifyFBToken,async(req,res)=>{
     
      const result= await userCollections.find().toArray();
      res.status(200).send(result);

    })

    app.patch('/users/role/:id', verifyFBToken, async (req, res) => {
  const id = req.params.id;
  const { role } = req.body;

  const filter = { _id: new ObjectId(id) };
  const updateDoc = {
    $set: { role },
  };

  const result = await userCollections.updateOne(filter, updateDoc);
  res.send(result);
});





    app.get('/users/role/:email',async(req,res)=>{
      const{email} = req.params;

      const query = { email: email };
  const result = await userCollections.findOne(query);

  console.log("User Found:", result);
  res.send(result);
      
    })

    //ScholarShip

    app.post('/scholarships',verifyFBToken,async(req,res)=>{
      const data=req.body;
      data.createdAt=new Date();
      const result= await scholarshipsCollection.insertOne(data)
      res.send(result)
    });


   app.get('/scholarships', async (req, res) => {
  try {
    const result = await scholarshipsCollection.find({}).toArray();
    res.send(result);
  } catch (err) {
    console.log(err);
  }
});


    app.get('/manage/scholarship/:email',async(req,res)=>{
      const email=req.params.email;
      const query= {userEmail : email}
      const result =await scholarshipsCollection.find(query).toArray()
      res.send(result)
    })

    //Manage Scholarship

  // Delete
app.delete('/scholarships/:id', async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) }; 
  const result = await scholarshipsCollection.deleteOne(query);
  res.send(result);
});


app.put('/scholarships/:id', async (req, res) => {
  const id = req.params.id;
  const updatedData = req.body;

  const filter = { _id: new ObjectId(id) };
  const updateDoc = {
    $set: updatedData,
  };

  const result = await scholarshipsCollection.updateOne(filter, updateDoc);
  res.send(result);
});


// Get Single Scholarship by ID
app.get('/scholarships/:id', async (req, res) => {
  const id = req.params.id;

  
    const query = { _id: new ObjectId(id) };
    const result = await scholarshipsCollection.findOne(query);

    if (!result) {
      return res.status(404).send({ message: "Not found" });
    }

    res.send(result);
  
  })


  //All Users delete

  app.delete('/users/:id', verifyFBToken,verifyAdmin, async (req, res) => {
  const id = req.params.id;

  const query = { _id: new ObjectId(id) };
  const result = await userCollections.deleteOne(query);

  res.send(result);
});



  
    
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