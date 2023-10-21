const express=require("express");
const Admin = require("../mongoDB/Models/Admin");
const bcrypt=require("bcrypt");
const jwt=require("jsonwebtoken");
const Room = require("../mongoDB/Models/Room");

const router=express.Router();

//Admin Registration
router.post("/register", async function(req, res){
    try{
        await Admin.findOne({ username:req.body.username })
        .then((foundUser)=>{
            if(foundUser){
                res.status(403).json({"error": "User already exists. Login to continue." });
            }
            else{
                bcrypt.hash(req.body.password, 10, function(err, hash){
                    if(err){
                        console.log(err);
                    }
                    else{
                        const admin=new Admin({
                            name: req.body.name,
                            username: req.body.username,
                            password: hash
                        });
    
                        admin.save().then(()=>{
                            res.status(200).json({"success": "Registration successful. Login to continue."});
                        });
                    }
                });
            }
        });
    }
    catch(err){
        console.log(err);
    }
});

//Admin Login
router.post("/login", async function(req, res){
    try{
        await Admin.findOne({username: req.body.username})
        .then((foundUser)=>{
            if(foundUser){
                bcrypt.compare(req.body.password, foundUser.password, function(err, result){
                    if(err){
                        console.log(err);
                    }
                    else{
                        if(result){
                            jwt.sign({username: foundUser.username, id: foundUser._id, role: "admin"}, process.env.SECRET, {}, function(err, token){
                                if(err){
                                    console.log(err);
                                }
                                else{
                                    res.cookie("token", token, {secure: true, sameSite: "none"}).status(200).json({"user": foundUser, "success": "Login successful."});
                                }
                            });
                        }
                        else{
                            res.status(403).json({"error": "Incorrect Password."});
                        }
                    }
                });
            }
            else{
                res.status(403).json({"error": "User does not exist."});
            }
        });
    }
    catch(err){
        console.log(err);
    }
});

//Add room
router.post("/addRoom", function(req, res){
    const {token}=req.cookies;

    if(token){
        jwt.verify(token, process.env.SECRET, {}, async function(err, user){
            if(err){
                console.log(err);
            }
            else{
                const {role}=user;

                if(role==='admin'){   //only admin can add a room
                    const room=new Room({
                        roomNo: req.body.roomNo,
                        hostel: req.body.hostel,
                        accomodationType: req.body.accomodationType,
                        accomodable: true //can only be changed by hostel staff
                    });

                    room.save().then(async()=>{
                        res.status(200).json({"rooms": await Room.find(), "success": "Room created."});
                    })
                    .catch=(err)=>{
                        res.status(500).json({"error": err});
                    };
                }
                // else{
                    //Unauthorized User (student trying to add room)
                // }
            }
        });
    }
    // else{
            //logged out
    // }
});

//get rooms (As for now, only admin)
router.get("/allRooms", function(req, res){
    const {token}=req.cookies;

    // console.log(token);

    if(token){
        jwt.verify(token, process.env.SECRET, {}, async function(err, user){
            if(err){
                console.log(err);
            }
            else{
                const {role}=user;
                if(role==='admin'){   //abhi ke liye only admin
                    res.json(await Room.find());
                }
            }
        });
    }
});

//delete room
router.delete("/deleteRoom", function(req, res){
    const {token}=req.cookies;

    if(token){
        jwt.verify(token, process.env.SECRET, {}, async function(err, user){
            if(err){
                console.log(err);
            }
            else{
                const {role}=user;
                
                if(role==='admin'){   
                    await Room.deleteOne({_id: req.body.roomId})
                    .then(async()=>{
                        res.status(200).json({"rooms": await Room.find(), "success": "Room deleted."});
                    })
                }
            }
        });
    }
});

//update room (just accomodation type for admin)
router.put("/editRoom", function(req, res){
    const {token}=req.cookies;

    if(token){
        jwt.verify(token, process.env.SECRET, {}, async function(err, user){
            if(err){
                console.log(err);
            }
            else{
                const {role}=user;
                
                if(role==='admin'){   
        
                    await Room.replaceOne({_id: req.body._id}, {
                        roomNo: req.body.roomNo,
                        hostel: req.body.hostel,
                        accomodationType: req.body.accomodationType,
                        accomodable: true
                    })
                    .then(async()=>{
                        res.status(200).json({"rooms": await Room.find(), "success": "Updated successfully."})
                    });
                }
            }
        });
    }
});

module.exports=router;