const express = require('express');
const querystring = require('querystring');
const url = require('url');
const path = require('path');
const { peoples, ages } = require('./static/people');
const { getData_SQL_Await, getData_SQL, getData_SQL_Await_Login} = require('./static/koneksi');
const port = process.env.PORT || 3007;
const CryptoJS = require('crypto-js')
const cors = require('cors')

// const sql = require('mssql')
// const sql = require('mssql/msnodesqlv8')      // LOCALHOST

// KONEKSI SQL SERVER AUTHENTICATION (BY PASSWORD)
// const sqlConfig_Server = {
//     user: process.env.DB_USER || 'loginiot',
//     password: process.env.DB_PWD || '!otTIS88jkT',
//     database: process.env.DB_NAME || 'IOT',
//     server: '192.168.1.120',
//     // pool: {
//     //   max: 10,
//     //   min: 0,
//     //   idleTimeoutMillis: 30000
//     // },
//     options: {
//       encrypt: false, // for azure  (di false-kan untuk bisa connect ke 192.168.1.120)
//       trustServerCertificate: false // change to true for local dev / self-signed certs
//     }
// }

const app = express();

app.use(cors())
const bodyParser = require('body-parser');
const { isNumberObject } = require('util/types');
const { isEmpty } = require('lodash');
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))

// for not caching, always not modified
app.disable('etag');

let funcMid = function (req, res, next) {
	// setTimeout(()=>{
	console.log('This is MIDDLEWARE')
	next();
	// },50)
}

// api untuk change password
app.post('/login/changepwd', (req, res)=>{
		res.setHeader('Content-Type','application/json')
		res.setHeader('Access-Control-Allow-Origin','*')

		let username = req.body?.['username']
		let password = req.body?.['password']

		let obj_result = {};

		if (typeof username == 'undefined' ||
				typeof password == 'undefined')
		{
				obj_result = {
						status: 'Failed',
						message: 'Check your input such as Username and Password !'
				}
				
				res.status(200).send({
						status: 'Failed',
						message: obj_result?.['message']
				})
		}
		else{

				let dec_chiper = '';
				try {
						dec_chiper = CryptoJS.AES.decrypt(password, "!otTIS88jkT").toString(CryptoJS.enc.Utf8)
				}catch(e){
						dec_chiper = '';
				}

				if (dec_chiper == '')
				{
						obj_result = {
								status: 'Failed',
								message: 'Password got encryption error !'
						}
						
						res.status(200).send({
								status: 'Failed',
								message: obj_result?.['message']
						})
						return
				}

				getData_SQL_Await('UPDATE Ms_Login ' + 
													'SET password = ENCRYPTBYASYMKEY(ASYMKEY_ID(N\'iotTIS88jkT\'),CAST(\'' + dec_chiper + '\' as nvarchar(max)))' + 
													'WHERE username = \'' + username + '\'')
				.then((result)=>{

							res.status(200).send({
									status: 'Success'
							})
				})
		}


		// res.status(200).send({
		// 		status:'Success',
		// 		message:'Username ' + username
		// })
		// console.log(username)
})

