const express = require("express");
const passport = require('passport');
const authRoutes = express.Router();
const User = require("../models/User");
const nodemailer = require('nodemailer');
// Bcrypt to encrypt passwords
const bcrypt = require("bcrypt");
const bcryptSalt = 10;


authRoutes.get("/login", (req, res, next) => {
  res.render("auth/login", {
    "message": req.flash("error")
  });
});

authRoutes.post("/login", passport.authenticate("local", {
  successRedirect: "/",
  failureRedirect: "/auth/login",
  failureFlash: true,
  passReqToCallback: true
}));

authRoutes.get("/signup", (req, res, next) => {
  res.render("auth/signup");
});

authRoutes.post("/signup", (req, res, next) => {
  const {
    username,
    password,
    email
  } = req.body;
  const rol = req.body.role;
  console.log(username, password, email)
  if (username === "" || password === "") {
    res.render("auth/signup", {
      message: "Indicate username and password"
    });
    return;
  }

  User.findOne({
    username
  }, "username", (err, user) => {
    if (user !== null) {
      res.render("auth/signup", {
        message: "The username already exists"
      });
      return;
    }

    const salt = bcrypt.genSaltSync(bcryptSalt);
    const hashPass = bcrypt.hashSync(password, salt);

    let confirmationCode = bcrypt.hashSync(username, salt)
    confirmationCode=confirmationCode.replace(/\//g,'')
    const newUser = new User({
      username,
      password: hashPass,
      role: "teacher",
      email: email,
      confirmationCode: confirmationCode
    });

    newUser.save((err) => {
      if (err) {
        res.render("auth/signup", {
          message: "Something went wrong"
        });
      } else {
        let transporter = nodemailer.createTransport({
          service: 'Gmail',
          auth: {
            user: 'beltranrengifo@gmail.com',
            pass: process.env.MAILPASSW
          }
        });
        transporter.sendMail({
            from: '"My Awesome Project 👻" <beltran@rengifo.es>',
            to: email,
            subject: 'Your new account needs activation',
            text: `http://localhost:3000/auth/confirm/${confirmationCode}`,
            html: `<b><a href=http://localhost:3000/auth/confirm/${confirmationCode}>http://localhost:3000/auth/confirm/${confirmationCode}</b>`
          })
          .then(info => {
            console.log(info)
            res.render('index', {info})
          })
          .catch(error => console.log(error));
      }
    });
  });
});

authRoutes.get("/logout", (req, res) => {
  console.log('logout')
  req.logout();
  res.redirect("/");
});


authRoutes.get("/confirm/:confirmationCode", (req, res) => {
  let code = req.params.confirmationCode
  console.log(code)
  User.findOneAndUpdate({"confirmationCode":code},{'status':'Active'}).then(user=>{
    console.log(user);
    let activeMessage = {message:'User activated!'}
    console.log(activeMessage)
    res.render('index',{activeMessage})
  })
});

module.exports = authRoutes;