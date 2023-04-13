const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const routes = require("./routes/apiRoutes");

const app = express();

// Set up middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose
  .connect("DataBase url", { useNewUrlParser: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((error) => console.error(error));

// Set up API routes
app.use("/api", routes);

// Start the server
app.listen(3000, () => console.log("Server listening on port 3000"));
