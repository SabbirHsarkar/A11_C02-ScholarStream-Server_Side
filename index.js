
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express= require('express');
const cors= require('cors');
require('dotenv').config();

const port =process.env.PORT || 5000 ;

const stripe = require('stripe')(process.env.STRIPE_SECRET);
const crypto =require('crypto');

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

    //Database Collection

    const database= client.db('scholarstream')
    const userCollections = database.collection('user')
    const scholarshipsCollection = database.collection('scholarships')
    const applicationsCollection = database.collection("applications");
    const reviewsCollection = database.collection("reviews");


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


//    app.get('/scholarships', async (req, res) => {
//   try {
//     const result = await scholarshipsCollection.find({}).toArray();
//     res.send(result);
//   } catch (err) {
//     console.log(err);
//   }
// });

//Search Scholarship

// app.get("/scholarships", async (req, res) => {
//   try {
//     const { search, country, sort } = req.query;

//     let query = {};

//     // Search (Scholarship Name / University Name / Degree)
//     if (search) {
//       query.$or = [
//         { scholarshipName: { $regex: search, $options: "i" } },
//         { universityName: { $regex: search, $options: "i" } },
//         { degree: { $regex: search, $options: "i" } },
//       ];
//     }

//     // Filter by Country
//     if (country) {
//       query.country = country;
//     }

 
  

//     // Sorting
//     let sortOption = {};
//     if (sort === "fee_asc") sortOption.applicationFees = 1;
//     if (sort === "fee_desc") sortOption.applicationFees = -1;
//     if (sort === "date_asc") sortOption.createdAt = 1;
//     if (sort === "date_desc") sortOption.createdAt = -1;

//     const result = await scholarshipsCollection
//       .find(query)
//       .sort(sortOption)
//       .toArray();

//     res.send(result);
//   } catch (err) {
//     console.log(err);
//     res.status(500).send({ message: "Server error" });
//   }
// });

//Search , Filter, pagination
app.get("/scholarships", async (req, res) => {
  try {
    const {
      search,
      country,
      sort,
      page = 1,
      limit = 6,
    } = req.query;

    let query = {};

    // Search
    if (search) {
      query.$or = [
        { scholarshipName: { $regex: search, $options: "i" } },
        { universityName: { $regex: search, $options: "i" } },
        { degree: { $regex: search, $options: "i" } },
      ];
    }

    //  Country filter
    if (country) {
      query.country = country;
    }

    // ↕ Sort
    let sortOption = {};
    if (sort === "fee_asc") sortOption.applicationFees = 1;
    if (sort === "fee_desc") sortOption.applicationFees = -1;
    if (sort === "date_asc") sortOption.createdAt = 1;
    if (sort === "date_desc") sortOption.createdAt = -1;

    const skip = (Number(page) - 1) * Number(limit);

    const scholarships = await scholarshipsCollection
      .find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit))
      .toArray();

    const total = await scholarshipsCollection.countDocuments(query);

    res.send({
      scholarships,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: "Server error" });
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


//Analytics
app.get("/analytics", verifyFBToken, async (req, res) => {
  try {
    // Total Users
    const totalUsers = await userCollections.countDocuments();

    // All scholarships
    const scholarships = await scholarshipsCollection.find().toArray();
    const totalScholarships = scholarships.length;

    // Total Fees
    const totalFees = scholarships.reduce((sum, s) => sum + (s.applicationFees || 0), 0);

    // University-wise application counts
    const chartDataMap = {};
    for (const scholarship of scholarships) {
      const count = await applicationsCollection.countDocuments({ scholarshipId: scholarship._id });
      const key = scholarship.universityName || "Unknown";
      chartDataMap[key] = (chartDataMap[key] || 0) + count;
    }
    const chartData = Object.keys(chartDataMap).map((key) => ({
      name: key,
      applications: chartDataMap[key],
    }));

    // Category-wise application counts
    const chartDataCategoryMap = {};
    for (const scholarship of scholarships) {
      const count = await applicationsCollection.countDocuments({ scholarshipId: scholarship._id });
      const key = scholarship.scholarshipCategory || "Unknown";
      chartDataCategoryMap[key] = (chartDataCategoryMap[key] || 0) + count;
    }
    const chartDataCategory = Object.keys(chartDataCategoryMap).map((key) => ({
      name: key,
      applications: chartDataCategoryMap[key],
    }));

    res.send({
      totalUsers,
      totalFees,
      totalScholarships,
      chartData,          // University-wise
      chartDataCategory,  // Category-wise
    });
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: "Server error" });
  }
});




//Moderator Section


// GET: All Applications for moderator

app.get("/applications", verifyFBToken, async (req, res) => {
  try {
    const email = req.decoded_email;

    // Check if user 
    const user = await userCollections.findOne({ email });
    if (!user || user.role !== "moderator") {
      return res.status(403).send({ message: "Forbidden access" });
    }

    const applications = await applicationsCollection.find().toArray();
    res.send(applications);
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: "Server error" });
  }
});

// PATCH: Update Feedback

