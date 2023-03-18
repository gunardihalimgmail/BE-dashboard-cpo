// set-ExecutionPolicy RemoteSigned -Scope CurrentUser

const http = require('http')
const _ = require('lodash')

const num = _.random(0, 20);
console.log(num)

const greet = _.once(()=>{
    console.log("Just Running once in lodash")
})

const arr_tmp = [10,30,50,70,90]
const result = _.chunk(arr_tmp,2)
console.log(result)
greet();
greet();

console.log(__dirname)
console.log(__filename)


const server = http.createServer((req, res)=>{
    console.log(req.url, ' -> ', req.method)

    res.setHeader('Content-Type', 'text/html');
    // res.setHeader('Location', 'https://www.google.com');
    res.statusCode = 200
    res.write('<p> Hello : ' + req.url + ' , by method ' + req.method + '</p>');
    res.write('<p> Hello Again </p>');
    res.end();
});

const port = process.env.PORT || 3002;

server.listen(port, 'localhost', ()=>{
    console.log('listening for requests on port 3002 ')
});