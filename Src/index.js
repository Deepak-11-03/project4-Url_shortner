const mongoose = require('mongoose');
const bodyparser = require('body-parser')
const express= require('express')
const route= require('./routes/routes')
const app = express()

app.use(bodyparser.json())
app.use(bodyparser.urlencoded({extended:true}))

mongoose.connect("mongodb+srv://user:ISjwDttcDksEnCcv@cluster0.hja9z.mongodb.net/group42Database?authSource=admin&replicaSet=atlas-3xefdb-shard-0&readPreference=primary&appname=MongoDB%20Compass&ssl=true",
{useNewUrlparser:true})
.then(()=>console.log("mongodb is connected"))
.catch(err=>console.log(err))


app.use('/',route)

app.listen(process.env.PORT || 3000,()=> {
    console.log("connected to port 3000")
})
