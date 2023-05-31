const express = require("express");
const { getData_SQL_Await }  = require('../static/koneksi')

const child = express.Router();

const jwt = require('jsonwebtoken');

// middleware (termasuk jika ingin memasukkan logic webtoken)
const funcMid = require('./middleware');

child.get('/company', funcMid, (req,res)=>{
	setTimeout(()=>{
		let id = req?.['query']?.['id'];
    
        res.setHeader("Content-Type","application/json")
        res.setHeader('Access-Control-Allow-Origin','*')

		if (typeof id != 'undefined' && id != null)
        {
			getData_SQL_Await('SELECT * FROM dbo.Ms_Company where id = ' + id).then(result=>{
				if (result.length == 0){
					res.status(200).send({
						status: 'failed',
						message: 'Company ID ' + id + ' Not Found' 
					})
				}
				else{
					res.status(200).send(result)
				}
            })

			// res.status(404).send({
			// 	statusCode: 404,
			// 	message:'Company ' + company + ' Not Found'
			// })
		}
		else{
			getData_SQL_Await('SELECT * FROM dbo.Ms_Company').then(result=>{
                res.status(200).send(result)
            })
		}
	},100)
})

module.exports = child;