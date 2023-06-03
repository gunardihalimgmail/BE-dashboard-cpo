const express = require('express');
const { getData_SQL_Await }  = require('../static/koneksi')

const child = express.Router();

// middleware (termasuk jika ingin memasukkan logic webtoken)
const funcMid = require('./middleware');

// GET LOGIN
child.post('/login', funcMid, async (req, res) => {

    let username = req.body?.['username'];
    let password = req.body?.['password'];

	res.setHeader('Content-Type','application/json')
    res.setHeader('Access-Control-Allow-Origin','*')

    if (username == '' || username == null ||
        password == '' || password == null)
    {
				res.status(400).send(
					{
						statusCode: 400,
						message: 'No Result'
					}
				)
    }

		else{
				let company_id_arr = [];
				// array company id => [1,2,3]
				await getData_SQL_Await('SELECT DISTINCT company_id FROM Ms_User_Company WHERE username = \'' + username + '\'')
				.then((result) => {
					if (typeof result != 'undefined' && result != null){
						if (result.length > 0){
							// map dulu untuk bentuk jadi array satu dimensi (e.g. [1,2,3]), 
							// kemudian filter hanya ambil yang tidak null
							company_id_arr = result.map((com,idx)=>{
									return com?.['company_id']
								}).filter(Boolean);
						}
					}
				})

				// periksa jika tidak ada company apapun untuk user bersangkutan, maka tidak dikasih akses untuk masuk
				if (company_id_arr.length == 0){
					return res.status(400).send({
						status: 'failed',
						statusCode: 400,
						message: 'No Access for Any Company'
					})
				}

				// join semua company arr (e.g => in(1,2,3))
				let company_id_arr_join;
				company_id_arr_join = company_id_arr.join(",");

				let device_id_arr = [];
				// ['TANK12_HP_PAMALIAN','TANK34_HP_PAMALIAN']

				await getData_SQL_Await('SELECT distinct id_device FROM Ms_Company_Tangki WHERE company_id in(' + company_id_arr_join + ')')
				.then((result_device)=>{
					if (typeof result_device != 'undefined' && result_device != null){
						if (result_device.length > 0){
							// map dulu untuk bentuk jadi array satu dimensi (e.g. ['TANK12_HP_PAMALIAN','TANK34_HP_PAMALIAN']), 
							// kemudian filter hanya ambil yang tidak null
							device_id_arr = result_device.map((device,idx)=>{
									return device?.['id_device']
							}).filter(Boolean);
						}
					}
				})

				// periksa jika tidak ada device id apapun untuk user bersangkutan, maka tidak dikasih akses untuk masuk
				if (device_id_arr.length == 0){
					return res.status(400).send({
						status: 'failed',
						statusCode: 400,
						message: 'No Access for Any Device'
					})
				}


				let company_select_arr = [];
				// example : [{value:1, label:'PT. TASK 3'}, {value:2, label:'PT. TASK 1'}]
				await getData_SQL_Await('SELECT * FROM Ms_Company WHERE id in(' + company_id_arr_join + ')')
				.then((result_comp_sel)=>{
					if (typeof result_comp_sel != 'undefined' && result_comp_sel != null){
						if (result_comp_sel.length > 0){
							company_select_arr = result_comp_sel.map((comp_sel,idx_sel)=>{
								return {
									value: comp_sel?.['id'],
									label: comp_sel?.['company_name']
								}
							})
						}
					}
				})

				await getData_SQL_Await('SELECT distinct id_device FROM Ms_Company_Tangki WHERE company_id in(' + company_id_arr_join + ')')
				.then((result_device)=>{
					if (typeof result_device != 'undefined' && result_device != null){
						if (result_device.length > 0){
							// map dulu untuk bentuk jadi array satu dimensi (e.g. ['TANK12_HP_PAMALIAN','TANK34_HP_PAMALIAN']), 
							// kemudian filter hanya ambil yang tidak null
							device_id_arr = result_device.map((device,idx)=>{
									return device?.['id_device']
							}).filter(Boolean);
						}
					}
				})
				
				getData_SQL_Await('SELECT * FROM (SELECT username, password, cast(decryptbyasymkey(ASYMKEY_ID(N\'iotTIS88jkT\'), password) as nvarchar(max))' + 
												'as pass_dec, user_level FROM Ms_Login WHERE username = \'' + username + '\'' + 
												') AS TEMP ' + 
												'WHERE pass_dec = \'' + password + '\''
				).then((result)=>{
						
							if (typeof result?.[0] == 'undefined' || result?.[0] == null)
							{
									res.status(400).send({
										status: 'failed',
										statusCode: 400,
										message: 'No Result'
									})
							}
							else{

								// INSERT TO LOG TABLE
								getData_SQL_Await('INSERT INTO Tbl_Log(timestamp, username, activity) ' + 
													'VALUES(CURRENT_TIMESTAMP, \'' + username + '\', \'Login\')')
								.then((result_log)=>{

									setTimeout(()=>{
											res.status(200).send({
													statusCode: 200,
													message: 'Data Valid',
													user_level: result?.[0]?.['user_level'],
													company_id: [...company_id_arr],
													company_select: [...company_select_arr],
													device_id: [...device_id_arr]
											})
									},100)
								})

							}
				})


		}
})
// ... end <LOGIN>

module.exports = child;