const mongoose=require("mongoose");

const adminSchema=new mongoose.Schema({
    name: String,       //must be given add server side validation
    username: String,  //must be unique add server side validation
    password: String
});

const Admin=mongoose.model("Admin", adminSchema);

module.exports=Admin;