const fs = require('fs')

// encoding -> utf8 (konversi ke text readable)
const readStream = fs.createReadStream('./docs/blog.txt', {encoding:'utf8'})
const writeStream = fs.createWriteStream('./docs/writeStreamTes.txt')
readStream.on('data', (chunk)=>{
    console.log("===== NEW CHUNK =====")
    console.log(chunk)

    // cara pertama write stream
    // writeStream.write("===== NEW CHUNK =====\n")
    // writeStream.write(chunk)
})

writeStream.write("=== NEW CHUNK ===\n")
readStream.pipe(writeStream)
