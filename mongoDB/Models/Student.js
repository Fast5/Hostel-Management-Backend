const mongoose=require("mongoose");

const studentSchema=new mongoose.Schema({
    name: String, 
    rollNo: String, //must be unique
    phoneNo: String, 
    guardianName: String,
    guardianPhoneNo: String,
    username: String, //must be unique
    password: String
});

const Student=mongoose.model('Student', studentSchema);

module.exports=Student;