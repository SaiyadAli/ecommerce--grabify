const express = require('express')
const path = require('path')
require('dotenv').config()
const app = express();
const PORT = process.env.PORT ||3001
const userRoutes = require('./routes/user')
const adminRoutes= require('./routes/admin');
const connectDB = require('./db/connectDB');
const session = require('express-session');
const nocache = require('nocache')
const passport = require('passport');
require('./config/passport'); // Import Passport configuration

app.use(nocache())
app.use(session({secret: process.env.SESSION_SECRET || 'your_secret_key',
    resave:false,
    saveUninitialized:true,
    cookie:{
        maxAge:1000*60*60*24
    }
}))

app.use(passport.initialize());
app.use(passport.session());

app.set('views', path.join(__dirname, 'views'));
app.set('view engine','ejs')
app.use(express.static('public'))
app.use(express.urlencoded({extended:true}))
app.use(express.json())


app.use('/user', userRoutes);
app.use('/admin',adminRoutes)


connectDB();
app.listen(PORT,()=>console.log(`Server is running  on  port :${PORT}`));