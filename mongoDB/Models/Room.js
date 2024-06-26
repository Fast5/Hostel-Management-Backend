const mongoose=require("mongoose");

const roomSchema=new mongoose.Schema({
    roomNo: {type: Number, required: true},
    hostel: {type: String, required: true},
    accomodationType: {type: String, required: true},
    // accomodable: {type: Boolean, required: true},      //default true (can only be changed by hostel staff)
    occupants: [{type: mongoose.Schema.Types.ObjectId, ref: 'Student'}]
});

const Room=mongoose.model("Room", roomSchema);

module.exports=Room;