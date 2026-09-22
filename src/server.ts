import express from "express";
import { z } from "zod";
import dotenv from 'dotenv';
dotenv.config();
const app = express();
const PORT =process.env.PORT

app.get("/",(req,res)=>{
    res.send("hello world")
})

app.listen(PORT, () => {
  console.log(`Server is Running http://localhost:${PORT}`);
});

app.use(express.json());