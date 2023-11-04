const mongoose=require("mongoose");

const hostelStaffSchema=new mongoose.Schema({
    name: {type: String, required: true},         
    hostel: {type: String, required: true},     //as bh1 warden should see and change only bh1 related stuff
    username: {type: String, required: true}, //must be unique
    password: {type: String, required: true}
});

const HostelStaff=mongoose.model("HostelStaff", hostelStaffSchema);

module.exports=HostelStaff;

