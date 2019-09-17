const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');
const path = require('path');
const session = require('express-session');
const accountRoutes = require('./routes/account');
const csrf = require('csurf');
const MongoDbStore = require('connect-mongodb-session')(session);
const flash = require('connect-flash');
const dbconnect = require('./utility/dbconnect');

const MONGODB_URI = dbconnect;

const app = express();

app.set('views', 'views');
app.set('view engine', 'ejs');


app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

const store = new MongoDbStore({
    uri: MONGODB_URI,
    collection: 'sessions'
});

app.use(
    session({
        secret: 'dom-dev',
        resave: false,
        saveUninitialized: false,
        store: store
    })
);
app.use(flash());
app.use(csrf());
app.use((req, res, next) => {
    const token = req.csrfToken();
    req.app.locals.csrfToken = token;
    next();
});

app.use(authRoutes);
app.use(accountRoutes);

mongoose
    .connect(MONGODB_URI, { useNewUrlParser: true })
    .then(result => {
        app.listen(3000);
        console.log('now listening on port ' + 3000);
    })
    .catch(err => {
        console.log(err);
    });
