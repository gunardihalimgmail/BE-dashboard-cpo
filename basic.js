var names = "James";
console.log(names);

var greet = (name) => {
    // console.log(`Hello Welcome, ${name}`)
    return `Hello Welcome, ${name}`;
}

setTimeout(() => {
    console.log("SET TIME OUT")
    clearInterval(int)
}, 1500);

let hitung = 0;

var int = setInterval(()=>{
    console.log("INTERVAL : ", hitung);
    hitung++;
},300)

console.log(greet("April"))
console.log(greet("May"))