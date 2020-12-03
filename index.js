"use strict";

const express = require('express');
const app = express();
const mongoose = require('mongoose'); //mongodb
const cors = require('cors');
app.use(cors());
require('dotenv').config(); //environmentvar to store db credentials

// import modules
const coursesRoutes = require('./routes/courses');
const schedRoutes = require('./routes/schedules');

// ROUTES
app.use('/api/courses', coursesRoutes);
app.use('/api/schedules', schedRoutes);

// Connect to Mongo
mongoose.connect(process.env.MONGODB_URI, 
    { useNewUrlParser: true , useUnifiedTopology: true , useFindAndModify: false},
    () => console.log('Connected to DB!')
);

// Listen at port
app.listen(3000, () => console.log('Now listening on port 3000...'));