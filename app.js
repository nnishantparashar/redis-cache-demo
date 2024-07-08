require("dotenv").config();
const express = require('express');
const axios = require('axios');
const { createClient } = require('redis');
const responseTime = require('response-time');
const { promisify} = require('util');


const app = express();
app.use(responseTime());

const client = createClient({
    password: process.env.REDIS_PASS,
    socket: {
        host: process.env.REDIS_URL,
        port: process.env.REDIS_PORT
    }
});

client.on('ready', () => {
    console.log('redis is connected');
  });
  
  client.on('error', (err) => {
    console.log('redis is disconnected: ', err);
  });
  
//   (async () => {
//     try {
//       await client.connect();
//     } catch (error) {
//       console.error('error while connecting redis', error);
//     }
//   })();

const GET_ASYNC = promisify(client.get).bind(client);
const SET_ASYNC = promisify(client.set).bind(client);



app.get('/rockets', async(req, res, next) =>{
    try {
        const reply = await GET_ASYNC('rockets');
        if (reply) {
            console.log("Saved data cached.")
            res.send(JSON.parse(reply));
            return
        }
        const response = await axios.get('https://api.spacexdata.com/v3/rockets');
        const saveResult = await SET_ASYNC('rockets', JSON.stringify(response.data), 'EX', 10);
        console.log("New data cached.");
        res.send(response.data);
    } catch (err) {
        res.send(err.message);
    }  
});

app.get('/rockets/:rocket_id', async(req, res, next) =>{

    try {
        const reply = await GET_ASYNC('rocket');
        if (reply) {
            console.log("Saved data cached.");
            res.send(JSON.parse(reply));
            return
        }
        const response = await axios.get(`https://api.spacexdata.com/v3/rockets/${req.params.rocket_id}`);
        const savedData = await SET_ASYNC('rocket', JSON.stringify(response.data), 'EX', 10);
        console.log("New data cached.");
        res.send(response.data);
    } catch (err) {
        res.send(err.message);
    }

});


app.listen(5000, () => console.log('App is running on port 5000'));