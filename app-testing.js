const express = require('express');
const querystring = require('querystring');
const url = require('url');
const path = require('path');
const { peoples, ages } = require('./static/people');
const port = process.env.PORT || 3007;

const app = express()

// app.listen(3007);
app.use(express.static(path.join(__dirname,'public')))
app.listen(port, ()=>{
    console.log("Server is listening from Express to 3007")
});

// app.use('/',express.static(__dirname + '/public'))
// app.use(path.join(__dirname, 'static'));

// for not caching, always not modified
app.disable('etag');

// PENGGUNAAN "next" untuk lanjut ke step berikut nya, asalkan jangan res.send
// app.use((req,res, next)=>{
//     console.log("halo app use")
//     // res.send("halo app use");
//     next();
// });

// app.use((req,res, next)=>{
//     console.log("halo app use 22")
//     // res.send("halo app use 22");
//     next();
// });
// ... END 


app.get('/', (req, res) => {
    // res.send('Hello this is \'Index\'')
    res.setHeader('Content-Type','application/json')
    res.setHeader('Access-Control-Allow-Origin','*')
    res.status(200).send({nama:'james', umur: 37})
    // res.redirect('/about')
    // res.sendFile('./views/tes.html', {root: __dirname})
})


app.get('/about', (req, res) => {

    let query_umur = req.query.umur
    if (typeof query_umur != 'undefined'){
        res.send('Hello this is \'About\' WITH UMUR : ' + query_umur)
    }else{
        res.send('Hello this is \'About\'')
    }
    
    let rawUrl = 'https://stackabuse.com?page=2&limit=3'
    let parsedUrl = url.parse(rawUrl)
    let parsedQs = querystring.parse(parsedUrl.query)
    // console.log(parsedQs)
})

app.get('/about/:id', (req, res) => {
    let param_id = req.params.id
    res.send('Hello this is \'About\' WITH ID : ' + param_id)
})

app.use((req,res)=>{
    res.status(404).send('<h1 style = "color:red">This is ERROR 404</h1>')
})