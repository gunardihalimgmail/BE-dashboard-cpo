const sql = require('mssql/msnodesqlv8')      // LOCALHOST

// read file .env (variables)
require("dotenv").config();

const sqlConfig_local = {
    driver:"SQL Server",
    server:".\\SQLEXPRESS",
    database: "IOT_MS",
    options:{
        trustedConnection:true
    }
    // trusted_connection:true
}

// LIVE
const sqlConfig_Server = {
    user: process.env.DB_USER || 'loginiot',
    password: process.env.DB_PWD || '!otTIS88jkT',
    driver:"SQL Server",
    database: process.env.DB_NAME || 'IOT_MS',
    server: '192.168.1.120',
    // options:{
    //     trustedConnection:true
    // }
    // pool: {
    //   max: 10,
    //   min: 0,
    //   idleTimeoutMillis: 30000
    // },
    options: {
      encrypt: false, // for azure  (di false-kan untuk bisa connect ke 192.168.1.120)
      trustServerCertificate: false // change to true for local dev / self-signed certs
    }
}

let getData_Arr = [];

// CARA SYNCHRONOUS
const getData_SQL_Await = async (query) => {
    // let pool = await sql.connect(sqlConfig_local);
    // let pool = await sql.connect(sqlConfig_Server);
    // let data = await pool.request()
    let pool = await sql.connect(sqlConfig_Server);
    let data = await pool.request()
                .query(query)
                // .input("param_tangki",sql.VarChar, '1')
                // .query('SELECT TOP 5 * FROM dbo.Ms_Volume_Tangki WHERE tangki = isnull(@param_tangki,tangki)');

    // pool.close();
    // sql.close();

    return data.recordset;
}

// CARA SYNCHRONOUS WITH INPUT PARAMETER
const getData_SQL_Await_Login = async () => {
    // let pool = await sql.connect(sqlConfig_local);
    let pool = await sql.connect(sqlConfig_Server);
    let data = await pool.request()
                .input('pass',sql.VarChar, 'iotTIS88jKT')
                .query('SELECT username, password, ' + 
                        'cast(decryptbyasymkey(ASYMKEY_ID(@pass), password) as varchar(max))' + 
                        'as dekripsi FROM ms_login WHERE username = \'admin\'')

                // .input("param_tangki",sql.VarChar, '1')
                // .query('SELECT TOP 5 * FROM dbo.Ms_Volume_Tangki WHERE tangki = isnull(@param_tangki,tangki)');

    pool.close();
    sql.close();

    return data.recordset;
}


// CARA ASYNCHRONOUS
const getData_SQL = (callback) => {

    // sql.connect(sqlConfig_local, err => {
    sql.connect(sqlConfig_Server, err => {
        new sql.Request().query('SELECT top 5 * from dbo.Ms_Volume_Tangki', (err, results) => {
    
            // console.log(".:The Good Place:.");
    
            if(err) { // SQL error, but connection OK.
                console.log("==== Error ==== : "+ err);
                hasil = "Error"
                callback(hasil)
            } else { // All is rosey in your garden.
                hasil = results?.['recordset']
                callback(hasil)
                // console.dir(results?.['recordset'])
                // for (let [i, v] of results?.['recordset'].entries()){
                //     console.dir('Tangki : ' + v?.['tangki'] + ', Tinggi : ' + v?.['tinggi'] +  ', Volume : ' + v?.['volume']);
                // }
    
            };
        })
    })
}

module.exports = {
    getData_SQL_Await,
    getData_SQL,
    getData_SQL_Await_Login
}

exports.getData_SQL_Await = getData_SQL_Await
exports.getData_SQL = getData_SQL