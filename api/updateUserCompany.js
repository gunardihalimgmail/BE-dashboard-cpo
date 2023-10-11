const express = require("express");
const { getData_SQL_Await }  = require('../static/koneksi')
const CryptoJS = require('crypto-js');

const child = express.Router();

// middleware (termasuk jika ingin memasukkan logic webtoken)
const funcMid = require('./middleware');
const _ = require("lodash");

// UPDATE USER COMPANY
child.post('/usercompany/update', funcMid, async (req, res) => {

        // console.log(req.body?.['active'])
        // console.log(typeof (req.body?.['active']))

        let active_user = 0;
        if (typeof req.body?.['active'] == 'string'){
            active_user = req.body?.['active'].toString().toLowerCase() == "true" ? 1 : 0;
        }
        else if (typeof req.body?.['active'] == 'boolean'){
            active_user = req.body?.['active'] == true ? 1 : 0;
        }

		let user = req.body?.['user'];      // {}
		let company = req.body?.['company'];    // []
		let created_user = req.body?.['created_user'];    // 'admin' user yang update
        
		res.setHeader('Content-Type','application/json')
		res.setHeader('Access-Control-Allow-Origin','*')

		if (typeof user == 'undefined' || user == null ||
            typeof company == 'undefined' || company == null ||
            typeof created_user == 'undefined' || created_user == null){

                return res.status(400).send({
                    status:'failed',
                    statusCode: 400,
                    message: 'Check your input such as User (Object), Company (Array) and Creator !'
                })
        };

        try{

            if (typeof user == 'string'){user = JSON.parse(user);}    // object
            if (typeof company == 'string'){company = JSON.parse(company)} // object array

            if (_.isEmpty(user))
            {
                return res.status(400).send({
                            status:'failed',
                            statusCode: 400,
                            message: 'Input User can\'t be empty !'
                        })
            }

        }catch(e){
            return res.status(400).send({
                status:'failed',
                statusCode: 400,
                message: 'Check your input such as User (Object) and Company (Array) !'
            })
        }
        
        // console.log(user)
        // console.log(company)

        let user_value = user?.['value']; // eg: 'user1'

        let company_value = [];
        if (company.length > 0){    // [('user1',1),('user1',2)]
            company_value = company.map((ele_com, idx_com)=>{
                return '(\'' + user_value + '\',' + ele_com?.['value'] + ')';
            })
        }

        let company_ins = company_value.join(",");  // "('user1',1),('user1',2)"
        
        // Delete dahulu user yang ada di Ms_User_Company
        await getData_SQL_Await('DELETE FROM Ms_User_Company ' + 
                    'WHERE username = \'' + user_value + '\''
        ).then((result=>{}));

        // Jika ada data company, maka di insert
        let activity = '';
        if (company_value.length > 0)
        {
            activity = 'Update User Company (Update) for ' + user_value;

            try{
                await getData_SQL_Await('INSERT INTO Ms_User_Company(' + 
                            'username, company_id) ' + 
                            'VALUES' + company_ins
                ).then((result)=>{})
            }catch(e){
                res.status(400).send({
                    status: 'failed',
                    statusCode: 400,
                    message: e
                })      
            }
        }
        else{
            activity = 'Update User Company (Delete All Company) for ' + user_value;
        }
         // INSERT TO LOG TABLE
                    
         await getData_SQL_Await('INSERT INTO Tbl_Log(timestamp, username, activity) ' + 
                            'VALUES(CURRENT_TIMESTAMP, \'' + created_user + '\', \'' + activity + '\')')
        .then((result_log)=>{})

        // UPDATE STATUS ACTIVE USER

        await getData_SQL_Await('UPDATE Ms_Login ' + 
                                'SET active=' + active_user +
                                ' WHERE username = \'' + user_value + '\'')
        .then((result_log)=>{})

        res.status(200).send({
            status: 'success',
            statusCode: 200
        })

        return
})

module.exports = child;