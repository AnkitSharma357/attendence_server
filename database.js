const mysql = require('mysql');
require('dotenv').config();
const connection = mysql.createConnection({
    host: process.env.host,
    user: process.env.user,
    password: process.env.password,
    // port: process.env.port,
    database: process.env.database
})

connection.connect((err)=>{
    if(err){
        console.log(err);
        console.log("not connected");
    }
    else{
        console.log("connected successfully");
    }
});


// connection.end((err)=>{
//     if(err){
//         console.log("not disconnected");
//     }
//     else{
//         console.log("disconnected successfully");
//     }
// })
module.exports = connection;