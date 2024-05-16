require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require("mongoose");
const urlParser = require("url")
const dns = require("dns");

async function connectDb() {
  try {
   await mongoose.connect(process.env.db_url,{useNewUrlParser: true,useUnifiedTopology: true})
    console.log('MongoDB connected successfully')
  } catch (error) {
    console.log('MongoDB connection error:',error)
  }
}
connectDb()

const urlSchema = new mongoose.Schema(
  {
    // Define your schema fields
    original_url:String,
    short_url:Number
  }
)
const Urls = mongoose.model("url",urlSchema)
// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.post("/api/shorturl",function(req,res){
  const { url } = req.body;
  
  try {
    const parsedUrl = urlParser.parse(url);
    const hostname = parsedUrl.hostname;

    if (!hostname) {
      return res.json({ error: 'invalid url' });
    }

    dns.lookup(hostname, async (error, address) => {
      if (error || !address) {
        return res.json({ error: 'invalid url' });
      } else {
        try {
          const urlCount = await Urls.countDocuments({});
          const urlDoc = new Urls({
            url: url,
            short_url: urlCount + 1
          });
          
          const result = await urlDoc.save();
          console.log(result);
          res.json({ original_url: url, short_url: urlCount + 1 });
        } catch (err) {
          console.error(err);
          res.status(500).json({ error: 'Internal server error' });
        }
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});