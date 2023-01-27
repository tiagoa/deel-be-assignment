const {seed} = require('../src/seed');
const request = require("supertest");
const app = require("./app");

describe('contracts', () => {
    beforeEach(async () => {
        return await seed();
    });
    test('it should return the contract only if it belongs to the profile calling', async () => {
        const contract1Client1 = await request(app).get("/contracts/1").set('profile_id', 1);
        const contract3Client1 = await request(app).get("/contracts/3").set('profile_id', 1);
        expect(contract1Client1.body).toMatchObject({ContractorId: 5});
        expect(contract3Client1).toHaveProperty('status', 404)
    });
});