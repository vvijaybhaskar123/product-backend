
const mongoose=require('mongoose')

const dataSchema=new mongoose.Schema({
    id:{
        required:true,
        type:Number
    },
    title:{
        required:true,
        type:String
    },
    price:{
        required:true,
        type:Number
    },
    description:{
        required:true,
        type:String
    },
    category:{
        required:true,
        type:String
    },
    image:{
        required:true,
        type:String
    },
    sold:{
        required:true,
        type:Boolean
    },
    dateOfSale:{
        required:true,
        type:String
    }

})



module.exports= mongoose.model('assignment',dataSchema)