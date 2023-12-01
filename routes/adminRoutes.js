const express=require("express");
const Admin = require("../mongoDB/Models/Admin");
const bcrypt=require("bcrypt");
const jwt=require("jsonwebtoken");
const Room = require("../mongoDB/Models/Room");
const Student = require("../mongoDB/Models/Student");
const HostelStaff = require("../mongoDB/Models/HostelStaff");
const Complaint=require("../mongoDB/Models/Complaint");

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
                                    res.status(200).cookie("token", token, {secure: true, sameSite: "none", domain: ".hostel-management-frontend-plum.vercel.app"}).json({"user": foundUser, "success": "Login successful."});
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

//Add room
router.post("/addRoom", function(req, res){
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
    
                    if(role==='admin'){   //only admin can add a room
                        const room=new Room({
                            roomNo: req.body.roomNo,
                            hostel: req.body.hostel,
                            accomodationType: req.body.accomodationType,
                            // accomodable: true, //can only be changed by hostel staff
                            occupants: []  //initially no student are allocated a room
                        });
    
                        room.save().then(async()=>{
                            res.status(200).json({"rooms": await Room.find(), "success": "Room created."});
                        })
                        .catch=(err)=>{
                            res.status(500).json({"error": err});
                        };
                    }
                    else{
                        // Unauthorized User (student trying to add room)
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
        res.status(500).json({"error": "something went wrong."});
    }
});

//delete room
router.delete("/deleteRoom", function(req, res){
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
                    
                    if(role==='admin'){   
                        await Room.deleteOne({_id: req.body.roomId})
                        .then(async()=>{

                            await Student.updateMany({"roomId": req.body.roomId}, {
                                $set: {"roomId": null}
                            });

                            res.status(200).json({"rooms": await Room.find(), "success": "Room deleted."});
                        })
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
        res.status(500).json({"error": "something went wrong."});
    }
});

//update room (just accomodation type for admin)
router.put("/editRoom", function(req, res){
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
                    
                    if(role==='admin'){   
            
                        // await Room.replaceOne({_id: req.body._id}, {
                        //     roomNo: req.body.roomNo,
                        //     hostel: req.body.hostel,
                        //     accomodationType: req.body.accomodationType,
                        //     occupants: []
                        // })
                        // .then(async()=>{
                        //     res.status(200).json({"rooms": await Room.find(), "success": "Updated successfully."})
                        // });

                        await Room.updateOne({_id: req.body._id}, {
                            $set: {"accomodationType": req.body.accomodationType}
                        })
                        .then(async()=>{
                            res.status(200).json({"rooms": await Room.find(), "success": "Updated successfully."})
                        });
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
        res.status(500).json({"error": "something went wrong."});
    }
});

//Add student
router.post("/addStudent", function(req, res){
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
    
                    if(role==='admin'){   //only admin can add a student
                        await Student.findOne({ username:req.body.username })
                        .then((foundUser)=>{
                            if(foundUser){
                                res.status(403).json({"error": "User already exists." });
                            }
                            else{
                                bcrypt.hash(req.body.password, 10, function(err, hash){
                                    if(err){
                                        console.log(err);
                                    }
                                    else{
                                        const student=new Student({
                                            name: req.body.name,
                                            rollNo: req.body.rollNo,
                                            phoneNo: req.body.phoneNo,
                                            guardianName: req.body.guardianName,
                                            guardianPhoneNo: req.body.guardianPhoneNo,
                                            username: req.body.username,
                                            password: hash,
                                            complaints: [],
                                            roomId: null
                                        });
    
                                        student.save().then(async()=>{
                                            res.status(200).json({"students": await Student.find(), "success": "Student added."});
                                        })
                                        .catch=(err)=>{
                                            res.status(500).json({"error": err});
                                        };
                                    }
                                });
                            }
                        });
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
        res.status(500).json({"error": "something went wrong."});
    }
});

//delete student 
router.delete("/deleteStudent", function(req, res){
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
                    
                    if(role==='admin'){   
                        
                        await Student.deleteOne({_id: req.body.id})
                        .then(async()=>{

                            await Complaint.deleteMany({"studentId": req.body.id});
                            res.status(200).json({"students": await Student.find(), "success": "Student deleted."});
                        });
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
        res.status(500).json({"error": "something went wrong."});   
    }
});

