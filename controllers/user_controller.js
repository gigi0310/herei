const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt');
const passport = require("passport");
const initializePassport = require("../passportConfig");
initializePassport(passport);
const pool = require('../models/db')

router.get('/users/register', (req, res) => {
    res.render('register.ejs')
});

router.get('/users/login', (req, res) => {
    res.render('login.ejs')
});

router.get('/users/playground', (req, res) => {
    res.render('playground.ejs', { user: req.user.name })
});

router.get('/users/logout', (req, res) => {
    req.logout();
    req.flash('success_msg', 'You have logged out')
    res.redirect('/users/login')
});

router.post(
    "/users/login",
    passport.authenticate("local", {
        successRedirect: "/users/playground",
        failureRedirect: "/users/login",
        failureFlash: true
    })
);

router.post('/users/register', async(req, res) => {
    let { name, email, password, password2 } = req.body;
    console.log({
        name,
        email,
        password,
        password2
    })
    let errors = [];
    //check all forms are entered
    if (!name || !email || !password || !password2) {
        errors.push({ message: "Please enter all fields" });
    }
    //check password length
    if (password.length < 6) {
        errors.push({ message: "Password must be a least 6 characters long" });
    }
    //check password is matched
    if (password !== password2) {
        errors.push({ message: "Passwords do not match" });
    }

    // if the error array has item inside, we will return to the login page and get an error 
    if (errors.length > 0) {
        res.render("register.ejs", { errors });
    } else {
        // form validation has passed
        //bycrpt
        let hashedPassword = await bcrypt.hash(password, 10); //10 is the convention default amount;
        console.log(hashedPassword);

        // query database to see the users is already exists or not
        pool.query(
            `SELECT * FROM users WHERE email = $1`, [email], (err, results) => {
                if (err) {
                    throw err
                }
                console.log(results.rows); // return a list containing the objects of the use in database
                if (results.rows.length > 0) {
                    errors.push({ message: "Email already register" });
                    res.render('register.ejs', { errors })

                } else { // we can register the user;

                    pool.query(
                        `INSERT INTO users (name, email, password_digest)
                            VALUES ($1, $2, $3)
                            RETURNING id, password_digest`, [name, email, hashedPassword],
                        (err, results) => {
                            if (err) {
                                throw err;
                            }
                            console.log(results.rows);
                            req.flash("success_msg", "You are now registered. Please verified your account by Email");
                            res.redirect("/users/login");
                        }
                    )
                }
            }
        )

    }
});

module.exports = router