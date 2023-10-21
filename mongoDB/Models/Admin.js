const mongoose=require("mongoose");

const adminSchema=new mongoose.Schema({
    name: {type: String, required: true},       //must be given add server side validation
    username: {type: String, required: true},  //must be unique add server side validation
    password: {type: String, required: true}
});

const Admin=mongoose.model("Admin", adminSchema);

module.exports=Admin;