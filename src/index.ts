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
    await mongoose.connect(`mongodb+srv://sushibrabodemais:8dSZECXOAT28RyuY@cluster0.arjlo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0` as string);
    console.log("Banco de dados conectado.");
  } catch (error) {
    console.log(error);
  }
});
