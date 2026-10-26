const mongoose = require('mongoose')

const filterPresetSchema = mongoose.Schema({
  ownerId: {type: mongoose.Schema.ObjectId, required:true},
  name: {
    type:String, 
    required:true, 
    trim:true,
    maxlength:50
  },
  filters: {
    type:Object, 
    default:{}
  }
}, {timestamps:true})

filterPresetSchema.index({ownerId:1, name: 1}, {unique:true})

module.exports = mongoose.model('FilterPreset', filterPresetSchema)