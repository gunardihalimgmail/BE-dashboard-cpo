const fs = require('fs')

// reading files
// fs.readFile('./docs/blog.txt',(err, data)=>{
//     if (err){
//         console.log(err.toString())
//         return
//     }
//     console.log(data.toString())
// })

// READ SYNCHRONOUS
// const tes = fs.readFileSync('./docs/blog.txt')
// console.log(tes.toString())

//writing files
// fs.writeFile('./docs/blog.txt','This is Ninja', ()=>{
//     console.log("File was writen !")
// })


// creating and removing folder
if (!fs.existsSync('./assets')){
    fs.mkdir('./assets', (err)=>{
        if (err){
            console.log(err.toString())
            return
        }
        console.log('Folder was created !')

        // create file for delete tes
        fs.writeFile('./docs/deletetes.txt','Files for deleted !', ()=>{
            console.log("Files for deleted was created")
        })
    })
}
else{
    fs.rmdir('./assets', (err)=>{
        if (err)
        {
            console.log(err.toString())
            return
        }
        console.log('Folder was removed !')
    })
}

// deleting files
const filename = './docs/deletetes.txt';
if (fs.existsSync(filename)){
    fs.unlink(filename, (err) => {
        if (err){
            console.log(err.toString())
            return
        }
        console.log("Files was deleted !")
    })
}
