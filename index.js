require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require("mongoose");
const urlParser = require("url")
const dns = require("dns");

async function connectDb() {
  try {
    await mongoose.connect(process.env.db_url, { useNewUrlParser: true, useUnifiedTopology: true })
    console.log('MongoDB connected successfully')
  } catch (error) {
    console.log('MongoDB connection error:', error)
  }
}
connectDb()

const urlSchema = new mongoose.Schema(
  {
    original_url: String,
    short_url: Number
  }
)
const Urls = mongoose.model("url", urlSchema)
// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

app.post("/api/shorturl", function (req, res) {
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
            original_url: url,
            short_url: urlCount + 1
          });

          const result = await urlDoc.save();
          res.json({original_url: url,short_url: urlCount + 1 });
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

app.get("/api/shorturl/:short_url", async function (req, res) {
  const shortUrl = Number(req.params.short_url);
  let urlDoc
  try {
    if (isNaN(shortUrl)) {
      return res.status(400).json({ error: 'Invalid short_url parameter' });
    }else {
      urlDoc = await Urls.findOne({short_url:shortUrl});
      res.redirect(urlDoc.original_url);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
})

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});