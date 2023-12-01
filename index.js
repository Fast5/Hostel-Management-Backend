require("dotenv").config();
const express=require("express");
const cors=require("cors");
const jwt=require("jsonwebtoken");
const cookieParser=require("cookie-parser");
const { connectDB } = require("./mongoDB/connect");
const adminRoutes=require("./routes/adminRoutes");
const studentRoutes=require("./routes/studentRoutes");
const hostelStaffRoutes=require("./routes/hostelStaffRoutes");
const Admin = require("./mongoDB/Models/Admin");
const Student = require("./mongoDB/Models/Student");
const HostelStaff = require("./mongoDB/Models/HostelStaff");
const Room = require("./mongoDB/Models/Room");
const Complaint = require("./mongoDB/Models/Complaint");

const app=express();

app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(cors({
    origin: 'https://hostel-management-frontend-plum.vercel.app',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'] 
}));

//cookies
app.use(cookieParser());

app.use("/api/admin", adminRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/hostelStaff", hostelStaffRoutes);

//fetching user from token
app.get("/profile", function(req, res){
    try{
        const {token}=req.cookies;
        if(token){
            jwt.verify(token, process.env.SECRET, {}, async function(err, user){
                if(err){
                    console.log(err);
                    // res.status(401).json({"error": "Unauthorized acces not allowed."});
                }
                else{
                    const {role}=user;
                    
                    if(role==='admin'){
                        const {name, username, _id}=await Admin.findById(user.id);
                        res.json({name, username, _id, role});
                    }
                    else if(role==='student'){
                        const {name, rollNo, phoneNo, guardianName, guardianPhoneNo, username, password, complaints, roomId}=await Student.findById(user.id);
                        res.json({name, rollNo, phoneNo, guardianName, guardianPhoneNo, username, password, complaints, roomId, role});
                    }
                    else if(role==='hostelStaff'){
                        const {name, username, _id, hostel}=await HostelStaff.findById(user.id);
                        res.json({name, username, _id, hostel, role});
                    }
                    // else{
                    //     res.status(401).json({"error": "Unauthorized acces not allowed."});
                    // }
                }
            });
        }
        else{
            // res.status(401).json({"error": "Unauthorized acces not allowed."});
        }
    }
    catch(err){
        console.log(err);
        res.status(500).json({"error": "Something went wrong."});
    }
});

//get rooms
app.get("/allRooms", function(req, res){
    try{
        const {token}=req.cookies;
    
        if(token){
            jwt.verify(token, process.env.SECRET, {}, async function(err, user){
                if(err){
                    console.log(err);
                    res.status(401).json({"error": "Unauthorized acces not allowed."});
                }
                else{
                    res.json(await Room.find());
                }
            });
        }
        else{
            res.status(401).json({"error": "Unauthorized acces not allowed."});
        }
    }
    catch(err){
        console.log(err);
        res.status(500).json({"error": "Something went wrong."});
    }
});

//get students
app.get("/allStudents", function(req, res){
    try{
        const {token}=req.cookies;
    
        if(token){
            jwt.verify(token, process.env.SECRET, {}, async function(err, user){
                if(err){
                    console.log(err);
                    res.status(401).json({"error": "Unauthorized acces not allowed."});
                }
                else{    
                    res.json(await Student.find());
                }
            });
        }
        else{
            res.status(401).json({"error": "Unauthorized acces not allowed."});
        }
    }
    catch(err){
        console.log(err);
        res.status(500).json({"error": "Something went wrong."});
    }
});

//get complaints (for student and hostel staff)
app.get("/allComplaints", function(req, res){
    try{
        const {token}=req.cookies;
    
        if(token){
            jwt.verify(token, process.env.SECRET, {}, async function(err, user){
                if(err){
                    console.log(err);
                    res.status(401).json({"error": "Unauthorized acces not allowed."});
                }
                else{
                    const {role}=user;
                    if(role==='student' || role==='hostelStaff'){
                        res.json(await Complaint.find());
                    }
                    else{
                        res.status(401).json({"error": "Unauthorized acces not allowed."});
                    }
                }
            });
        }
        else{
            res.status(401).json({"error": "Unauthorized acces not allowed."});
        }
    }
    catch(err){
        console.log(err);
        res.status(500).json({"error": "Something went wrong."});
    }
});

app.put("/editComplaint", function(req, res){
    try{
        const {token}=req.cookies;
    
        if(token){
            jwt.verify(token, process.env.SECRET, {}, async function(err, user){
                if(err){
                    console.log(err);
                    res.status(401).json({"error": "Unauthorized acces not allowed."});
                }
                else{
                    const {role}=user;
    
                    if(role==='student' || role==='hostelStaff'){
                        // try{
                            await Complaint.updateOne({"_id": req.body._id}, {
                                $set: {"status": req.body.status}
                            });
    
                            res.status(200).json({"complaints": await Complaint.find(), "success": "Complaint updated."});
                        // }
                        // catch(err){
                        //     console.log(err);
                        //     res.status(500).json({"error": "Internal Server Error"});
                        // }
                    }
                    else{
                        res.status(401).json({"error": "Unauthorized acces not allowed."});
                    }
                }
            });   
        }
        else{
            res.status(401).json({"error": "Unauthorized acces not allowed."}); 
        }
    }
    catch(err){
        console.log(err);
        res.status(500).json({"error": "Something went wrong."});
    }
});

//logout
app.get("/logout", function(req, res){
    try{
        res.clearCookie("token").json({"success": "Logout successful."});
    }
    catch(err){
        console.log(err);
        res.status(500).json({"error": "Something went wrong."}); 
    }
});

try{
    connectDB(process.env.MONGODB_URL);

    const PORT=process.env.PORT || 5000

    app.listen(PORT, function(){
        console.log(`Server started at port ${PORT}`);
    });
}
catch(err){
    console.log(err);
}