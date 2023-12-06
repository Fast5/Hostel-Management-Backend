const express=require("express");
const bcrypt=require("bcrypt");
const jwt=require("jsonwebtoken");
const Student = require("../mongoDB/Models/Student");
const Complaint = require("../mongoDB/Models/Complaint");

const router=express.Router();

//student login
router.post("/login", async function(req, res){
    try{
        await Student.findOne({username: req.body.username})
        .then((foundUser)=>{
            if(foundUser){
                bcrypt.compare(req.body.password, foundUser.password, function(err, result){
                    if(err){
                        console.log(err);
                    }
                    else{
                        if(result){
                            jwt.sign({username: foundUser.username, id: foundUser._id, role: "student"}, process.env.SECRET, {}, function(err, token){
                                if(err){
                                    console.log(err);
                                }
                                else{
                                    res.status(200).cookie("token", token, {secure: true, sameSite: "none", domain: ".hostel-management-backend.vercel.app"}).json({"user": foundUser, "success": "Login successful."});
                                    // res.status(200).cookie("token", token, {secure: true, sameSite: "none"}).json({"user": foundUser, "success": "Login successful."});
                                }
                            });
                        }
                        else{
                            res.status(403).json({"error": "Incorrect Password."});
                        }
                    }
                })
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

//register complaint
router.post("/registerComplaint", function(req, res){
    try{

        const {token}=req.cookies;
    
        if(token){
            jwt.verify(token, process.env.SECRET, {}, async function(err, user){
                if(err){
                    console.log(err);
                    res.status(401).json({"error": "Unauthorized acces not allowed."});
                }
                else{
                    const {role, id}=user;
    
                    if(role==='student'){
                        // try{
                            const complaint=new Complaint({
                                type: req.body.type,
                                details: req.body.details,
                                status: req.body.status,
                                dateTime: req.body.dateTime,
                                phoneNo: req.body.phoneNo,
                                studentId: id,
                                roomId: req.body.roomId
                            });    
    
                            complaint.save().then(async(recentComplaint)=>{
                                await Student.updateOne({"_id": id}, {
                                    $push: {"complaints": recentComplaint._id}
                                });
    
                                let userInfo=await Student.findById(id);
                                userInfo.role=role;

                                res.status(200).json({"userInfo": userInfo, "complaints": await Complaint.find(), "success": "Complaint registered."})
                            })
                            .catch=()=>{
                                res.status(500).json({"error": err});
                            }
                        // }
                        // catch(error){
                        //     console.log(error);
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
