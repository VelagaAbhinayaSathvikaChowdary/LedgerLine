const app = require("./src/app");

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`LedgerLine server running on port ${PORT}`);
});

server.on("close", () => {
    console.log("SERVER CLOSED");
});

server.on("error", (error) => {
    console.error("SERVER ERROR:", error);
});