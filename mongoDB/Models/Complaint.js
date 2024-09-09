const mongoose=require("mongoose");

const complaintSchema=new mongoose.Schema({
    // Hostel: {type: String, required: true}, mobile no, username
    // roomNo: {type: Number, required: true},
    type: {type: String, required: true},
    details: {type: String},
    status: {type: String, required: true, enum: ['open', 'resolved', 'Pending'], default: 'Pending'},
    // dateTime: {type: Date, required: true},
    dateTime: {type: String, required: true},
    phoneNo: {type: String, required: true},
    studentId: {type: mongoose.Schema.Types.ObjectId, ref: 'Student'},
    roomId: {type: mongoose.Schema.Types.ObjectId, ref: 'Room'}
});

const Complaint=mongoose.model("Complaint", complaintSchema);

module.exports=Complaint;