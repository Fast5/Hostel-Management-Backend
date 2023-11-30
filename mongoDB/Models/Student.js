const mongoose=require("mongoose");

const studentSchema=new mongoose.Schema({
    name: {type: String, required: true}, 
    rollNo: {type: String, required: true, unique: true}, //must be unique
    phoneNo: {type: String, required: true}, 
    guardianName: {type: String, required: true},
    guardianPhoneNo: {type: String, required: true},
    username: {type: String, required: true}, //must be unique checked while adding
    password: {type: String, required: true},
    complaints: [{type: mongoose.Schema.Types.ObjectId, ref: 'Complaint'}], //iska alag schema hii bana dete hai with userId and time and data included.
    roomId: {type: mongoose.Schema.Types.ObjectId, ref: 'Room'}  //will be provided by the hostel staff
});

const Student=mongoose.model('Student', studentSchema);

module.exports=Student;