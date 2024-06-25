const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();

app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.use("/public", express.static(`${process.cwd()}/public`));

let mongoose = require("mongoose");
console.log("connecting to mongodb @ " + process.env.MONGO_URI);

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

let ExerciseSchema = new mongoose.Schema({
  username: String,
  description: String,
  duration: Number,
  date: Date,
});
let Exercise = mongoose.model("exercises", ExerciseSchema);

let UserSchema = new mongoose.Schema({
  username: String,
});
let User = mongoose.model("users", UserSchema);

let LogSchema = new mongoose.Schema({
  username: String,
  count: Number,
  log: [
    {
      description: String,
      duration: Number,
      date: Date,
    },
  ],
});
let Log = mongoose.model("logs", LogSchema);

let now = new Date().toDateString();

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));

const ERROR_RESPONSE = { error: "Error" };

app.post("/api/users", (req, res) => {
  console.log("** POST /api/users");
  let username = req.body.username;
  if (username == undefined) {
    console.error("Username undefined");
    res.status(500).errored("Username undefined");
  }

  let user = new User({ username: username });
  user.save();

  res.json(user);
});

app.get("/api/users", async (req, res) => {
  console.log("** GET /api/users");
  let allUsers = await User.find();
  res.json(allUsers);
});

app.post("/api/users/:id/exercises", (req, res) => {
  try {
    let user = User.findById(req.params.id);
    let username = user.username;
    const description = req.body.description;
    const duration = req.body.duration;
    let date = req.body.date;

    if (date == undefined) {
      date = new Date().toDateString();
    }

    let exercise = new Exercise({
      username: username,
      description: description,
      duration: duration,
      date: date,
    });
    exercise.save();

    res.json(exercise);
  } catch (err) {
    console.error("User does not exist");
    res.errored();
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
