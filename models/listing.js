const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const Review = require("./reviews.js");

const listingSchema = new Schema ({
    title: {
        type: String,
        required: true
    },
    description:String,
    image:{
        url: String,
        filename: String,
        // type:String,
        // default:
        //     "https://www.istockphoto.com/photo/summer-holidays-happy-woman-on-beach-swing-gm638829270-114787207",
        // set: (v) => 
        //   v === ""
        //     ? "https://www.istockphoto.com/photo/summer-holidays-happy-woman-on-beach-swing-gm638829270-114787207"
        //     : v,
    },
    price:Number,
    location:String,
    country:String,
    reviews:[
        {
            type: Schema.Types.ObjectId,
            ref: "Review",
        },
    ],
    owner:{
        type: Schema.Types.ObjectId,
        ref: "User",
    },
});

listingSchema.post("findOneAndDelete", async (listing) => {
    if(listing){
        await Review.deleteMany({_id: {$in: listing.reviews}});
    }
});

const listing = mongoose.model("listing",listingSchema);
module.exports = listing;