const express = require("express");
const { getData_SQL_Await }  = require('../static/koneksi')
const CryptoJS = require('crypto-js');

const child = express.Router();

// middleware (termasuk jika ingin memasukkan logic webtoken)
const funcMid = require('./middleware');

// CREATE NEW USER
child.post('/user/create', funcMid, async (req, res) => {

		let created_user = req.body?.['created_user'];
		let username = req.body?.['username'];
		let password = req.body?.['password'];
		let chiper_code = req.body?.['chiper_code'];
		let user_level = req.body?.['user_level'];		// new user level
		let parent_user_level = req.body?.['parent_user_level'];		// parent user level
		let company = req.body?.['company'];	// company

		if (typeof created_user == 'undefined'){created_user = ''}

		// console.log(user_level)

		res.setHeader('Content-Type','application/json')
		res.setHeader('Access-Control-Allow-Origin','*')

		if (typeof username == 'undefined' || username == '' || username == null ||
			typeof password == 'undefined' || password == '' || password == null ||
			typeof chiper_code == 'undefined' || chiper_code == '' || chiper_code == null ||
			typeof user_level == 'undefined' || user_level == '' || user_level == null ||
			typeof parent_user_level == 'undefined' || parent_user_level == '' || parent_user_level == null ||
			(typeof company == 'undefined' || company == null || (typeof company == 'string' && company == ''))
		)
		{
			return res.status(400).send(
				{
					status:'failed',
					statusCode: 400,
					message: 'Check your input such as Username, Company, Password, Chiper Code, ' + 
								'User Level and Parent User Level !'
				}
			)
		}
		else
		{
			let company_arr;

			try{
				// convert jadi array jika masih string
				if (typeof company == 'string'){
					company_arr = JSON.parse(company);
				}
				else if (typeof company == 'object' || 
						Array.isArray(company))
				{
					company_arr = company;
				}

				if (company_arr.length == 0){
					
					return res.status(400).send({
						status:'failed',
						statusCode: 400,
						message: 'Company can\'t be empty !'
					})
				}

				let company_join = company_arr.join(",");	// 1,2,3 for query in(1,2,3)

				// wait until ms_company is done to check exists or not and execute next logic
				let isExistsDataCompany = false

				await getData_SQL_Await('SELECT id, company_name, bgcolor_gl, centroid_lng, centroid_lat ' + 
							'FROM Ms_Company WHERE id in (' + company_join + ')')
				.then((result)=>{
					if (result.length == company_arr.length){
						isExistsDataCompany = true;
					}
				})

				// console.log(" ==== SELANJUTNYA ==== ")
				// console.log("isExistsDataCompany : " + isExistsDataCompany)

				if (!isExistsDataCompany){
					return res.status(400).send({
						status:'failed',
						statusCode: 400,
						message: 'There are one or more Companies not exists in database !'
					})
				}
			}
			catch(e){
				return res.status(400).send({
					status:'failed',
					statusCode: 400,
					message: 'Check your Company input, it must be Array Type !'
				})
			}

			let arr_dec_chiper = [];
			let dec_chiper = '';

			// CHIPER CODE
			try {
				dec_chiper = CryptoJS.AES.decrypt(chiper_code, "!otTIS88jkT").toString(CryptoJS.enc.Utf8)
			}catch(e){
				console.log(e);
				dec_chiper = '';
			}
			if (dec_chiper == '')
			{
				console.log("Error Chiper Code")
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
				console.log(e);
				dec_chiper_pass = '';
			}
			if (dec_chiper_pass == '')
			{
				console.log("Error Password")
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
				console.log(e);
				dec_chiper_user_level = '';
			}
			if (dec_chiper_user_level == '')
			{
				console.log("Error User Level")
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
				console.log(e);
				dec_chiper_parent_user_level = '';
			}
			if (dec_chiper_parent_user_level == '')
			{
				console.log("Error Parent user Level")
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
					statusCode: 400,
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
						statusCode: 400,
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
									statusCode: 400,
									message: 'Username ' + username +' is exists !'
							}
							res.status(400).send(
								{
									...obj_result
								}
							)
					}
					else{

						// encrypt pakai Sha256
						let pass_sha256 = CryptoJS.SHA256(dec_chiper_pass).toString();

						getData_SQL_Await('INSERT INTO Ms_Login(' + 
									'username, password, user_level, created_date, created_user, active)' + 
									'VALUES(' + 
									// '\'' + username + '\', ENCRYPTBYASYMKEY(ASYMKEY_ID(\'iotTIS88jkT\'), CAST(\'' + dec_chiper_pass + '\' AS NVARCHAR(MAX))),' +
									'\'' + username + '\',CAST(\'' + pass_sha256 + '\' as VARBINARY),' +
									'\'' + dec_chiper_user_level +'\', GETDATE(), \''+ created_user + '\', 1)'
						).then((result)=>{

							// ('abc',1),('def',2)
							let company_ins_tmp = ''
							for (let companyid of company_arr){
								company_ins_tmp += '(\'' + username + '\',' + companyid +'),'
							}
							// hilangkan sisa koma di ujung
							company_ins_tmp = company_ins_tmp.substring(0, company_ins_tmp.length-1)

							getData_SQL_Await('INSERT INTO Ms_User_Company(username, company_id) VALUES ' + company_ins_tmp)
								.then((result_user_company)=>{

									// INSERT TO LOG TABLE
									getData_SQL_Await('INSERT INTO Tbl_Log(timestamp, username, activity) ' + 
														'VALUES(CURRENT_TIMESTAMP, \'' + created_user + '\', \'Create User for ' + username + '\')')
									.then((result_log)=>{
	
										res.status(200).send({
											status: 'Success'
										})
									})
								})
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
			})

			
		}
	
})

module.exports = child;