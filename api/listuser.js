const express = require("express");
const { getData_SQL_Await }  = require('../static/koneksi');

const child = express.Router();

// middleware (termasuk jika ingin memasukkan logic webtoken)
const funcMid = require('./middleware');

// const funcMid = (req, res, next) => {
//     console.log("Middleware Child Volume");
//     next();
// }

child.get('/list/user', funcMid, (req,res)=>{

    setTimeout(()=>{
        let user_level = req?.['query']?.['user_level'];
        let user_level_replace = req?.['query']?.['user_level'].replace(/\'/gi,'\'\'');
    
        res.setHeader("Content-Type","application/json")
        res.setHeader('Access-Control-Allow-Origin','*')
    

        if (typeof user_level != 'undefined' && user_level != null)
        {
            getData_SQL_Await('SELECT username, user_level FROM dbo.Ms_login WHERE user_level = \'' + user_level_replace + '\'')
            .then(result=>{
                if (result.length == 0){
                    return res.status(200).send({
                        statusCode:200,
                        message:'User Level \'' + user_level + '\' Not Found'
                    })
                }
                else{
                    res.status(200).send(result)
                }
            })
        }
        else{
            return res.status(400).send({
                status: 'failed',
                statusCode: 400,
                message:'No Parameter User Level'
            })
        }
    },100)
})

module.exports = child;