// untuk cek apakah username dengan password yang dimasukkan valid
// digunakan pada "Change Password"
app.post('/login/check', (req,res)=>{

    res.setHeader('Content-Type','application/json')
    res.setHeader('Access-Control-Allow-Origin','*')
		
		let username = req.body?.['username'];
		let password = req.body?.['password'];		// chiper AES
		let chiper_code = req.body?.['chiper_code'];	// chiper AES

		// let chiper = CryptoJS.AES.encrypt("!otTIS88jkT", "!otITS88jkT").toString()
		let dec_chiper = '';
		let dec_chiper_pass = '';
		let obj_result = {};

		if (typeof chiper_code == 'undefined' || 
				typeof username == 'undefined' ||
				typeof password == 'undefined')
		{
				obj_result = {
						status: 'Failed',
						message: 'Check your input such as Chiper Code, Username and Password !'
				}
		}
		else{

				let arr_dec_chiper = [];

				// * dekripsi chiper_code (secret code)
				try {
						dec_chiper = CryptoJS.AES.decrypt(chiper_code, "!otTIS88jkT").toString(CryptoJS.enc.Utf8)
				}catch(e){
						dec_chiper = '';
				}
				if (dec_chiper == '')
				{
						arr_dec_chiper = [
								...arr_dec_chiper,
								'Chiper Code'
						]
				}
				// ... end dekripsi chiper_code

				// * dekripsi chiper for Password
				try {
						dec_chiper_pass = CryptoJS.AES.decrypt(password, "!otTIS88jkT").toString(CryptoJS.enc.Utf8)

				}catch(e){
						dec_chiper_pass = '';
				}
				if (dec_chiper_pass == '')
				{
						arr_dec_chiper = [
								...arr_dec_chiper,
								'Password'
						]
				}
				// ... end dekripsi chiper for Password

				let join_dec_chiper = '';
				join_dec_chiper = arr_dec_chiper.join(' and ')
				if (join_dec_chiper != '')
				{
						// PERIKSA APA ADA CHIPER YANG ERROR / TIDAK BISA DI DEKRIPSI
						console.log(join_dec_chiper)
						obj_result = {
								status: 'Failed',
								message: join_dec_chiper + ' got encryption error !'
						}
				}
				else
				if (dec_chiper != '!otTIS88jkT')
				{
					// PERIKSA APA ADA CHIPER CODE SESUAI DENGAN yang terotorisasi
						obj_result = {
								status: 'Failed',
								message: 'Chiper Code is not Authorized !'
						}
				}
		}


		if (Object.keys(obj_result).length > 0)
		{
				res.status(200).send({
					...obj_result
				})
				return
		}
	
		// enc_chiper_pass = CryptoJS.AES.encrypt("!otTIS88jkT", "!otTIS88jkT").toString()
		// console.log(enc_chiper_pass)
		// console.log(dec_chiper)
		// console.log(username)
		// console.log(password)

		// CAST AS VARCHAR(MAX) => UNTUK LOCALHOST
		// CAST AS NVARCHAR(MAX) => UNTUK SERVER 192.168.1.120
		getData_SQL_Await('SELECT * FROM (SELECT username, password, cast(decryptbyasymkey(ASYMKEY_ID(N\'iotTIS88jkT\'), password) as nvarchar(max))' + 
												'as pass_dec, user_level FROM Ms_Login WHERE username = \'' + username + '\'' + 
												') AS TEMP ' + 
												'WHERE pass_dec = \'' + dec_chiper_pass + '\''
				).then((result)=>{
				
					if (result.length == 0)
					{
							obj_result = {
									status: 'Failed',
									message: 'Credential is not valid !'
							}
					}
					else{
							obj_result = {
									status: 'Success'
							}
					}

					// console.log(result)

					res.status(200).send({
						...obj_result
					})
		})
		
})


// TES DOWNLOAD
// app.get('/download', (req,res,next)=>{
// 	let filePath = __dirname + "\\static\\koneksi.js"
// 	console.log(filePath)
// 	// res.download(filePath);
// 	res.download(filePath,(err)=>{
// 		if (err){
// 			res.status(400).send({
// 				status:'Failed',
// 				message: "Error Download File !"
// 			})
// 		}
// 	})
// })

