const express = require('express');
const bycrpt = require('bcrypt');
const cors = require('cors');
const db = require('./database.js');

const app = express();
app.use(express.json());
app.use(cors());
var group_name;
var user_name;

const PORT = process.env.PORT || 3000;

app.get('',(req,resp)=>{
    resp.json({message:"Hello I am delopy from cyclic"});
})

//check for Register user
app.put('/userlogin',(req,resp)=>{
    let account = req.body.account;
    let security = req.body.take_security;
    let user = req.body.user;
    let password = req.body.password;
    let email = req.body.email;
    let new_password;
    if(account == 'true'){
        new_password = user+email+password+security
    }
    else{
        new_password = user+email+password;
    }
    user_name = user.toLowerCase();
    db.query('select * from registeruser where email = ?',[email],async (err,result)=>{
        if(err){
            resp.status(500).json({"message":"there is error"});
        }
        else{
            if(result.length == 0){
                resp.status(400).json({"message":"Ivalid user"});
            }
            else if(result.length == 1){
                var resu = await bycrpt.compare(new_password,result[0].password);
                if((resu)){
                    resp.status(200).json({"message":resu});
                }
                else{
                    resp.status(404).json({"message":resu});
                }
            }
            else{
                resp.status(404).json({"message":"Wrong User_name , password or Email"});
            }
        }
    })
});

app.post('/register/user',async (req,resp)=>{
    const {account_type,Fristname, email, password,security
    } = req.body
    let new_password;
    let checkuser;
    let type;

    if(account_type == 'true'){
        type = "admin";
        new_password = Fristname+email+password+security;
    }
    else{
        type = "student";
        new_password = Fristname+email+password;
    }

    var salt = await bycrpt.genSalt(10);
    var hashpass = await bycrpt.hash(new_password,salt);

    db.query('select * from registeruser where email = ?',[email],(err,result)=>{
        console.log("result length: ",result.length);
        if(err){
            console.log("error while adding",err);
        }
        else if(result.length == 0){
            checkuser = 'true';
            db.query('insert into registeruser(username, email, password,type) values(?,?,?,?)',[Fristname,email,hashpass,type],(err,result)=>{
                if(err){
                    console.log(err);
                    resp.status(404).json({'message':'flase'});
                }
                else{
                    resp.status(200).json({'message':'true'});
                }
            })
           if(account_type == 'true'){
                let sqlquery = 'create table '+Fristname+'_datagroup(id int AUTO_INCREMENT PRIMARY KEY,name varchar(30))';
                db.query(sqlquery,(err,result)=>{
                    if(err){
                        console.log(err);
                    }
                    else{
                        console.log(result);
                    }
                })
           }
        }
        else{
            checkuser = 'false';
            resp.status(500).json({'message':'invalid email'});
        }
    })   
})
// check for Register user end

//api for group
app.get('/data',(req,resp)=>{
    let sqlquery = 'select * from '+user_name+'_datagroup';
    console.log("user name: ",user_name);
    db.query(sqlquery,(err,result)=>{
        if(err){
            console.log(err);
            resp.send(err);
        }
        else{
            console.log(result);
            resp.status(200).send(result);
        }
    });
});

app.delete('/deletegroup',(req,resp)=>{
    console.log("I am in delete");
    let id = req.body.id;
    let group_name = req.body.group_name;
    let sqlquery = 'DELETE FROM '+user_name+'_datagroup WHERE id=?'
    db.query(sqlquery,[id],(err,result)=>{
        if(err){
            resp.send(err);
        }
        else{
            resp.send(result);
        }
    })
    sqlquery = 'DROP TABLE '+user_name+ group_name;
    db.query(sqlquery,(err,result)=>{
        if(err){
            console.log(err);
        }
        else{
            console.log(result);
        }
    })

    let delete_attenednce_record = 'DROP TABLE '+user_name+ group_name+'_attendence_record';
    db.query(delete_attenednce_record, async (err,result)=>{
        if(err){
            console.log('attendence table does not delete');
        }
        else{
            console.log('attendence table deleteed successufully');
        }
    })
});


app.post('/addgroup',async (req,resp)=>{
    let group_name = req.body.name;
    let table_name = req.body.table;
    let sqlquery = 'CREATE TABLE IF NOT EXISTS '+user_name+table_name+' (id int AUTO_INCREMENT PRIMARY KEY,name varchar(30),phone varchar(15),address varchar(50),comments varchar(50))';
    let sqlquery1 = 'insert into '+user_name+'_datagroup(name) values(?)'

    db.query(sqlquery1,[group_name],(err,result)=>{
        if(err){
            resp.status(500).send(err);
        }
        else{
            resp.status(200).send(result);
           
        }
    });

    db.query(sqlquery,(err,result)=>{
        if(err){
            console.log(err);
        }
        else{
            console.log(result);
            console.log("table created: ",table_name);
        }
    });

    let create_attendence_table = 'CREATE TABLE IF NOT EXISTS '+user_name+table_name+'_attendence_record (id int AUTO_INCREMENT PRIMARY KEY,name varchar(30),date varchar(10),attendence varchar(10),phone varchar(15))'

    db.query(create_attendence_table, async (err,result)=>{
        if(err){
            console.log('table not Created Successufully')
        }
        else{
            console.log('TAble Created Successfully');
        }
    })
});
//api for group end


