const Accelerator = require("./Accelerator");
const Corporate = require("./Corporate");
const Entrepreneur = require("./Entrepreneur");
const GovernmentBody = require("./GovtBody");
const Incubator = require("./Incubator");
const IndividualInvestor = require("./Individual-Investor");
const InstituteInvestor = require("./Institutional-Investor");
const Mentor = require("./Mentor");
const Startup = require("./Startup");
const TechPartner = require("./Tech-Partner");
const TradeBody = require("./TradeBodies");

const jobTitles = {
  "Enterpreneur": Entrepreneur,
  Startup,
  Mentor,
  Incubator,
  Accelerator,
  "Individual Investor": IndividualInvestor,
  "Institutional Investor": InstituteInvestor,
  "Trade Bodies": TradeBody,
  "Government Body": GovernmentBody,
  Corporate,
  "Technology Partner": TechPartner,
};
module.exports = jobTitles;
