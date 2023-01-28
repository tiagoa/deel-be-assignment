const {seed} = require('../src/seed');
const request = require("supertest");
const app = require("./app");
/*
describe('contracts', () => {
    beforeAll(async () => {
        return await seed();
    });
    test('it should return the contract only if it belongs to the profile calling', async () => {
        const contract1Client1 = await request(app).get("/contracts/1").set('profile_id', 1);
        const contract3Client1 = await request(app).get("/contracts/3").set('profile_id', 1);
        const contract1Contractor5 = await request(app).get("/contracts/1").set('profile_id', 5);
        expect(contract1Client1.body).toMatchObject({ContractorId: 5});
        expect(contract3Client1).toHaveProperty('status', 404)
        expect(contract1Contractor5.body).toMatchObject({ClientId: 1});
    });
    test('it should lists all non terminated contracts belonging to a user', async () => {
        const contractsClient1 = await request(app).get("/contracts").set('profile_id', 1);
        const contractsContractor6 = await request(app).get("/contracts").set('profile_id', 6);
        expect(contractsClient1.body.length).toBe(1);
        expect(contractsContractor6.body.length).toBe(3);
    });
    test('it should lists unpaid jobs from active contracts belonging to a user', async () => {
        const unpaidsClient1 = await request(app).get("/jobs/unpaid").set('profile_id', 1);
        const unpaidsContractor7 = await request(app).get("/jobs/unpaid").set('profile_id', 1);
        expect(unpaidsClient1.body.length).toBe(1);
        expect(unpaidsContractor7.body.length).toBe(1);
    });

});
*/
describe('changes db', () => {
    beforeEach(async () => {
        return await seed();
    });
    test('it should pay jobs', async () => {
        const tryToPayJob9Client1 = await request(app).post('/jobs/9/pay').set('profile_id', 1)
        expect(tryToPayJob9Client1).toHaveProperty('status', 404);
        const tryToPayJob5Contractor5 = await request(app).post('/jobs/5/pay').set('profile_id', 5)
        expect(tryToPayJob5Contractor5).toHaveProperty('status', 403)
        expect(tryToPayJob5Contractor5.body).toHaveProperty('error', 'You need to be a client to pay for a job')
        const tryToPayJob5Client4 = await request(app).post('/jobs/5/pay').set('profile_id', 4)
        expect(tryToPayJob5Client4).toHaveProperty('status', 400);
        expect(tryToPayJob5Client4.body).toHaveProperty('error', 'Insufficient funds');
        const payJob3Client1 = await request(app).post('/jobs/3/pay').set('profile_id', 1)
        const {Job, Profile} = app.get('models');
        const job3 = await Job.findOne({where: {id: 3}});
        const client1 = await Profile.findOne({where: {id: 1}});
        expect(job3.paid).toBe(true);
        expect(client1.balance).toBe(948)
        expect(payJob3Client1).toHaveProperty('status', 200);
    });
})