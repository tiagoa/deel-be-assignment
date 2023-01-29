const {seed} = require('../src/seed');
const request = require("supertest");
const app = require("./app");

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
    test('it should lists all non-terminated contracts belonging to a user', async () => {
        const contractsClient1 = await request(app).get("/contracts").set('profile_id', 1);
        const contractsContractor6 = await request(app).get("/contracts").set('profile_id', 6);
        expect(contractsClient1.body.length).toBe(1);
        expect(contractsContractor6.body.length).toBe(3);
    });
    test('it should list unpaid jobs from active contracts belonging to a user', async () => {
        const unpaidsClient1 = await request(app).get("/jobs/unpaid").set('profile_id', 1);
        const unpaidsContractor7 = await request(app).get("/jobs/unpaid").set('profile_id', 1);
        expect(unpaidsClient1.body.length).toBe(1);
        expect(unpaidsContractor7.body.length).toBe(1);
    });
    test('it should show the higher-paid profession', async () => {
        const higherPaidProfessionWithoutDate = await request(app).get("/admin/best-profession");
        expect(higherPaidProfessionWithoutDate).toHaveProperty('status', 400);
        expect(higherPaidProfessionWithoutDate.body).toHaveProperty('error', 'Provide a start or end date');
        const higherPaidProfessionDay16 = await request(app).get("/admin/best-profession?start=2020-08-16");
        expect(higherPaidProfessionDay16.body).toBe('Fighter')
        const higherPaidProfessionUntilDay15 = await request(app).get("/admin/best-profession?end=2020-08-15");
        expect(higherPaidProfessionUntilDay15.body).toBe('Programmer')
    });
    test('it should show the list of best clients', async () => {
        const bestClientsWithoutDate = await request(app).get("/admin/best-clients");
        expect(bestClientsWithoutDate).toHaveProperty('status', 400);
        expect(bestClientsWithoutDate.body).toHaveProperty('error', 'Provide a start or end date');
        const bestClientsDay16 = await request(app).get("/admin/best-clients?start=2020-08-16");
        expect(bestClientsDay16.body).toMatchObject([{id: 3, fullName: 'John Snow', paid: 200}, {id: 2, fullName: 'Mr Robot', paid: 200}])
        const bestClientsUntilDay15 = await request(app).get("/admin/best-clients?end=2020-08-15");
        expect(bestClientsUntilDay15.body).toMatchObject([{id: 2, fullName: 'Mr Robot', paid: 121}, {id: 1, fullName: 'Harry Potter', paid: 21}])
    });

});
describe('changes db', () => {
    beforeEach(async () => {
        return await seed();
    });
    test('it should pay a job', async () => {
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
    test('it should deposit an amount in the client balance', async () => {
        const tryToDepositToClient1 = await request(app).post("/balances/deposit").send({amount: 150}).set('profile_id', 1);
        expect(tryToDepositToClient1).toHaveProperty('status', 403)
        expect(tryToDepositToClient1.body).toHaveProperty('error', 'You cannot deposit more then 100.25')
        const depositToClient1 = await request(app).post("/balances/deposit").send({amount: 100.25}).set('profile_id', 1);
        expect(depositToClient1.body).toMatchObject({balance: 1250.25})
        console.log(tryToDepositToClient1.body)
    });
})