//api for perticlar grp data
app.get('/tabledata',(req,resp)=>{
    console.log(group_name);
    sqlquery = 'select * from '+user_name+group_name;
    db.query(sqlquery,(err,result)=>{
        if(err){
            resp.send(err);
        }
        else{
            resp.send(result);
        }
    });
});

app.post('/postgroupname',(req,resp)=>{
    group_name = req.body.name;
    resp.send('get name');
});

app.post('/postpersondetails',(req,resp)=>{
    let name = req.body.name;
    let phone = req.body.phone;
    let address = req.body.address;
    let commnets = req.body.comments;

    sqlquery = 'insert into '+user_name+group_name+' (name,phone,address,comments) values(?,?,?,?)';

    db.query(sqlquery,[name,phone,address,commnets],(err,result)=>{
        if(err){
            resp.status(404).send(err);
        }
        else{
            resp.status(200).send(result);
        }
    });
});

//api for mark attendnece
app.post('/attendencedata', async (req,resp)=>{
    // let current_date = new Date().toLocaleDateString();
    // console.log("current date: ",current_date);
    var conformation;
    let {data} = req.body;
    let sqlquery = 'insert into '+user_name+group_name+'_attendence_record(name,date,attendence,phone) values(?,?,?,?)'

    let checkdate = 'select * from '+user_name+group_name+'_attendence_record where date = ? and phone = ?';
    // let date = '8/03/2024';
    // let phone = '09625031141'
    // data.length

    for(let i=0;i<data.length;i++){

        db.query(checkdate,[data[i].date,data[i].phone], (err,result)=>{
            if(err){
                console.log(err);
            }
            else if(result.length == 0){
                db.query(sqlquery,[data[i].person_name,data[i].date,data[i].marks_attendence,data[i].phone] , (err,result) =>{
                    // console.log(' am here');
                    if(err){
                        // console.log(err);
                        conformation = false;
                    }
                    else{
                        // console.log(result);
                        conformation = true;
                    }
                })  
            }
            else if(result.length != 0){
                let query = 'update '+user_name+group_name+'_attendence_record set attendence = ? where date = ? and phone = ?';

                db.query(query,[data[i].marks_attendence,data[i].date,data[i].phone],(err,result)=>{
                    if(err){
                        console.log("error while update : ",err)
                    }
                    else{
                        console.log("table updated successufully: ",result);
                    }
                })
            }
        })

        
    }

    if(conformation = true){
        resp.status(200).json({'query':'ok'});
    }
    else{ resp.status(404).json({'query':'no'});}
})

app.put('/updateperson', async (req,resp)=>{
    const{id,name,phone,address,comments} = req.body;
    console.log(id,name,phone,address,comments);

    sqlquery = 'update '+user_name+group_name+' set name = ?,phone=?,address=?,comments=? where id = ?';
    db.query(sqlquery,[name,phone,address,comments,id],(err,result)=>{
        if(err){
            console.log(err);
            resp.status(500).json({'message':'not_upadte'});
        }
        else{
            resp.status(200).json({'message':'updated'});
        }
    })
})

//api for delete perticular person
app.delete('/deleteuserformgroup',async (req,resp)=>{
    let id = req.body.id;
    let sqlquery = 'delete from '+group_name+' where id = ?';

    db.query(sqlquery,[id], (err,result)=>{
        if(err){
            resp.status(500).json({'message':'server issue'});
        }
        else{
            resp.status(200).json({'message':'delete'});
        }
    })
})
//api for mark attendence end

//api for particular grp data end

//api for attendence record start
let phone;
let group;
let name;
app.post('/show/attendence',(req,resp)=>{
    phone = req.body.phone_number;
    group = req.body.group_name;
    name = req.body.name;
    console.log(phone,group);

    resp.json({message:"true"});
})

app.get('/show/attendence/record',(req,resp)=>{
    let sqlquery = 'select * from '+name+group+'_attendence_record where phone = ?';
    db.query(sqlquery,[phone],(err,result)=>{
        if(err){
            console.log(err);
        }
        else{
            resp.json(result);
            console.log(result);
        }
    })
})
//api for attendence record stop

app.listen(PORT,()=>{
    console.log("server listen at 3000 port");
});