// CREATE NEW USER
app.post('/user/create', (req, res) => {
	let created_user = req.body?.['created_user'];
	let username = req.body?.['username'];
	let password = req.body?.['password'];
	let chiper_code = req.body?.['chiper_code'];
	let user_level = req.body?.['user_level'];		// new user level
	let parent_user_level = req.body?.['parent_user_level'];		// parent user level

	if (typeof created_user == 'undefined'){created_user = ''}

	console.log(user_level)

	res.setHeader('Content-Type','application/json')
    res.setHeader('Access-Control-Allow-Origin','*')

	if (username == '' || username == null ||
        password == '' || password == null ||
		chiper_code == '' || chiper_code == null ||
		user_level == '' || user_level == null ||
		parent_user_level == '' || parent_user_level == null)
    {
		res.status(400).send(
			{
				statusCode: 400,
				message: 'Check your input such as Username, Password, Chiper Code, User Level and Parent User Level !'
			}
		)
	}
	else
	{

		let arr_dec_chiper = [];
		let dec_chiper = '';

		// CHIPER CODE
		try {
			dec_chiper = CryptoJS.AES.decrypt(chiper_code, "!otTIS88jkT").toString(CryptoJS.enc.Utf8)
		}catch(e){
			dec_chiper = '';
		}
		if (dec_chiper == '')
		{
			arr_dec_chiper = [
				...arr_dec_chiper,
				'Chiper Code'
			]
		}

		// PASSWORD
		let dec_chiper_pass = '';
		try {
			dec_chiper_pass = CryptoJS.AES.decrypt(password, "!otTIS88jkT").toString(CryptoJS.enc.Utf8)
		}catch(e){
			dec_chiper_pass = '';
		}
		if (dec_chiper_pass == '')
		{
			arr_dec_chiper = [
				...arr_dec_chiper,
				'Password'
			]
		}

		// USER LEVEL
		let dec_chiper_user_level = '';
		try {
			dec_chiper_user_level = CryptoJS.AES.decrypt(user_level, "!otTIS88jkT").toString(CryptoJS.enc.Utf8)
		}catch(e){
			dec_chiper_user_level = '';
		}
		if (dec_chiper_user_level == '')
		{
			arr_dec_chiper = [
				...arr_dec_chiper,
				'User Level'
			]
		}

		// PARENT USER LEVEL
		let dec_chiper_parent_user_level = '';
		try {
			dec_chiper_parent_user_level = CryptoJS.AES.decrypt(parent_user_level, "!otTIS88jkT").toString(CryptoJS.enc.Utf8)
		}catch(e){
			dec_chiper_parent_user_level = '';
		}
		if (dec_chiper_parent_user_level == '')
		{
			arr_dec_chiper = [
				...arr_dec_chiper,
				'Parent User Level'
			]
		}

		let join_dec_chiper = '';
		// join_dec_chiper = arr_dec_chiper.join(' and ')
		join_dec_chiper = arr_dec_chiper.join(', ')
		join_dec_chiper = join_dec_chiper.replace(/, ([^,]*)$/g,' and $1')
		if (join_dec_chiper != '')
		{
			// PERIKSA APA ADA CHIPER YANG ERROR / TIDAK BISA DI DEKRIPSI
			// console.log(join_dec_chiper)
			obj_result = {
				status: 'Failed',
				message: join_dec_chiper + ' got encryption error !'
			}
			res.status(400).send(
				{...obj_result}
			)
			return
		}


		if (dec_chiper_parent_user_level == 'USER'){
			// jika user level dari parent adalah 'USER', maka account baru tidak bisa di create
			res.status(400).send(
				{
					status: 'Failed',
					message: 'You can\'t create new account for level \'USER\' !'
				}
			)
			return
		}

		getData_SQL_Await('SELECT username, user_level FROM Ms_Login WHERE username = \'' + username +'\''
		).then((result)=>{
		
			// JIKA USERNAME SUDAH ADA, MAKA FAILED
				if (result.length != 0)
				{
						obj_result = {
								status: 'Failed',
								message: 'Username ' + username +' is exists !'
						}
						res.status(400).send(
							{
								...obj_result
							}
						)
				}
				else{
					
					getData_SQL_Await('INSERT INTO Ms_Login(' + 
								'username, password, user_level, created_date, created_user)' + 
							'VALUES(' + 
								'\'' + username + '\', ENCRYPTBYASYMKEY(ASYMKEY_ID(\'iotTIS88jkT\'), CAST(\'' + dec_chiper_pass + '\' AS NVARCHAR(MAX))),' +
								'\'' + dec_chiper_user_level +'\', GETDATE(), \''+ created_user + '\')'
					).then((result)=>{

						res.status(200).send({
							status: 'Success'
						})
						// console.log("RESULT : " + result)
					})

					// res.status(200).send(
					// 	{
					// 		created_user,
					// 		username,
					// 		dec_chiper_pass,
					// 		dec_chiper,
					// 		dec_chiper_user_level
					// 	}	
					// )
				}
			}
		)

		
	}
})
		
