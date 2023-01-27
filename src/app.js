const express = require('express');
const bodyParser = require('body-parser');
const {Op} = require('sequelize');
const {sequelize, Profile, Contract} = require('./model')
const {getProfile} = require('./middleware/getProfile')
const app = express()
app.use(bodyParser.json())
app.set('sequelize', sequelize)
app.set('models', sequelize.models)
const ucfirst = str => str.charAt(0).toUpperCase() + str.slice(1);
/**
 * @returns contract by id depending on profile_id
 */
app.get('/contracts/:id', getProfile, async (req, res) => {
    const {Contract} = req.app.get('models')
    const {id} = req.params;
    const contract = await Contract.findOne({
        where: {id},
        include: [{
            model: Profile,
            as: ucfirst(req.profile.type),
            where: {
                id: req.profile.id
            }
        }]
    })
    if (!contract) return res.status(404).end()
    res.json(contract)
})

app.get('/contracts', getProfile, async (req, res) => {
    const {Contract} = req.app.get('models')
    const contracts = await Contract.findAll({
        where: {
            status: {
                [Op.not]: 'terminated'
            }
        },
        include: [{
            model: Profile,
            as: ucfirst(req.profile.type),
            where: {
                id: req.profile.id
            }
        }]
    })
    res.json(contracts)
})

app.get('/jobs/unpaid', getProfile, async (req, res) => {
    const {Job, Contract} = req.app.get('models');
    const unpaids = await Job.findAll({
        where: {
            paid: null
        },
        include: [{
            model: Contract,
            where: {
                status: 'in_progress',
            },
            include: [{
                model: Profile,
                as: ucfirst(req.profile.type),
                where: {
                    id: req.profile.id
                }
            }]
        }]
    });
    console.log(unpaids)
    res.json(unpaids);
})

module.exports = app;
