const express = require('express');
const bycrpt = require('bcrypt');
const cors = require('cors');
const db = require('./database.js');

const app = express();
app.use(express.json());
app.use(cors());
var group_name;

//check for Register user
app.put('/userlogin',(req,resp)=>{
    let user = req.body.user;
    let password = req.body.password;
    let email = req.body.email;
    let new_password = user+email+password;
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
                if(resu ==  result[0].password){
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
    const {Fristname, lastname, email, password,} = req.body
    let new_password = Fristname+email+password
    var salt = await bycrpt.genSalt(10);
    var hashpass = await bycrpt.hash(new_password,salt);
    // console.log(Fristname , lastname, email, password);
    // console.log("hash_passwrd: ",hashpass);

   db.query('insert into registeruser(Fristname, lastname, email, password) values(?,?,?,?)',[Fristname,lastname,email,hashpass],(err,result)=>{
    if(err){
        resp.status(404).json({'message':'flase'});
    }
    else{
        console.log("added successfully");
        resp.status(200).json({'message':'true'});
    }
   })
   
})
// check for Register user end

//api for group
app.get('/data',(req,resp)=>{
    db.query('select * from datagroups',(err,result)=>{
        if(err){
            resp.send(err);
        }
        else{
            resp.status(200).send(result);
        }
    });
});

app.delete('/deletegroup',(req,resp)=>{
    console.log("I am in delete");
    let id = req.body.id;
    let group_name = req.body.group_name;
    db.query('DELETE FROM datagroups WHERE id=?',[id],(err,result)=>{
        if(err){
            resp.send(err);
        }
        else{
            resp.send(result);
        }
    })
    sqlquery = 'DROP TABLE '+ group_name;
    db.query(sqlquery,(err,result)=>{
        if(err){
            console.log(err);
        }
        else{
            console.log(result);
        }
    })

    let delete_attenednce_record = 'DROP TABLE '+ group_name+'_attendence_record';
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
    sqlquery = 'CREATE TABLE IF NOT EXISTS '+table_name+' (id int AUTO_INCREMENT PRIMARY KEY,name varchar(255),phone varchar(255),address varchar(255),comments varchar(255))';

    db.query('insert into datagroups(name) values(?)',[group_name],(err,result)=>{
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

    let create_attendence_table = 'CREATE TABLE IF NOT EXISTS '+table_name+'_attendence_record (id int AUTO_INCREMENT PRIMARY KEY,name varchar(255),date varchar(10),attendence varchar(10))'

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
    sqlquery = 'select * from '+group_name
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

    sqlquery = 'insert into '+ group_name + '(name,phone,address,comments) values(?,?,?,?)';

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
    var conformation;
    let {data} = req.body;
    let sqlquery = 'insert into '+group_name+'_attendence_record(name,date,attendence) values(?,?,?)'

    for(let i=0;i<data.length;i++){
        db.query(sqlquery,[data[i].person_name,data[i].date,data[i].marks_attendence] , (err,result) =>{
            // console.log(' am here');
            if(err){
                conformation = false;
            }
            else{
                conformation = true;
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

    sqlquery = 'update '+group_name+' set name = ?,phone=?,address=?,comments=? where id = ?';
    db.query(sqlquery,[name,phone,address,comments,id],(err,result)=>{
        if(err){
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

app.listen(3000,()=>{
    console.log("server listen at 3000 port");
});