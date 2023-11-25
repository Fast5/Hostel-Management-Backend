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

const app=express();

app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3000',
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
    const {token}=req.cookies;

    if(token){
        jwt.verify(token, process.env.SECRET, {}, async function(err, user){
            if(err){
                console.log(err);
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
            }
        });
    }
    // else{
    //     if logged out
    // }
});

//get rooms
app.get("/allRooms", function(req, res){
    const {token}=req.cookies;

    // console.log(token);

    if(token){
        jwt.verify(token, process.env.SECRET, {}, async function(err, user){
            if(err){
                console.log(err);
            }
            else{
                res.json(await Room.find());
            }
        });
    }
    else{
        ///HANDLE WITH 404 PAGE
    }
});

//get students
app.get("/allStudents", function(req, res){
    const {token}=req.cookies;

    if(token){
        jwt.verify(token, process.env.SECRET, {}, async function(err, user){
            if(err){
                console.log(err);
            }
            else{    
                // const {role}=user;
                // if(role==='admin'){   //abhi ke liye only admin
                    res.json(await Student.find());
                // }
            }
        });
    }
    else{
        //handle with 404
    }
});


//logout
app.get("/logout", function(req, res){
    res.cookie("token", "").json({"success": "Logout Successful."});
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