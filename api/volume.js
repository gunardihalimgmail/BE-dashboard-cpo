const express = require("express");
const { getData_SQL_Await }  = require('../static/koneksi');

const child = express.Router();

// middleware (termasuk jika ingin memasukkan logic webtoken)
const funcMid = require('./middleware');

// const funcMid = (req, res, next) => {
//     console.log("Middleware Child Volume");
//     next();
// }

child.get('/volume', funcMid, (req,res)=>{

    setTimeout(()=>{
        let tangki = req?.['query']?.['tangki'];
    
        res.setHeader("Content-Type","application/json")
        res.setHeader('Access-Control-Allow-Origin','*')
    
        if (typeof tangki != 'undefined' && tangki != null)
        {
            if (tangki < 1 || tangki > 4){
                res.status(404).send({
                    statusCode: 404,
                    message:'Tangki ' + tangki + ' Not Found'
                })
                return
            }
            else{
                getData_SQL_Await('SELECT * FROM dbo.Ms_Volume_Tangki WHERE tangki = \'' + tangki + '\'').then(result=>{
                    res.status(200).send(result)
                })
            }
        }
        else{
            getData_SQL_Await('SELECT * FROM dbo.Ms_Volume_Tangki').then(result=>{
                res.status(200).send(result)
            })
        }
    },100)
})

module.exports = child;