app.patch("/applications/feedback/:id", verifyFBToken, async (req, res) => {
  const id = req.params.id;
  const { feedback } = req.body;

  try {
    const result = await applicationsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { feedback } }
    );

    if (result.modifiedCount > 0) {
      res.send({ success: true, message: "Feedback updated" });
    } else {
      res.status(400).send({ success: false, message: "Could not update feedback" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send({ success: false, message: "Server error" });
  }
});


// PATCH: Update Status

app.patch("/applications/status/:id", verifyFBToken, async (req, res) => {
  const id = req.params.id;
  const { status } = req.body;

  const validStatuses = ["pending", "processing", "completed", "rejected"];
  if (!validStatuses.includes(status)) {
    return res.status(400).send({ success: false, message: "Invalid status" });
  }

  try {
    const result = await applicationsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { applicationStatus: status } }
    );

    if (result.modifiedCount > 0) {
      res.send({ success: true, message: `Status updated to ${status}` });
    } else {
      res.status(400).send({ success: false, message: "Could not update status" });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send({ success: false, message: "Server error" });
  }
});





//Student Application
app.post("/applications", async (req, res) => {
  const application = req.body;
  application.applicationStatus = "pending";   
  application.paymentStatus = "unpaid"; 
  const result = await applicationsCollection.insertOne(application);
  res.send(result);
});

//get my-application

app.get("/applications/my", verifyFBToken, async (req, res) => {
  const email = req.decoded_email; 
  const result = await applicationsCollection
    .find({ userEmail: email }) 
    .toArray();
  res.send(result);
});


//delete
app.delete("/applications/:id", verifyFBToken, async (req, res) => {
  const id = req.params.id;
  const email = req.decoded_email; 

  const result = await applicationsCollection.deleteOne({
    _id: new ObjectId(id),
    userEmail: email,
    applicationStatus: "pending"
  });

  res.send(result);
});


//payments

app.post("/create-payment-checkout", async (req, res) => {
  try {
    const { totalAmount, applicationId, userEmail } = req.body;

    const amount = Number(totalAmount);
    if (isNaN(amount) || amount <= 0) {
      return res.status(400).send({ message: "Invalid totalAmount" });
    }

    if (!userEmail || typeof userEmail !== "string") {
      return res.status(400).send({ message: "Invalid userEmail" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: userEmail,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Scholarship Application Fee",
            },
            unit_amount: Math.round(amount * 100), 
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.CLIENT_URL}/dashboard/payment-success/${applicationId}`,
      cancel_url: `${process.env.CLIENT_URL}/payment-failed`,
    });

    res.send({ url: session.url });
  } catch (error) {
    console.error("Stripe Error:", error);
    res.status(500).send({ message: error.message });
  }
});





//DB route
app.patch("/applications/payment/:id", async (req, res) => {
  const id = req.params.id;

  const result = await applicationsCollection.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        paymentStatus: "paid",
        paidAt: new Date(),
      },
    }
  );

  res.send(result);
});




// Add Review
app.post("/reviews", verifyFBToken, async (req, res) => {
  const {
    scholarshipId,
   scholarshipName,
    universityName,
    userName,
    userEmail,
    userImage,
    ratingPoint,
    reviewComment,
  } = req.body;

  if (!scholarshipId || !userEmail || !ratingPoint || !reviewComment) {
    return res.status(400).send({ success: false, message: "Missing required fields" });
  }

  const review = {

    scholarshipId,
    scholarshipName,
    universityName,
    userName,
    userEmail,
    userImage: userImage || "",
    ratingPoint,
    reviewComment,
    reviewDate: new Date(),
  };

  try {
    const result = await reviewsCollection.insertOne(review);
    res.send({ success: true, message: "Review added successfully", data: result });
  } catch (err) {
    console.log(err);
    res.status(500).send({ success: false, message: "Server error" });
  }
});



// Get Reviews by Scholarship
app.get("/reviews/:scholarshipId", async (req, res) => {
  const { scholarshipId } = req.params;
  try {
    const reviews = await reviewsCollection.find({ scholarshipId }).toArray();
    res.send(reviews);
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: "Server error" });
  }
});



//My Review
//fetch all user
app.get("/reviews/user/:email", verifyFBToken, async (req, res) => {
  const { email } = req.params;
  try {
    const reviews = await reviewsCollection.find({ userEmail: email }).toArray();
    res.send(reviews);
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: "Server error" });
  }
});




//update


app.patch("/reviews/:id", verifyFBToken, async (req, res) => {
  const { id } = req.params;
  const { ratingPoint, reviewComment } = req.body;

  try {
    const result = await reviewsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { ratingPoint, reviewComment, updatedAt: new Date() } }
    );
    if(result.modifiedCount > 0){
      res.send({ success: true, message: "Review updated" });
    } else {
      res.status(400).send({ success: false, message: "Could not update" });
    }
  } catch(err){
    console.log(err);
    res.status(500).send({ success: false, message: "Server error" });
  }
});

//Delete

app.delete("/reviews/:id", verifyFBToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await reviewsCollection.deleteOne({ _id: new ObjectId(id) });
    res.send(result);
  } catch(err){
    console.log(err);
    res.status(500).send({ message: "Server error" });
  }
});


//Moderator- All Review

// Get all reviews (moderator only)
app.get("/reviews", verifyFBToken, async (req, res) => {
  const email = req.decoded_email;
  try {
    const user = await userCollections.findOne({ email });
    if (!user || user.role !== "moderator") {
      return res.status(403).send({ message: "Forbidden access" });
    }

    const reviews = await reviewsCollection.find().toArray();
    res.send(reviews);
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: "Server error" });
  }
});







//

  
    
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