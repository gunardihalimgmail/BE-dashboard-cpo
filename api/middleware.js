const jwt = require('jsonwebtoken');

const funcMid = (req, res, next) => {
    console.log("Middleware Child Company");


    // // === TOKEN IMPLEMENTATION === 
    
    // if (!token) {
    // return res.status(403).send("A token is required for authentication");
    // }

    // const token = req.headers.authorization.replace(/Bearer /i,'').trim();

    // console.log(token);
    // try{
    //     const decoded = jwt.verify(token , 'testingjwt');
    //     console.log("decode : " + JSON.stringify(decoded));
    // }catch(err){
    //     return res.status(401).send({status : 'Invalid Token'});
    // }
    
    next();
}

module.exports = funcMid;