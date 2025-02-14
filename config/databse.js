const mongoose = require("mongoose");

exports.connectToDb = async () => {
  try {
    mongoose.connect(process.env.MONGO_URL),
      console.log("connected to databas");
  } catch (error) {
    console.log("Something went Wrong in Database");
  }
};
    