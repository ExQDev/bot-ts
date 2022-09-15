// @flow
import dotenv from 'dotenv'
import { MongoClient } from 'mongodb'

dotenv.config();

const uri = `mongodb+srv://${process.env.atlasuser}:${process.env.atlaspass}@cluster0-zvexx.mongodb.net/latte?retryWrites=true&w=majority&appName=${process.env.atlasAppId}:mongodb-atlas:api-key`;

const client = new MongoClient(uri, { 
  // useNewUrlParser: true,
  // useUnifiedTopology: true
});

export default client


export const connection = (await client.connect()).db('latte')