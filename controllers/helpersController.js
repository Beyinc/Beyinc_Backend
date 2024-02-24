const fetch = require("node-fetch");
exports.allColleges = async (req, res, next) => {
  try {
    const result = await fetch(
      `http://universities.hipolabs.com/search?name=${req.body.name}`,
      {
        method: "GET",
      }
    );
    const data = await result.json();
    return res.status(200).json({ college: data });
  } catch (err) {
    console.log(err);
    return res.status(400).json(err);
  }
};
