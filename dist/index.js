import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import routes from "./routers/router.js";
const app = express();
dotenv.config();
app.use(routes);
app.listen(4500, async () => {
    console.log("Servidor iniciado na porta 4500");
    try {
        await mongoose.connect(process.env.API_KEY_MONGODB);
        console.log("Banco de dados conectado.");
    }
    catch (error) {
        console.log(error);
    }
});
//# sourceMappingURL=index.js.map