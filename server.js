require('dotenv').config()
const express=require('express')
const app=express()
const route=require('./route')
const cors=require('cors')
const mongoose=require('mongoose')


mongoose.connect(process.env.Database_url,{useNewUrlParser:true})


const db=mongoose.connection
db.on('error',(error)=>{
    console.log(error)
})
db.once('open',()=>{
    console.log('database connected ')
})


app.use(express.json())
app.use(cors())

app.use('/api',route)
app.listen(5000,()=>{
    console.log('server is connected')
})

