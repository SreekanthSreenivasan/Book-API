var express = require("express");
var app = express();
var cors = require("cors")
var bodyParser = require("body-parser")
var jwt = require("jsonwebtoken")
var mySql = require("mysql"); 

var jsonParser = bodyParser.json();

var urlEncoded = bodyParser.urlencoded({extended:false})

app.use(cors());


var con = mySql.createConnection({
    host: "localhost",
    user: "root",
    password:"",
    database: "book_db"
})


con.connect(function(err){
    if(err){
        throw err;
    }
    console.log("connected to database")
})
// authentivcation middleware
 function verifyToken(req,res,next){
     let authHeader = req.headers.authorization;
     if(authHeader== undefined){
         res.status(401).send({error:"no token provided"})
     }
     let token = authHeader.split(" ")[1]
     jwt.verify(token, "secret", function(err,decoded){
         if(err){
             res.status(401).send({error:"Authentication failed"})
         }
         else{
             next();
         }
     })
 }

app.post("/login",jsonParser, function(req,res){
    if(req.body.username == undefined || req.body.password== undefined){
        res.status(500).send({error:"Authentication failed"});
    }
    let username = req.body.username;
    console.log(username)
    let password = req.body.password;
    let qr = ` select display_name from users where user_name = '${username}' and password = sha1('${password}') `

    con.query(qr, function(err,result){
        if(err || result.length==0){
            res.status(500).send("login failed")
        }
       else{
           let resp = {
               id : result[0].id,
               display_name : result[0].display_name
           }
           let token = jwt.sign(resp, "secret", {expiresIn:60});
           res.status(200).send({auth:true, token:token});
       }
    })
})
// list of all book
app.get("/book",verifyToken, function(req,res){

    con.query('select * from books', function(err, result, fields ){
        if(err){
            throw err;
        }
        console.log(result)
        res.send(result)
    })

});

// get one book
app.get("/book/:id", function(req,res){
    let id= req.params.id;

        let qr = `select * from books where id="${id}"`
        con.query(qr, function(err, result, fields){
            if(err){
                throw err;
            }
            res.send(result)
        })


})
// insert a book
app.post("/book" ,jsonParser, function(req,res){
    let book_title = req.body.book_title;
    let description = req.body.description;
    let author_name = req.body.author_name;
    let price = req.body.price;

    let qr = `insert into books(book_title, description , author_name, price) values('${book_title}','${description}', '${author_name}', ${price}) ` ;
    con.query(qr, jsonParser, function(err,result){
        if(err){
            res.send({error:"Operation failed"});
        }
            console.log(result)
    })

})

//update a book
app.patch("/book",jsonParser, function(req,res){
    let book_title = req.body.book_title;
    let description = req.body.description;
    let author_name = req.body.author_name;
    let price = req.body.price;
    let id = req.body.id;


    let qr= `update books set book_title = '${book_title}', description = '${description}', author_name ='${author_name}', price=${price} where id= ${id}`
    con.query(qr, function(err, result){
        if(err){
            throw err;
        }
        res.send({success:"Updation successfull" })
    })
});
//delete book

app.delete("/book/:id",jsonParser, function(req, res){
    let id= req.params.id
    let qr= `delete from books where id =${id}`;
    con.query(qr, function(err,result){
        if(err){
            throw err;
        }
       res.send({success:"operation sucessful"})
    })

})
app.get("/", function(req, res){
    res.send("<h1> Welcome Page</h1>")
})

app.listen("9000" , function(){
    console.log("listening on port 9000")
})