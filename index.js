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
// app.use("/api/student", studentRoutes);
// app.use("/api/hostelStaff", hostelStaffRoutes);

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
                // else if(role==='student'){

                // }
            }
        });
    }
    // else{
    //     if logged out
    // }
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