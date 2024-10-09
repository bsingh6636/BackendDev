import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import mongoConnection from './dbConnection.js';
import { config } from 'dotenv';
import resumeRouter from './portfolio/routers/portfolioRouter.js'

config({
  path: './config.env'
})
const app = express();
app.use(cors({
  origin: '*'
}));
app.use(bodyParser.json());


app.use('/api', resumeRouter)
mongoConnection()
  .then(() => {
    console.log('Database connected')
  })
  .catch((err) => console.log(err));  
  const PORT = process.env.PORT
  app.listen(PORT, () => {
    console.log(`Server listening on PORTS ${PORT}`)
})
