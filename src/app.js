const express = require('express');
const bodyParser = require('body-parser');
const {sequelize} = require('./model')
const {getProfile} = require('./middleware/getProfile')
const app = express();
app.use(bodyParser.json());
app.set('sequelize', sequelize)
app.set('models', sequelize.models)

/**
 * @returns contract by id depending on profile_id
 */
app.get('/contracts/:id', getProfile, async (req, res) => {
    const {Contract} = req.app.get('models')
    const {id} = req.params
    const conditions = {id};
    if (req.profile.type === 'client') {
        conditions['ClientId'] = req.profile.id
    }
    if (req.profile.type === 'contractor') {
        conditions['ContractorId'] = req.profile.id
    }
    console.log(req.profile)
    console.log(conditions)
    const contract = await Contract.findOne({where: conditions})
    if (!contract) return res.status(404).end()
    res.json(contract)
})

app.get('/contracts', getProfile, async (req, res) => {
    const {Contract} = req.app.get('models')
    const contract = await Contract.findAll({where: {clientId: req.profile.id}})
    if (!contract) return res.status(404).end()
    res.json(contract)
})
module.exports = app;
