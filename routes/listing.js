const express = require("express");
const router = express.Router();
const Listing = require("../models/listing.js");
const wrapAsync = require("../utils/wrapAsync.js");
const ExpressError = require("../utils/ExpressError.js");
//const {listingSchema, reviewSchema} = require("../schema.js");
const {isLoggedIn, isOwner, validateListing} = require("../middleware.js");
const multer  = require('multer');
const {storage} = require("../cloudConfig.js");
const upload = multer({ storage }); //upload destination

const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_PUBLIC_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });


//Index Route
router.get("/", async(req,res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", {allListings});
});

//new listing route
router.get("/new",isLoggedIn, (req,res) => {
    res.render("listings/new.ejs");
});

//post new listing route
router.post("/", isLoggedIn,
    //   validateListing, 
      upload.single("listing[image]"),
      wrapAsync(
      async(req,res,next) => {
      let url = req.file.path;
      let filename = req.file.filename;
      console.log(url, "\n", filename);
      //an instance of 'listing' object is stored.
      const newListing = new Listing(req.body.listing);
      newListing.owner = req.user._id;
      newListing.image = {url, filename};
      await newListing.save();
      req.flash("success", "New Listing Created.");
      res.redirect("/listings");
      //res.send(req.file);
    })
);

//upload Image to cloudinary server
// router.post("/", upload.single("listing[image]"), (req,res) => {
//     res.send(req.file);
// });

//show route
router.get("/:id", wrapAsync(async(req,res) => {
    let {id} = req.params;
    const listing = await Listing.findById(id)
      .populate({
        path: "reviews", 
        populate:{
            path: "author",
        },
      })
      .populate("owner");
    if(!listing){
        req.flash("error", "The listing you requested for does not exist!");
        res.redirect("/listings");
    }
    // let listing = await Listing.find((a) => id === a.id); ///*** */
    //console.log(listing);   ///**** */
    res.render("listings/show.ejs", { listing });
    }
));

//edit route
router.get("/:id/edit",isLoggedIn,isOwner, wrapAsync(async(req,res) => {
    let {id} = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/edit.ejs", {listing});
}));

//update route
router.put("/:id",
    isLoggedIn,
    isOwner,
    // validateListing,
    wrapAsync(async(req,res) => {
    let {id} = req.params;
    await Listing.findByIdAndUpdate(id,{...req.body.listing});
    req.flash("success", "listing updated.");
    res.redirect(`/listings/${id}`);
}));

//delete route
router.delete("/:id", isLoggedIn, isOwner, wrapAsync(async(req,res) => {
    let {id} = req.params;
    let deleteListing = await Listing.findByIdAndDelete(id);
    console.log(`Deleted listings details:\n${deleteListing}`);
    req.flash("success", "Listing Deleted.");
    res.redirect("/listings");
}));

module.exports = router;