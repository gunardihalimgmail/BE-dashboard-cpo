const express = require("express");
const { getData_SQL_Await }  = require('../static/koneksi');

const child = express.Router();

// middleware (termasuk jika ingin memasukkan logic webtoken)
const funcMid = require('./middleware');

// const funcMid = (req, res, next) => {
//     console.log("Middleware Child Volume");
//     next();
// }

child.get('/getStatusActive', funcMid, (req,res)=>{

    setTimeout(()=>{
        let user = req?.['query']?.['user'];
        let user_replace = req?.['query']?.['user'].replace(/\'/gi,'\'\'');
    
        res.setHeader("Content-Type","application/json")
        res.setHeader('Access-Control-Allow-Origin','*')
    
        if (typeof user != 'undefined' && user != null)
        {
            getData_SQL_Await('SELECT username, user_level, active from Ms_Login ' + 
                                'WHERE username = \'' + user_replace + '\'')
            .then(result=>{
                if (result.length == 0){
                    return res.status(200).send({
                        statusCode:200,
                        message:'User \'' + user + '\' Not Found'
                    })
                }
                else{
                    let obj_result = result[0];
                    res.status(200).send(obj_result)
                }
            })
        }
        else{
            return res.status(400).send({
                status: 'failed',
                statusCode: 400,
                message:'No Parameter User'
            })
        }
    },100)
})

module.exports = child;