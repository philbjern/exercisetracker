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
  console.log(user);
  res.json(user);
});

app.get("/api/users", async (req, res) => {
  console.log("** GET /api/users");
  let allUsers = await User.find();
  res.json(allUsers);
});

function formatDate(date) {
  return `${date.getDay()} ${date.getDay()} ${date.getMonth()} ${date.getFullYear()}`
}

app.post("/api/users/:id/exercises", async (req, res) => {
  try {
    let user = await User.findById(req.params.id);
    let username = user.username;
    const description = req.body.description;
    const duration = req.body.duration;
    let date = req.body.date
    if (date === 'Invalid Date' || date === undefined) {
      date = new Date().toDateString();
    } else {
      new Date(req.body.date).toDateString();
    }

    let exercise = new Exercise({
      username: user.username,
      description: description,
      duration: duration,
      date: date,
    });
    exercise.save();

    const response = {
      _id: user._id,
      username: user.username,
      description: exercise.description,
      duration: exercise.duration,
      date: date,
    }
    console.log(response)
    res.json(response);
  } catch (err) {
    console.error("User does not exist, " + err);
    res.status(500);
  }
});

app.get("/api/users/:id/logs", async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId)
    const exercises = await Exercise.find({ username: user.username });

    let logArray = exercises.forEach(exercise => {
      exercise.date = new Date(exercise.date).toDateString();
    })

    let response = {
      ...user.toObject(),
      count: exercises.length,
      log: logArray
    }
    res.json(response)
  } catch(err) {
    console.error(err);
    res.status(500);
  }


})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
