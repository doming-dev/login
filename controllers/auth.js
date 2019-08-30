const bcrypt = require('bcryptjs');
const User = require('../models/user');
const sendgrid = require('nodemailer-sendgrid-transport');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const transporter = nodemailer.createTransport(
    sendgrid({
        auth: {
            api_key:
                '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'
        }
    })
);

exports.getLogin = (req, res, next) => {
    res.render('login', {
        error: req.flash('error')
    });
};

exports.postLogin = async (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const user = await User.findOne({ email: email });
    if (user) {
        const result = await bcrypt.compare(password, user.password);
        if (!result) {
            req.flash('error', 'Wrong email or password');
            res.redirect('/login');
        } else {
            req.session.isAuthorized = true;
            req.session.user = user;
            res.render('account', {
                user: user
            });
        }
    } else {
        console.log('no user found');
        req.flash('error', 'Wrong email or password');
        res.redirect('/login');
    }
};

exports.getSignup = (req, res, next) => {
    res.render('signup', {
        error: req.flash('error')
    });
};

exports.postSignup = async (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;

    if (confirmPassword !== password) {
        req.flash('error', 'Passwords do not match');
        res.redirect('/signup');
    } else {
        const user = await User.findOne({ email: email });
        if (user) {
            //already exists
            req.flash('error', 'This email already exists');
            res.redirect('/signup');
        } else {
            // encrypt password and save
            const hashedPassword = await bcrypt.hash(password, 12);
            const newUser = new User({
                email: email,
                password: hashedPassword
            });

            const result = await newUser.save();
            transporter.sendMail({
                from: 'npm-operations@gmail.com',
                to: newUser.email,
                subject: 'Thank you for Signing Up!',
                html: `<h1>You are now registered with us. Thank you for signing up.</h1>`
            });

            res.redirect('/login');
        }
    }
};

exports.getSignout = (req, res, next) => {
    const userId = req.params.userId;
    if (userId) {
        req.session.destroy(result => {
            res.redirect('/login');
        });
    } else {
        res.redirect('/login');
    }
};

exports.getResetPassword = (req, res, next) => {
    res.render('reset-password');
};

exports.postResetPassword = async (req, res, next) => {
    crypto.randomBytes(32, (error, buffer) => {
        const token = buffer.toString('hex');

        const email = req.body.email;
        User.findOne({ email: email }).then(user => {
            if (user) {
                user.resetToken = token;
                user.resetTokenExpiration = Date.now() + 3600000;
                user.save().then(result => {
                    res.redirect('/');
                    transporter
                        .sendMail({
                            to: user.email,
                            from: 'node@operations.com',
                            subject: 'Reset Password',
                            html: `
                        <p> You requested a password reset.</p>
                        <p><a href="http://localhost:3000/new-password/${token}">Click here</a> to reset your password</p>`
                        })
                        .catch(err => {
                            console.log(err);
                        });
                });
            }
            else {
                req.flash('reset', 'Email was not found in our database');
            }
        })
        .catch(err => {
            console.log(err);
        });
    });
};

exports.getNewPassword = async (req, res, next) => {
    const token = req.params.token;
    const error = req.flash('error');

    const user = await User.findOne({
        resetToken: token,
        resetTokenExpiration: { $gt: Date.now() }
    });
    if (user != null) {
        res.render('new-password', {
            userId: user._id.toString(),
            userToken: token,
            error: error
        });
    } else {
        res.render('/reset-password');
    }
};

exports.postNewPassword = (req, res, next) => {
    const newPassword = req.body.newPassword;
    const newPasswordConfirmation = req.body.newPasswordConfirmation;
    const userId = req.body.userId;
    const token = req.body.userToken;
    let resetUser;


    if (newPassword === newPasswordConfirmation) {    
        User.findOne({
            resetToken: token,
            _id: userId,
            resetTokenExpiration: { $gt: Date.now()}
        })
        .then(user => {
            if(user){
                console.log(user.email);            
                resetUser = user;
                return bcrypt.hash(newPassword, 12);
            }
        })
        .then(hashedPassword => {
            resetUser.password = hashedPassword;
            resetUser.resetToken = undefined;
            resetUser.resetTokenExpiration = undefined;
            return resetUser.save();
        })
        .then(result => {
            res.redirect('/login');
        })
        .catch(err => {
            console.log(err);
        });
    }
    else{
        req.flash('error', 'New password & confirm password do not match.');
        res.redirect(`/new-password/${token}`);
    }
};
