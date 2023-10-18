const express = require("express");
const { getData_SQL_Await }  = require('../static/koneksi');

const child = express.Router();

// middleware (termasuk jika ingin memasukkan logic webtoken)
const funcMid = require('./middleware');

// const funcMid = (req, res, next) => {
//     console.log("Middleware Child Volume");
//     next();
// }

child.get('/get/devicevalidpattern', funcMid, (req,res)=>{

    setTimeout(()=>{
    
        res.setHeader("Content-Type","application/json")
        res.setHeader('Access-Control-Allow-Origin','*')
    
        getData_SQL_Await('SELECT device_patt FROM dbo.Ms_Device_Valid_Pattern')
        .then(result=>{
            let convToArray = result.map((obj, idx)=>{
                return obj?.['device_patt']
            });

            res.status(200).send(convToArray);
        })
    },100)
})

module.exports = child;