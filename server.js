const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

const app = require("./app");

const connectdb = require("./models/database");

app.get("/api", (req, res) => {
  try {
    console.log(res);
    res.json({ status: res.status, message: "welcome Beyinc backend" });
  } catch (err) {
    console.log(err);
  }
});

connectdb().then(() => {
  
  app.listen(process.env.PORT || 4000, () => {
    console.log(`Running at http://localhost:${process.env.PORT}/api`);
  });
});
////
