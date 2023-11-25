const mongoose=require("mongoose");

const complaintSchema=new mongoose.Schema({

});

const Complaint=mongoose.model("Complaint", complaintSchema);

module.exports=Complaint;