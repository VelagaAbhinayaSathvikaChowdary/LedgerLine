const path = require("path");
require("dotenv").config({
    path: path.resolve(__dirname, "../.env.test"),
    override: true,
    quiet: true
});

if (process.env.DB_NAME !== "ledgerline_test") {
    throw new Error("Tests must use ledgerline_test database");
}