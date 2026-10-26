const express = require('express')
const router = express.Router()
const FilterPreset = require('../models/FilterPreset')
const authMiddleware = require('../middleware/authMiddleware')
const { requireRole } = require('../middleware/authMiddleware')

const guard = [authMiddleware, requireRole('admin','staff')]

router.get('/',guard,async (req,res) => {
  try{
    const presets = await FilterPreset.find({ownerId:req.user.id}).sort({name:1})
    res.status(200).json(presets)
  }catch (error){
    console.error(error)
    res.status(500).json({message: 'Internal Server error'})
  }
})

router.post('/',guard,async (req,res)=>{
  try{
    const name = String(req.body.name ||``).trim()
      if(!name)return res.status(400).json({message:'Preset name is required'})

        const preset = await FilterPreset.findOneAndUpdate(
          {ownerId: req.user.id, name},
          {ownerId: req.user.id, name, filters: req.body.filters||{}},
          {upsert:true, new:true}
        )
          res.status(201).json(preset)
  }catch(error){
      console.error(error)
      res.satus(500).json({message:'Internal Server error'})
  }
})

router.delete('/:id', guard, async (req,res)=>{
  try{
    await FilterPreset.deleteOne({_id: req.params.id, ownerId:req.user.id})
    res.status(200).json({message: 'Preset deleted'})
  }catch (error){
    console.error(error)
    res.status(500).json({message:'Internal Server error'})
  }
})
module.exports= router