const express = require("express");
const { getData_SQL_Await }  = require('../static/koneksi')
const CryptoJS = require('crypto-js');

const child = express.Router();

// middleware (termasuk jika ingin memasukkan logic webtoken)
const funcMid = require('./middleware');

// UPDATE JENIS CPO / PKO
child.post('/update/profiletangki', funcMid, (req, res) => {
	let username = req.body?.['username'] ?? '';
	let company_id = req.body?.['company'] ?? '';
	let tangki = req.body?.['tangki'] ?? '';
	let tinggi_profile = req.body?.['tinggi_profile'] ?? '';

	res.setHeader('Content-Type','application/json')
	res.setHeader('Access-Control-Allow-Origin','*')

	if (company_id == '' || tangki == '' || tinggi_profile == '')
	{
		res.status(400).send({
			status:'failed',
			statusCode:400,
			message: 'Check your input such as Company, Tangki and Tinggi Profile !'
		})
	}
	else
	{
		let tinggi_profile_convNumber;
		try{
			// tinggi profile harus angka, jika bukan maka parsing error
			if (isNaN(tinggi_profile)){
				res.status(400).send({
					status: 'failed',
					statusCode: 400,
					message: 'Tinggi Profile must be Number Type'
				})
			}
			else{
				tinggi_profile_convNumber = parseFloat(tinggi_profile) / 100;
			}
		}
		catch(e){
			if (typeof tinggi_profile != 'number'){
				res.status(400).send({
					status: 'failed',
					statusCode: 400,
					message: 'Tinggi Profile must be Number Type'
				})
			}
		}

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
						console.log(tinggi_profile_prev)
						console.log(tinggi_profile_convNumber)

						getData_SQL_Await(
							'UPDATE [IOT_MS].[dbo].[Ms_Company_Tangki] ' + 
							'SET tinggi_profile = ' + tinggi_profile_convNumber + 
							' WHERE company_id = ' + company_id + 
							' and tangki_id = \'' + tangki + '\''
						).then((result)=>{

							// INSERT TO LOG TABLE
							getData_SQL_Await('INSERT INTO Tbl_Log(timestamp, username, activity) ' + 
												'VALUES(CURRENT_TIMESTAMP, \'' + username + '\', \'Update Profile Tangki (Update) : ' + '|' + company_id + '|' + tangki + '|T.Profile Sebelum:' + tinggi_profile_prev.toString() + '|T.Profile Update:' + tinggi_profile.toString() + '\')')
							.then((result_log)=>{

									res.status(200).send({
										status: 'Success'
									})
									
							})
		
						}).catch((e)=>{
		
							res.status(400).send({
								status:'failed',
								statusCode: 400,
								message: e?.['name']
							})
						})

					}
				})


			}
		})
	}


})

module.exports = child;