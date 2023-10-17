const express=require("express");
const Admin = require("../mongoDB/Models/Admin");
const bcrypt=require("bcrypt");
const jwt=require("jsonwebtoken");

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


module.exports=router;