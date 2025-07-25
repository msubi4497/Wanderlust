const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const User = require("../models/user.js");
const passport = require("passport");
const {isLoggedIn, saveRedirectUrl} = require("../middleware.js");

//Signup Routes
router.get("/signup", (req,res) => {
    res.render("users/signup.ejs");
});

router.post("/signup", wrapAsync(async(req,res) => {
    try{
    let {username, email, password} = req.body;
    const newUser = User({email, username});
    const registeredUser = await User.register(newUser, password);
    console.log(registeredUser);
    req.login(registeredUser, (error) => {
        if(error){
            return next(error);
        }
        req.flash("success", "Welcome to Wanderlust");
        res.redirect("/listings");
      });
    } catch(e){
        req.flash("error", e.message);
        res.redirect("/signup");
    }
  })
);

//Login Routes
router.get("/login", (req,res) => {
    res.render("users/login.ejs");
});

router.post("/login",
    saveRedirectUrl,
    passport.authenticate("local", {
        failureRedirect: "/login",
        failureFlash: true,
    }),
    async(req,res) => {
      req.flash("success", "Welcome back to Wanderlust!");
      let redirectUrl = res.locals.redirectUrl || "/listings";
      res.redirect(redirectUrl);
    }
);

//Logout Routes
router.get("/logout", (req,res,next) => {
    req.logout((err) => {
        if(err) {
          return next(err);
        }
        req.flash("success", "You are logged out!");
        res.redirect("/listings");
    })
});

module.exports = router;