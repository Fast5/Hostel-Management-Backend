const express=require("express");
const bcrypt=require("bcrypt");
const jwt=require("jsonwebtoken");
const HostelStaff = require("../mongoDB/Models/HostelStaff");
const Room = require("../mongoDB/Models/Room");
const Student = require("../mongoDB/Models/Student");

const router=express.Router();

//hostel staff login
router.post("/login", async function(req, res){
    try{
        await HostelStaff.findOne({username: req.body.username})
        .then((foundUser)=>{
            if(foundUser){
                bcrypt.compare(req.body.password, foundUser.password, function(err, result){
                    if(err){
                        console.log(err);
                    }
                    else{
                        if(result){
                            jwt.sign({username: foundUser.username, id: foundUser._id, role: "hostelStaff"}, process.env.SECRET, {}, function(err, token){
                                if(err){
                                    console.log(err);
                                }
                                else{
                                    res.status(200).cookie("token", token, {secure: true, sameSite: "none", domain: ".hostel-management-backend.vercel.app"}).json({"user": foundUser, "success": "Login successful."});
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
        res.status(500).json({"error": "Something went wrong."});
    }
});


//allocate room
router.put("/allocateRoom", function(req, res){
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
                    
                    if(role==='hostelStaff'){   
                        await Room.replaceOne({_id: req.body.id}, {
                            roomNo: req.body.roomNo,
                            hostel: req.body.hostel,
                            accomodationType: req.body.accomodationType,
                            // accomodable: req.body.accomodable,
                            occupants: req.body.occupants
                        });
                        
                        //room is being updated if previously someone stayed then make their roomId null
                        await Student.updateMany({"roomId": req.body.id}, {
                            $set: {"roomId": null}
                        });
                        
                        await Student.updateOne({"_id": req.body.occupants[0]}, {
                            $set: {"roomId": req.body.id}
                        });

                        if(req.body.accomodationType==='double'){
                            await Student.updateOne({"_id": req.body.occupants[1]}, {
                                $set: {"roomId": req.body.id}
                            });    
                        }

                        res.status(200).json({"rooms": await Room.find(), "students": await Student.find(), "success": "Room Allocated."})
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

//deallocate room
router.put("/deallocateRoom", function(req, res){
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
                    
                    if(role==='hostelStaff'){   
                        // try{
                            await Room.updateOne({_id: req.body.id}, {
                                $set: {"occupants": []}
                            });
    
                            await Student.updateMany({"roomId": req.body.id}, {
                                $set: {"roomId": null}
                            });
    
    
                            res.status(200).json({"rooms": await Room.find(), "students": await Student.find(), "success": "Room Unallocated."})
                        // }
                        // catch(error){
                        //     console.error(error);
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

module.exports=router;