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
                                    res.status(200).cookie("token", token, {secure: true, sameSite: "none"}).json({"user": foundUser, "success": "Login successful."});
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
    }
});

//register complaint
router.post("/registerComplaint", function(req, res){
    const {token}=req.cookies;

    if(token){
        jwt.verify(token, process.env.SECRET, {}, async function(err, user){
            if(err){
                console.log(err);
            }
            else{
                const {role, id}=user;

                if(role==='student'){
                    try{
                        // console.log(req.body);
                        // const complaint=new Complaint({
                        //     type: req.body.type,
                        //     details: req.body.details,
                        //     status: req.body.status,
                        //     dateTime: req.body.dateTime,
                        //     phoneNo: req.body.phoneNo,
                        //     studentId: id,
                        //     roomId: req.body.roomId
                        // });    
                    }
                    catch(error){
                        console.log(error);
                    }
                }
                // else{
                //     //unauthorized user
                // }
            }
        });
    }
});

module.exports=router;
