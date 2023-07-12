const express = require("express");
const { getData_SQL_Await }  = require('../static/koneksi')
const CryptoJS = require('crypto-js');

const child = express.Router();

// middleware (termasuk jika ingin memasukkan logic webtoken)
const funcMid = require('./middleware');

// UPDATE JENIS CPO / PKO
child.post('/update/jenis', funcMid, (req, res) => {
	let username = req.body?.['username'] ?? '';
	let tanggal = req.body?.['tanggal'] ?? '';
	let company_id = req.body?.['company'] ?? '';
	let tangki = req.body?.['tangki'] ?? '';
	let jenis = req.body?.['jenis'] ?? '';

	res.setHeader('Content-Type','application/json')
	res.setHeader('Access-Control-Allow-Origin','*')

	if (tanggal == '' || company_id == '' || tangki == '' || jenis == '')
	{
		res.status(200).send({
			status:'failed',
			message: 'Check your input such as tanggal, company, tangki and jenis !'
		})
	}
	else
	{
		
		getData_SQL_Await('SELECT * FROM Ms_Company WHERE id = ' + company_id)
		.then((result)=>{
			// res.status(200).send({
			// 	status: 'Success'
			// })
			if (result.length == 0)
			{
				res.status(200).send({
					status:'failed',
					message: 'Company is not exists !'
				})
				return
			}
			else
			{

				// periksa jika data sudah ada, maka di update sebaliknya di insert
				getData_SQL_Await(
					'SELECT ms_tank_jenis.[id] AS id_tank_jenis' + 
							', ms_tank_jenis.[company_id] ' + 
							', ms_comp.company_name ' + 
							', CONVERT(varchar(max),ms_tank_jenis.[tanggal]) AS tanggal ' + 
							', format(ms_tank_jenis.[tanggal],\'dd MMMM yyyy\') as tanggal_format ' + 
							', ms_tank_jenis.[tangki_name] AS tangki_id ' + 
							', ms_comp_tank.[tangki_name] ' + 
							', ms_tank_jenis.[jenis] ' + 
					'FROM [IOT_MS].[dbo].[Ms_Tangki_Jenis] AS ms_tank_jenis ' +
						'INNER JOIN Ms_Company AS ms_comp ' + 
							'ON ms_tank_jenis.company_id = ms_comp.id ' +
						'INNER JOIN Ms_Company_Tangki AS ms_comp_tank ' + 
							'ON ms_tank_jenis.company_id = ms_comp_tank.company_id ' + 
								'AND ms_tank_jenis.tangki_name = ms_comp_tank.tangki_id ' + 
					'WHERE ms_tank_jenis.tanggal = \'' + tanggal + '\'' +
						'AND ms_tank_jenis.tangki_name = \'' + tangki + '\'' +
						'AND ms_comp.id = ' + company_id
				).then(result=>{
					if (result.length == 0){

						getData_SQL_Await('INSERT INTO Ms_Tangki_Jenis(company_id, tanggal, tangki_name, jenis)' + 
									'VALUES(' + company_id + ', \'' + tanggal + '\', \'' + tangki + '\',\'' + jenis + '\')'
						).then((result)=>{

							// INSERT TO LOG TABLE
							getData_SQL_Await('INSERT INTO Tbl_Log(timestamp, username, activity) ' + 
												'VALUES(CURRENT_TIMESTAMP, \'' + username + '\', \'Update Jenis (Insert) : ' + tanggal + '|' + company_id + '|' + tangki + '|' + jenis + '\')')
							.then((result_log)=>{
								
								res.status(200).send({
									status: 'Success'
								})
							})
		
		
						}).catch((e)=>{
		
							res.status(200).send({
								status:'failed',
								message: e?.['name']
							})
						})
						
					}
					else
					{
						// console.log(tanggal)
						// console.log(tangki)
						// console.log(company_id)
						// console.log(result)

						// console.log(result[0]?.['id_tank_jenis'])

						getData_SQL_Await(
							'UPDATE Ms_Tangki_Jenis ' + 
							'SET jenis = \'' + jenis + '\'' + 
							'WHERE id = ' + result[0]?.['id_tank_jenis']
						).then((result)=>{

							// INSERT TO LOG TABLE
							getData_SQL_Await('INSERT INTO Tbl_Log(timestamp, username, activity) ' + 
												'VALUES(CURRENT_TIMESTAMP, \'' + username + '\', \'Update Jenis (Update) : ' + tanggal + '|' + company_id + '|' + tangki + '|' + jenis + '\')')
							.then((result_log)=>{

									res.status(200).send({
										status: 'Success'
									})
									
							})
		
		
						}).catch((e)=>{
		
							res.status(200).send({
								status:'failed',
								message: e?.['name']
							})
						})

						// getData_SQL_Await('INSERT INTO Ms_Tangki_Jenis(company_id, tanggal, tangki_name, jenis)' + 
						// 			'VALUES(' + company_id + ', \'' + tanggal + '\', \'' + tangki + '\',\'' + jenis + '\')'
						// ).then((result)=>{
		
						// 	res.status(200).send({
						// 		status: 'Success'
						// 	})
		
						// }).catch((e)=>{
		
						// 	res.status(200).send({
						// 		status:'failed',
						// 		message: e?.['name']
						// 	})
						// })
					}
				})


			}
		})
	}


})

module.exports = child;