//edit student (now only for admin, but roomNo is provided by hostel staff)
router.put("/editStudent", function(req, res){
    try{

        const {token}=req.cookies;
    
        if(token){
            jwt.verify(token, process.env.SECRET, {}, async function(err, user){
                if(err){
                    console.log(err);
                }
                else{
                    const {role}=user;
                    
                    if(role==='admin'){   
                    
                        const originalStudent=await Student.findById(req.body._id);
                        
                        if(req.body.password===originalStudent.password && req.body.username===originalStudent.username){       //password & username is not changed
                            // console.log("none of them are updatde")
                            await Student.replaceOne({_id: req.body._id}, {
                                name: req.body.name,
                                rollNo: req.body.rollNo,
                                phoneNo: req.body.phoneNo,
                                guardianName: req.body.guardianName,
                                guardianPhoneNo: req.body.guardianPhoneNo,
                                username: req.body.username,
                                password: originalStudent.password,
                                complaints: originalStudent.complaints,
                                roomId: originalStudent.roomId
                            })
                            .then(async()=>{
                                res.status(200).json({"students": await Student.find(), "success": "Updated successfully."});
                            });
                        }
                        else{  //we need to hash the new password and new username must not be already present already and then update
                            if(req.body.password!==originalStudent.password && req.body.username!==originalStudent.username){
                                // console.log("both of them are updatde")
    
                                await Student.findOne({ username:req.body.username })
                                .then((foundUser)=>{
                                    if(foundUser){
                                        res.status(403).json({"error": "User already exists." });
                                    }
                                    else{
                                        bcrypt.hash(req.body.password, 10, async function(err, hash){
                                            if(err){
                                                console.log(err);
                                            }
                                            else{
                                                await Student.replaceOne({_id: req.body._id}, {
                                                    name: req.body.name,
                                                    rollNo: req.body.rollNo,
                                                    phoneNo: req.body.phoneNo,
                                                    guardianName: req.body.guardianName,
                                                    guardianPhoneNo: req.body.guardianPhoneNo,
                                                    username: req.body.username,
                                                    password: hash,
                                                    complaints: originalStudent.complaints,
                                                    roomId: originalStudent.roomId
                                                })
                                                .then(async()=>{
                                                    res.status(200).json({"students": await Student.find(), "success": "Updated successfully."});
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                            else if(req.body.username!==originalStudent.username){  //only username is changed
                                // console.log("username updatde")
    
                                await Student.findOne({ username:req.body.username})
                                .then(async (foundUser)=>{
                                    if(foundUser){
                                        res.status(403).json({"error": "User already exists." });
                                    }
                                    else{
                                        await Student.replaceOne({_id: req.body._id}, {
                                            name: req.body.name,
                                            rollNo: req.body.rollNo,
                                            phoneNo: req.body.phoneNo,
                                            guardianName: req.body.guardianName,
                                            guardianPhoneNo: req.body.guardianPhoneNo,
                                            username: req.body.username,
                                            password: req.body.password,
                                            complaints: originalStudent.complaints,
                                            roomId: originalStudent.roomId
                                        })
                                        .then(async()=>{
                                            res.status(200).json({"students": await Student.find(), "success": "Updated successfully."});
                                        });
                                    }
                                })
                            }
                            else{  //only password is changed
                                // console.log("padssword updatde")
    
                                bcrypt.hash(req.body.password, 10, async function(err, hash){
                                    if(err){
                                        console.log(err);
                                    }
                                    else{
                                        await Student.replaceOne({_id: req.body._id}, {
                                            name: req.body.name,
                                            rollNo: req.body.rollNo,
                                            phoneNo: req.body.phoneNo,
                                            guardianName: req.body.guardianName,
                                            guardianPhoneNo: req.body.guardianPhoneNo,
                                            username: req.body.username,
                                            password: hash,
                                            complaints: originalStudent.complaints,
                                            roomId: originalStudent.roomId
                                        })
                                        .then(async()=>{
                                            res.status(200).json({"students": await Student.find(), "success": "Updated successfully."});
                                        });
                                    }
                                });   
                            }
                        }
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
        res.status(500).json({"error": "something went wrong."});   
    }
});

//add hostel staff
router.post("/addHostelStaff", function(req, res){
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
    
                    if(role==='admin'){   //only admin can add a student
    
                        await HostelStaff.findOne({ username:req.body.username })
                        .then((foundUser)=>{
                            if(foundUser){
                                res.status(403).json({"error": "User already exists." });
                            }
                            else{
                                bcrypt.hash(req.body.password, 10, function(err, hash){
                                    if(err){
                                        console.log(err);
                                    }
                                    else{
                                        const hostelStaff=new HostelStaff({
                                            name: req.body.name,
                                            hostel: req.body.hostel,
                                            username: req.body.username,
                                            password: hash
                                        });
    
                                        hostelStaff.save().then(async()=>{
                                            res.status(200).json({"hostelStaffs": await HostelStaff.find(), "success": "Hostel staff added."})
                                        })
                                        .catch=(err)=>{
                                            res.status(500).json({"error": err});
                                        };
                                    }
                                });
                            }
                        });
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
        res.status(500).json({"error": "something went wrong."});   
    }
});

router.get("/allHostelStaffs", function(req, res){
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
                    if(role==='admin'){   //abhi ke liye only admin
                        res.json(await HostelStaff.find());
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
        res.status(500).json({"error": "something went wrong."});   
    }
});

//delete hostel staff
router.delete("/deleteHostelStaff", function(req, res){
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
                    
                    if(role==='admin'){   
                        
                        await HostelStaff.deleteOne({_id: req.body.id})
                        .then(async()=>{
                            res.status(200).json({"hostelStaffs": await HostelStaff.find(), "success": "Hostel staff deleted."});
                        });
                    }
                    else{
                        res.status(401).json({"error": "Unauthorized acces not allowed."});
                    }
                }
            })
        } 
        else{
            res.status(401).json({"error": "Unauthorized acces not allowed."});
        }
    }
    catch(err){
        console.log(err);
        res.status(500).json({"error": "something went wrong."});   
    }
});

//edit hostel staff
router.put("/editHostelStaff", function(req, res){
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
                    
                    if(role==='admin'){   
                    
                        const originalStaff=await HostelStaff.findById(req.body._id);
                        
                        //username and password are not changed
                        if(req.body.password===originalStaff.password && req.body.username===originalStaff.username){       //password & username is not changed
             
                            await HostelStaff.replaceOne({_id: req.body._id}, {
                                name: req.body.name,
                                hostel: req.body.hostel,
                                username: req.body.username,
                                password: originalStaff.password,
                            })
                            .then(async()=>{
                                res.status(200).json({"hostelStaffs": await HostelStaff.find(), "success": "Updated successfully."});
                            });
                        }
                        else{  //we need to hash the new password and new username must not be already present and then update
                            if(req.body.password!==originalStaff.password && req.body.username!==originalStaff.username){
            
                                await HostelStaff.findOne({ username:req.body.username })
                                .then((foundUser)=>{
                                    if(foundUser){
                                        res.status(403).json({"error": "User already exists." });
                                    }
                                    else{
                                        bcrypt.hash(req.body.password, 10, async function(err, hash){
                                            if(err){
                                                console.log(err);
                                            }
                                            else{
                                                await HostelStaff.replaceOne({_id: req.body._id}, {
                                                    name: req.body.name,
                                                    hostel: req.body.hostel,
                                                    username: req.body.username,
                                                    password: hash,
                                                })
                                                .then(async()=>{
                                                    res.status(200).json({"hostelStaffs": await HostelStaff.find(), "success": "Updated successfully."});
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                            else if(req.body.username!==originalStaff.username){  //only username is changed
                                // console.log("username updatde")
    
                                await HostelStaff.findOne({username: req.body.username})
                                .then(async (foundUser)=>{
                                    if(foundUser){
                                        res.status(403).json({"error": "User already exists." });
                                    }
                                    else{
                                        await HostelStaff.replaceOne({_id: req.body._id}, {
                                            name: req.body.name,
                                            hostel: req.body.hostel,
                                            username: req.body.username,
                                            password: req.body.password,
                                        })
                                        .then(async()=>{
                                            res.status(200).json({"hostelStaffs": await HostelStaff.find(), "success": "Updated successfully."});
                                        });
                                    }
                                })
                            }
                            else{  //only password is changed
                                bcrypt.hash(req.body.password, 10, async function(err, hash){
                                    if(err){
                                        console.log(err);
                                    }
                                    else{
                                        await HostelStaff.replaceOne({_id: req.body._id}, {
                                            name: req.body.name,
                                            hostel: req.body.hostel,
                                            username: req.body.username,
                                            password: hash,
                                        })
                                        .then(async()=>{
                                            res.status(200).json({"hostelStaffs": await HostelStaff.find(), "success": "Updated successfully."});
                                        });
                                    }
                                });   
                            }
                        }
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
        res.status(500).json({"error": "something went wrong."});   
    }
});

module.exports=router;