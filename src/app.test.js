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
    test('it should lists all non terminated contracts belonging to a user', async () => {
        const contractsClient1 = await request(app).get("/contracts").set('profile_id', 1);
        const contractsContractor6 = await request(app).get("/contracts").set('profile_id', 6);
        expect(contractsClient1.body.length).toBe(1);
        expect(contractsContractor6.body.length).toBe(3);
    });
});