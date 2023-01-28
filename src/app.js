const express = require('express');
const bodyParser = require('body-parser');
const {Op} = require('sequelize');
const {sequelize, Profile, Contract} = require('./model')
const {getProfile} = require('./middleware/getProfile')
const moment = require("moment");
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
    res.json(unpaids);
})

app.post('/jobs/:job_id/pay', getProfile, async (req, res) => {
    if (req.profile.type !== 'client') return res.status(403).json({error: "You need to be a client to pay for a job"})
    const {Job, Profile} = req.app.get('models');
    const jobToPay = await Job.findOne({
        where: {
            id: req.params.job_id,
            paid: null
        },
        include: 'Contract'
    });
    if (!jobToPay) return res.status(404).end()
    if (req.profile.balance < jobToPay.price) return res.status(400).json({error: "Insufficient funds"}).end()
    try {
        await sequelize.transaction(async () => {
            const constractor = await Profile.findOne({where: {id: jobToPay.Contract.ContractorId}})
            req.profile.balance -= jobToPay.price;
            await req.profile.save();
            constractor.balance += jobToPay.price;
            await constractor.save();
            jobToPay.paid = true;
            jobToPay.paymentDate = moment()
            await jobToPay.save();
            return res.json(jobToPay);
        });
    } catch (error) {
        return res.status(400).json({error: "An error occurred"})
    }
});

app.get('/admin/best-profession', async (req, res) => {
    const {Job, Contract, Profile} = req.app.get('models');
    let startDate = req.query.start ?? '';
    let endDate = req.query.end ?? '';
    if (startDate === '' && endDate === '') return res.status(400).json({error: 'Provide a start or end date'});
    const paymentDate = {};
    if (startDate !== '') paymentDate[Op.gte] = startDate
    if (endDate !== '') paymentDate[Op.lte] = endDate
    const higherPaidJobs = await Job.findOne({
        where: {
            paid: true,
            paymentDate
        },
        include: {
            model: Contract,
            include: {model: Profile, as:'Contractor'}
        },
        group: 'ContractId',
        order: [[sequelize.fn('SUM', sequelize.col('price')), 'DESC']]
    });

    res.json(higherPaidJobs.Contract.Contractor.profession);
});

module.exports = app;
