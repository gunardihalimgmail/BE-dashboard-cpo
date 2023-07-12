const express = require("express");
const { getData_SQL_Await }  = require('../static/koneksi')
const CryptoJS = require('crypto-js');

const child = express.Router();

// middleware (termasuk jika ingin memasukkan logic webtoken)
const funcMid = require('./middleware');

// UPDATE JENIS CPO / PKO
child.get('/get/profiletangki', funcMid, (req, res) => {
	let company_id = req.query?.['company_id'] ?? '';
	let tangki = req.query?.['tangki_id'] ?? '';

	res.setHeader('Content-Type','application/json')
	res.setHeader('Access-Control-Allow-Origin','*')

	if (company_id == '' || tangki == '')
	{
		res.status(400).send({
			status:'failed',
			statusCode:400,
			message: 'Check your input such as Company and Tangki !'
		})
	}
	else
	{
		let tinggi_profile_convNumber;

		getData_SQL_Await('SELECT * FROM Ms_Company WHERE id = ' + company_id)
		.then((result)=>{

			if (result.length == 0)
			{
				res.status(400).send({
					status:'failed',
					statusCode: 400,
					message: 'Company is not exists !'
				})
				return
			}
			else
			{

				// periksa jika data sudah ada, maka di update sebaliknya di insert
				getData_SQL_Await(
						'SELECT * ' + 
						'FROM [IOT_MS].[dbo].[Ms_Company_Tangki] AS ms_comp_tank ' +
						'WHERE ms_comp_tank.tangki_id = \'' + tangki + '\'' +
						' AND ms_comp_tank.company_id = ' + company_id
				).then(result=>{
					if (result.length == 0){

						res.status(400).send({
							status:'failed',
							statusCode: 400,
							message: 'Data in Master Company Tangki is not exists !'
						})
					}
					else
					{

						let tinggi_profile_prev = result[0].tinggi_profile * 100;

						res.status(200).send({
							status:'success',
							statusCode: 200,
							result: {
										'company_id': parseFloat(company_id),
										'tangki_id': tangki,
										'tangki_name': result[0].tangki_name,
										'id_device': result[0].id_device,
										'tinggi_profile': tinggi_profile_prev,
										'tinggi_kalibrasi': result[0].tinggi_kalibrasi,
										'volume_maks': result[0].volume_maks
									}
						})

					}
				})


			}
		})
	}


})

module.exports = child;