if(process.env.NODE_ENV !="production"){
    require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const {listingSchema, reviewSchema} = require("./schema.js");
const Listing = require("./models/listing.js");
const Review = require("./models/reviews.js");
const session = require("express-session");
const MongoStrore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const {isLoggedIn, saveRedirectUrl} = require("./middleware.js");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

//const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
const dbURL = process.env.ATLAS_DB_URL;

async function main(){
    await mongoose.connect(dbURL);
}

// async function main(){
//     await mongoose.connect(MONGO_URL);
// }

main()
 .then(() => {
    console.log("server is connected to DB");
})
 .catch((err) => {
    console.log(err);
});

app.set("view engine","ejs");
app.set("views", path.join(__dirname,"views"));
app.use(express.urlencoded({extended: true}));
app.use(methodOverride("_method"));
app.engine("ejs",ejsMate);
app.use(express.static(path.join(__dirname, "/public")));


const store = MongoStrore.create({
    mongoUrl: dbURL,
    crypto:{
        secret: process.env.SECRET,
    },
    touchAfter: 24*3600
});

const sessionOption = {
    store,
    secret: process.env.SECRET, 
    resave: false, 
    saveUninitialized: true,
    cookie: {
        expires: Date.now()+ 7*24*60*60*1000,
        maxAge: 7*24*60*60*1000,
        httpOnly: true,
    },
};

store.on("error", () =>{
    console.log("ERROR IN MONGO SESSION STORE", err);
});

app.get("/",(req,res) => {
    res.send("hi, i am root");
});

//session
app.use(session(sessionOption));
app.use(flash());

//User authentication
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//middleware for flash msg
app.use((req,res,next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

//demouser registration route
app.get("/demouser", async(req,res) => {
    let fakeuser = new User({
        email: "student@gmail.com",
        username: "subhasish",
    });

    let registeredUser = await User.register(fakeuser, "password");
    res.send(registeredUser);
});

// const validateListing = (req, res, next) => {
//     console.log(req.body);
//     let {error} = listingSchema.validate(req.body);
//     if(error){
//         let errMsg = error.details.map((el) => el.message).join(",");
//         throw new ExpressError(400, errMsg);
//     } else{
//         next();
//     }
// };

// const validateReview = (req, res, next) => {
//     let { error } = reviewSchema.validate(req.body);
//     if(error){
//       let errMsg = error.details.map((el) => el.message).join(",");
//       throw new ExpressError(400, errMsg);
//     } else{
//         next();
//     }
// };

app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/", userRouter);

// //Index Route
// app.get("/listings", async(req,res) => {
//     const allListings = await Listing.find({});
//     res.render("listings/index.ejs", {allListings});
// });

// //new listing route
// app.get("/listings/new",isLoggedIn, (req,res) => {
//     res.render("listings/new.ejs");
// });

// //post new listing route
// app.post("/listings", validateListing,
//     wrapAsync(async(req,res,next) => {
//      //an instance of 'listing' object is stored.
//       const newListing = new Listing(req.body.listing);
//       newListing.owner = req.user._id;
//       await newListing.save();
//       req.flash("success", "New Listing Created.");
//       res.redirect("/listings");
//     })
// );

// //show route
// app.get("/listings/:id", wrapAsync(async(req,res) => {
//     let {id} = req.params;
//     const listing = await Listing.findById(id).populate("reviews").populate("owner");
//     // let listing = await Listing.find((a) => id === a.id); ///*** */
//     //console.log(listing);   ///**** */
//     res.render("listings/show.ejs", { listing });
//     }
// ));

// //edit route
// app.get("/listings/:id/edit",isLoggedIn, wrapAsync(async(req,res) => {
//     let {id} = req.params;
//     const listing = await Listing.findById(id);
//     res.render("listings/edit.ejs", {listing});
// }));

// //update route
// app.put("/listings/:id",
//     isLoggedIn,
//     validateListing,
//     wrapAsync(async(req,res) => {
//     let {id} = req.params;
//     await Listing.findByIdAndUpdate(id,{...req.body.listing});
//     res.redirect(`/listings/${id}`);
// }));

// //delete route
// app.delete("/listings/:id", isLoggedIn, wrapAsync(async(req,res) => {
//     let {id} = req.params;
//     let deleteListing = await Listing.findByIdAndDelete(id);
//     console.log(deleteListing);
//     req.flash("success", "Listing Deleted.");
//     res.redirect("/listings");
// }));


 //*********************************************
// // post new review
// app.post("/listings/:id/reviews", 
//     validateReview,
//     wrapAsync(async(req,res) => {
//     let listing = await Listing.findById(req.params.id);
//     let newReview = new Review(req.body.review);
//     listing.reviews.push(newReview);

//     await newReview.save();
//     await listing.save();

//     req.flash("success", "New Review Created.");
//     res.redirect(`/listings/${listing._id}`);
//     console.log("new review saved");
// }));

// //Delete Review Route
// app.delete(
// "/listings/:id/reviews/:reviewId",
//   wrapAsync(async(req,res) => {
//     let {id, reviewId} = req.params;
//     await Listing.findByIdAndUpdate(id, {$pull: {reviews: reviewId}});
//     await Review.findByIdAndDelete(reviewId);

//     req.flash("success", "Review Deleted.");
//     res.redirect(`/listings/${id}`);
//   })
// );

///*********************************************
// //Signup Routes
// app.get("/signup", (req,res) => {
//     res.render("users/signup.ejs");
// });

// app.post("/signup", wrapAsync(async(req,res) => {
//     try{
//     let {username, email, password} = req.body;
//     const newUser = User({email, username});
//     const registeredUser = await User.register(newUser, password);
//     console.log(registeredUser);
//     req.login(registeredUser, (error) => {
//         if(error){
//             return next(error);
//         }
//         req.flash("success", "Welcome to Wanderlust");
//         res.redirect("/listings");
//       });
//     } catch(e){
//         req.flash("error", e.message);
//         res.redirect("/signup");
//     }
//   })
// );

///**************************************
// //Login Routes
// app.get("/login", (req,res) => {
//     res.render("users/login.ejs");
// });

// app.post("/login",
//     saveRedirectUrl,
//     passport.authenticate("local", {
//         failureRedirect: "/login",
//         failureFlash: true,
//     }),
//     async(req,res) => {
//       req.flash("success", "Welcome back to Wanderlust!");
//       let redirectUrl = res.locals.redirectUrl || "/listings";
//       res.redirect(redirectUrl);
//     }
// );

//****************************************
// //Logout Routes
// app.get("/logout", (req,res,next) => {
//     req.logout((err) => {
//         if(err) {
//           return next(err);
//         }
//         req.flash("success", "You are logged out!");
//         res.redirect("/listings");
//     })
// });

//////-----------------------------------------------------------------
// app.get("/testListing", async (req,res) => {
//     let sampleListing = new Listing({
//         title:"My new Villa",
//         description: "by the beach",
//         price:1200,
//         location: "Calunguat,Goa",
//         country: "India"
//     });

//     await sampleListing.save();
//     console.log("sample is saved");
//     res.send("testing is successful");
// });

//*****************/
// app.all("*", (req, res, next) => {
//     next(new ExpressError(404, "page not found!"));
// });

app.use((err, req, res, next) => {
    let { statusCode = 500, message = "something went wrong" } = err;
    //res.status(statusCode).send(message);
    res.status(statusCode).render("error.ejs", {message});
});

app.listen(8000, () => {
    console.log("server is listening to port 8000");
});