// UPDATE JENIS CPO / PKO
app.post('/update/jenis', (req, res) => {

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
		
							res.status(200).send({
								status: 'Success'
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
		
							res.status(200).send({
								status: 'Success'
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




// GET LOGIN
app.post('/login', (req, res) => {

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

				getData_SQL_Await('SELECT * FROM (SELECT username, password, cast(decryptbyasymkey(ASYMKEY_ID(N\'iotTIS88jkT\'), password) as nvarchar(max))' + 
												'as pass_dec, user_level FROM Ms_Login WHERE username = \'' + username + '\'' + 
												') AS TEMP ' + 
												'WHERE pass_dec = \'' + password + '\''
				).then((result)=>{
						
							if (typeof result?.[0] == 'undefined' || result?.[0] == null)
							{
									res.status(400).send({
										statusCode: 400,
										message: 'No Result'
									})
							}
							else{
								setTimeout(()=>{    
										res.status(200).send({
												statusCode: 200,
												message: 'Data Valid',
												user_level: result?.[0]?.['user_level']
										})
								},100)
							}
				})


		}
})
// ... end <LOGIN>


app.get('/volume',funcMid, (req,res)=>{

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

app.get('/company', funcMid, (req,res)=>{
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

app.get('/company/tangki', funcMid, (req, res)=>{
	setTimeout(()=>{

		let company_id = req?.['query']?.['company_id'];
		
        res.setHeader("Content-Type","application/json")
        res.setHeader('Access-Control-Allow-Origin','*')

		if (typeof company_id != 'undefined' && company_id != null)
		{
			try {
				let tesNumber = !isNaN(company_id)

				if (!tesNumber){
					res.status(200).send({
						status: 'failed',
						message: 'Company ID is not type of Number !' 
					})
					return
				}
			}catch(e){
				res.status(200).send({
					status: 'failed',
					message: 'Company ID is failed !' 
				})
				return
			}

			setTimeout(()=>{
				if (isEmpty(company_id)){
					res.status(200).send({
						status: 'failed',
						message: 'Company ID is Empty !' 
					})
					return
				}
				else{
					getData_SQL_Await('SELECT mct.*, mc.company_name FROM dbo.Ms_Company_Tangki mct ' + 
									'inner join Ms_Company mc ON mct.company_id = mc.id ' + 
									'where mct.company_id = \'' + company_id + '\'').then(result=>{
						if (result.length == 0){
							res.status(200).send({
								status: 'failed',
								message: 'Company ID ' + company_id + ' Not Found' 
							})
							return
						}
						else{
							res.status(200).send(result)
						}
					})
				}
			},70)
		}
		else{
			setTimeout(()=>{
				getData_SQL_Await('SELECT * FROM dbo.Ms_Company_Tangki').then(result=>{
					res.status(200).send(result)
				})
			},70)
		}
	},100)
})

// dapatkan jenis berdasarkan parameter company, tanggal, tangki
app.get('/company/tangki/jenis', funcMid, (req, res)=>{
	setTimeout(()=>{

		let tanggal = req?.['query']?.['tanggal'];
		let company_id = req?.['query']?.['company_id'];
		let tangki_id = req?.['query']?.['tangki_id'];
		// console.log(tanggal)
		// console.log(company_id)
		// console.log(tangki_id)
		
        res.setHeader("Content-Type","application/json")
        res.setHeader('Access-Control-Allow-Origin','*')

		if (typeof company_id != 'undefined' && company_id != null &&
			typeof tanggal != 'undefined' && tanggal != null &&
			typeof tangki_id != 'undefined' && tangki_id != null)
		{

			let cek_tanggal;
			try{
				cek_tanggal = new Date(tanggal)
				if (isNaN(cek_tanggal)){
					res.status(200).send(
						{
							status:'failed',
							message: 'Convert Tanggal is failed !'
						}
					)
					return
				}
			}catch(e){
				res.status(200).send(
					{
						status:'failed',
						message: 'Convert Tanggal is failed !'
					}
				)
				return
			}
			

			setTimeout(()=>{
				getData_SQL_Await(
					'SELECT ms_tank_jenis.[company_id] ' + 
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
						'AND ms_tank_jenis.tangki_name = \'' + tangki_id + '\'' +
						'AND ms_comp.id = ' + company_id
				).then(result=>{
					if (result.length == 0){
						res.status(200).send({
							status: 'failed',
							message: 'Data Not Found ! '
						})
						return
					}
					else{
						// console.log(result[0])
						res.status(200).send({
							status: 'Success',
							data:{...result[0]}
						})
					}
				})
			},100)
		}
		else{
			res.status(200).send({
				status: 'failed',
				message: 'Parameter Not Completed !'
			})
			return
		}
	},100)
})


// dapatkan jenis berdasarkan parameter tanggal dan tangki id
app.get('/getJenisByDatentank', funcMid, (req, res)=>{
	// setTimeout(()=>{

		let tanggal = req?.['query']?.['tanggal'];
		let tangki_id = req?.['query']?.['tangki_id'];
		
        res.setHeader("Content-Type","application/json")
        res.setHeader('Access-Control-Allow-Origin','*')
		// console.log(tangki_id)

		if (typeof tanggal != 'undefined' && tanggal != null &&
			typeof tangki_id != 'undefined' && tangki_id != null)
		{

			// tanggal => 2023-03-28
			let cek_tanggal;
			try{
				cek_tanggal = new Date(tanggal)
				if (isNaN(cek_tanggal)){
					res.status(200).send(
						{
							status:'failed',
							message: 'Convert Tanggal is failed !'
						}
					)
					return
				}
			}catch(e){
				res.status(200).send(
					{
						status:'failed',
						message: 'Convert Tanggal is failed !'
					}
				)
				return
			}
			

			// setTimeout(()=>{
				getData_SQL_Await(
					'SELECT mtj.company_id' + 
						', CONVERT(VARCHAR(MAX), mtj.tanggal) AS tanggal ' + 
						', FORMAT(mtj.tanggal, \'dd MMMM yyyy\') AS tanggal_format ' + 
						', mtj.tangki_name AS tangki_id ' + 
						', mct.tangki_name AS tangki_name ' + 
						', mc.company_name ' + 
						', mtj.jenis ' + 
					'FROM Ms_Tangki_Jenis mtj ' + 
					'INNER JOIN Ms_Company mc ' +
						'ON mtj.company_id = mc.id ' + 
					'INNER JOIN Ms_Company_Tangki mct ' +
						'ON mtj.tangki_name = mct.tangki_id AND ' + 
							'mtj.company_id = mct.company_id ' +
					'WHERE mtj.tanggal = \'' + tanggal + '\'' + 
					' AND mtj.tangki_name = \'' + tangki_id.toString() + '\''
				).then(result=>{
					if (result.length == 0){
						res.status(200).send({
							status: 'failed',
							message: 'Data Not Found ! '
						})
						return
					}
					else{
						// console.log(result[0])	
						res.status(200).send({
							status: 'Success',
							data:[...result]
						})
					}
				})
			// },70)
		}
		else{
			res.status(200).send({
				status: 'failed',
				message: 'Parameter Not Completed !'
			})
			return
		}
	// },100)
})


// dapatkan jenis berdasarkan parameter tanggal
app.get('/getJenisByDate', funcMid, (req, res)=>{
	// setTimeout(()=>{

		let tanggal = req?.['query']?.['tanggal'];
		let tangki_id = req?.['query']?.['tangki_id'];
		
        res.setHeader("Content-Type","application/json")
        res.setHeader('Access-Control-Allow-Origin','*')
		// console.log(tangki_id)

		if (typeof tanggal != 'undefined' && tanggal != null)
		{

			// tanggal => 2023-03-28
			let cek_tanggal;
			try{
				cek_tanggal = new Date(tanggal)
				if (isNaN(cek_tanggal)){
					res.status(200).send(
						{
							status:'failed',
							message: 'Convert Tanggal is failed !'
						}
					)
					return
				}
			}catch(e){
				res.status(200).send(
					{
						status:'failed',
						message: 'Convert Tanggal is failed !'
					}
				)
				return
			}
			

			// setTimeout(()=>{
				getData_SQL_Await(
					'SELECT mtj.company_id' + 
						', CONVERT(VARCHAR(MAX), mtj.tanggal) AS tanggal ' + 
						', FORMAT(mtj.tanggal, \'dd MMMM yyyy\') AS tanggal_format ' + 
						', mtj.tangki_name AS tangki_id ' + 
						', mct.tangki_name AS tangki_name ' + 
						', mc.company_name ' + 
						', mtj.jenis ' + 
					'FROM Ms_Tangki_Jenis mtj ' + 
					'INNER JOIN Ms_Company mc ' +
						'ON mtj.company_id = mc.id ' + 
					'INNER JOIN Ms_Company_Tangki mct ' +
						'ON mtj.tangki_name = mct.tangki_id AND ' + 
							'mtj.company_id = mct.company_id ' +
					'WHERE mtj.tanggal = \'' + tanggal + '\''
				).then(result=>{
					if (result.length == 0){
						res.status(200).send({
							status: 'failed',
							message: 'Data Not Found ! '
						})
						return
					}
					else{
						// console.log(result[0])	
						res.status(200).send({
							status: 'Success',
							data:[...result]
						})
					}
				})
			// },70)
		}
		else{
			res.status(200).send({
				status: 'failed',
				message: 'Parameter Not Completed !'
			})
			return
		}
	// },100)
})



// getData_SQL((res)=>{
//     console.log(res)
// })

// const conn = new sql.ConnectionPool({
//     database: "Inventory",
//     server: "(localdb)\MSSQLLocalDB",
//     driver: "msnodesqlv8",
//     options:{
//         trustedConnection: true
//     }
// })

// sample 1
// const sqlConfig_local = {
//     driver:"SQL Server",
//     server:".\\SQLEXPRESS",
//     database: "IOT_MS",
//     options:{
//         trustedConnection:true
//     }
//     // trusted_connection:true
// }

// sample 2
// var config = {
//     connectionString: 'Driver=SQL Server; server=.\\SQLEXPRESS;Database=Student;Trusted_Connection=true;'
//   };

// sql.connect(sqlConfig_local, err => {
//     new sql.Request().query('SELECT top 5 * from dbo.Ms_Volume_Tangki', (err, results) => {

//         // console.log(".:The Good Place:.");

//         if(err) { // SQL error, but connection OK.
//             console.log("==== Error ==== : "+ err);
//         } else { // All is rosey in your garden.
//             console.dir(results?.['recordset'])
//             for (let [i, v] of results?.['recordset'].entries()){
//                 console.dir('Tangki : ' + v?.['tangki'] + ', Tinggi : ' + v?.['tinggi'] +  ', Volume : ' + v?.['volume']);
//             }

//         };
//     })
// })
  


// sql.connect(sqlConfig).then(()=>{
//     // return sql.query("select * from dbo.devices")
//     return sql.query("select * from dbo.devices")
// }).then(results=>{
//     console.log("=== DEVICES ===")
//     for (let [i, v] of results?.['recordset'].entries())
//     {
//         console.log("ID DEVICE : ", v?.['id_device'], " at index : ", i)
//     }
    
//     // sql.query("select * from dbo.users")
//     //         .then((res)=>{
//     //             console.log("=== USERNAME ===")
//     //             for (let [i, v] of res?.['recordset'].entries())
//     //             {
//     //                 console.log("USERNAME : ", v?.['username'], " at index : ", i)
//     //             }
//     //         })
// }).catch(err=>{
//     console.log("ERROR")
// })

// sql.connect(sqlConfig).then(()=>{
//     return sql.query("select * from dbo.users")
// }).then(results=>{
//     console.log("=== USERS ===");
//     for (let [i, v] of results?.['recordset'].entries())
//     {
//         console.log("USERNAME : ", v?.['username'], " at index : ", i)
//     }
// })

// console.dir(results?.['recordset'])
    


// async () => {
//     try {
//         // await sql.connect('Server=192.168.1.120,1433; Database=IOT; User Id=loginiot;password=!otTIS88jkT;Encrypt=true')
//         await sql.connect(sqlConfig)
//         const result = await sql.query`select * from dbo.devices where id=3`
//         console.log("result")
//         console.log(result)
//     }catch(err){
//         console.log("ERROR")
//     }
// }

// app.listen(3007);
// app.use(express.static(path.join(__dirname,'public')))




// app.get('/', (req, res) => {
    
    // res.send('Hello this is \'Index\'')
    // res.setHeader('Content-Type','application/json')
    // res.setHeader('Access-Control-Allow-Origin','*')
    // res.status(200).send({nama:'james', umur: 37})

    // res.redirect('/about')
    // res.sendFile('./views/tes.html', {root: __dirname})
// })


// app.get('/about', (req, res) => {
    // let query_umur = req.query.umur
    // if (typeof query_umur != 'undefined'){
    //     res.send('Hello this is \'About\' WITH UMUR : ' + query_umur)
    // }else{
    //     res.send('Hello this is \'About\'')
    // }
    
    // let rawUrl = 'https://stackabuse.com?page=2&limit=3'
    // let parsedUrl = url.parse(rawUrl)
    // let parsedQs = querystring.parse(parsedUrl.query)
    // // console.log(parsedQs)
// })

// app.get('/about/:id', (req, res) => {
//     let param_id = req.params.id
//     res.send('Hello this is \'About\' WITH ID : ' + param_id)
// })

app.use((req,res)=>{
    // res.status(404).send('<h1 style = "color:red">This is ERROR 404</h1>')
    res.status(404).send(
        {
            statusCode: 404,
            message:'Not Found'
        }
    )
})

app.listen(port, ()=>{
    console.log("Server is listening from Express to 3007")
    // console.log(__dirname)
    // console.log(__filename)
});