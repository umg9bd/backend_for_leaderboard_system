// --- IMPORTS ---
const supertest = require('supertest'); // Tool to make fake API requests
const express = require('express');
const db = require('./db'); // Your real database connection pool
const competitionRoutes = require('./routes/competitionRoutes'); // Your routes file

// --- TEST APP SETUP ---
// Create a minimal Express app just for testing
const app = express();
app.use(express.json()); // Add JSON body parser
app.use('/api/competitions', competitionRoutes); // Mount your routes

let server; // This will hold our test server instance

// --- FIX: Helper function for a short delay ---
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- GLOBAL TEST LIFECYCLE ---

// beforeAll: Runs ONCE before all tests in this file
beforeAll(async () => {
    // Start the test server on a random, available port
    server = app.listen(0);
});

// afterAll: Runs ONCE after all tests in this file are done
afterAll(async () => {
    await db.end();   // Close the database connection pool
    server.close(); // Stop the test server
});

// beforeEach: Runs BEFORE EVERY SINGLE 'it' test block
beforeEach(async () => {
    // WIPE THE DATABASE to ensure a clean state for every test
    // This is the most important part of a test suite.
    try {
        // We must delete in the correct order to avoid foreign key errors
        await db.execute('DELETE FROM scores');
        await db.execute('DELETE FROM player_history');
        await db.execute('DELETE FROM competition_snapshots');
        await db.execute('DELETE FROM players');
        await db.execute('DELETE FROM competitions');
    } catch (error) {
        // This will catch the "Table... doesn't exist" error if schema failed
        console.error("BEFORE_EACH CLEANUP FAILED:", error.message);
        throw error;
    }
});

// --- TEST SUITE ---

describe('Leaderboard API Integration Tests', () => {

    // --- Group 1: POST / (Create Competition) ---

    it('Test 1: should create a new competition with valid data', async () => {
        const response = await supertest(server)
            .post('/api/competitions')
            .send({
                name: "Test Comp",
                unique_id: "test-comp-1",
                sorting_order: "DESC",
                start_date: "2025-01-01",
                end_date: "2025-01-31"
            });
        
        expect(response.status).toBe(201);
        expect(response.body.competition.name).toBe("Test Comp");
        expect(response.body.competition.status).toBe("active");
    });

    it('Test 2: should return 409 Conflict for a duplicate unique_id', async () => {
        // Create the first competition
        await supertest(server).post('/api/competitions').send({
            name: "Test Comp 1", unique_id: "test-comp-1", sorting_order: "DESC"
        });

        // Try to create another with the same ID
        const response = await supertest(server)
            .post('/api/competitions')
            .send({
                name: "Test Comp 2", unique_id: "test-comp-1", sorting_order: "ASC"
            });

        expect(response.status).toBe(409);
        expect(response.body.message).toBe("Competition already exists");
    });

    it('Test 3: should return 400 Bad Request if required fields are missing', async () => {
        const response = await supertest(server)
            .post('/api/competitions')
            .send({ name: "Incomplete Comp" }); // Missing unique_id and sorting_order

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Missing required fields.");
    });

    // --- Group 2: POST /:id/scores (Submit Score) ---

    it('Test 4: should submit a score for a player', async () => {
        // 1. Create comp
        await supertest(server).post('/api/competitions').send({
            name: "Test Comp", unique_id: "test-comp-1", sorting_order: "DESC"
        });

        // 2. Submit score
        const response = await supertest(server)
            .post('/api/competitions/test-comp-1/scores')
            .send({ player_name: "Meera", score: 100 });
        
        expect(response.status).toBe(201);
        expect(response.body.message).toBe("Score recorded successfully.");
    });

    it('Test 5: should automatically create a new player if they do not exist', async () => {
        await supertest(server).post('/api/competitions').send({
            name: "Test Comp", unique_id: "test-comp-1", sorting_order: "DESC"
        });

        // 1. Check players table (it's empty)
        let [players] = await db.query("SELECT * FROM players");
        expect(players.length).toBe(0);

        // 2. Submit score for a new player
        await supertest(server).post('/api/competitions/test-comp-1/scores')
            .send({ player_name: "NewPlayer", score: 100 });

        // 3. Check players table again
        [players] = await db.query("SELECT * FROM players");
        expect(players.length).toBe(1);
        expect(players[0].name).toBe("NewPlayer");
    });

    it('Test 6: should return 404 when submitting to a non-existent competition', async () => {
        const response = await supertest(server)
            .post('/api/competitions/fake-comp/scores')
            .send({ player_name: "Meera", score: 100 });
        
        expect(response.status).toBe(404);
        expect(response.body.message).toBe("Competition not found.");
    });

    it('Test 7: should return 400 if player_name or score is missing', async () => {
        await supertest(server).post('/api/competitions').send({
            name: "Test Comp", unique_id: "test-comp-1", sorting_order: "DESC"
        });
        
        const response = await supertest(server)
            .post('/api/competitions/test-comp-1/scores')
            .send({ score: 100 }); // Missing player_name

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Missing player_name or score.");
    });

    // --- Group 3: GET /:id/leaderboard (Business Logic) ---

    it('Test 8: should return leaderboard sorted DESC (high score wins)', async () => {
        await supertest(server).post('/api/competitions/bulk').send({ competitions: [{
            name: "DESC Comp", unique_id: "desc-comp", sorting_order: "DESC",
            scores: [
                { player_name: "Player A", score: 50, timestamp: "2025-01-01 10:00:00" },
                { player_name: "Player B", score: 100, timestamp: "2025-01-01 10:00:00" }
            ]
        }]});

        const response = await supertest(server).get('/api/competitions/desc-comp/leaderboard');
        expect(response.status).toBe(200);
        expect(response.body.leaderboard[0].player_name).toBe("Player B");
        expect(response.body.leaderboard[0].rank).toBe(1);
    });

    it('Test 9: should return leaderboard sorted ASC (low score wins)', async () => {
        await supertest(server).post('/api/competitions/bulk').send({ competitions: [{
            name: "ASC Comp", unique_id: "asc-comp", sorting_order: "ASC",
            scores: [
                { player_name: "Player A", score: 100, timestamp: "2025-01-01 10:00:00" },
                { player_name: "Player B", score: 50, timestamp: "2025-01-01 10:00:00" }
            ]
        }]});

        const response = await supertest(server).get('/api/competitions/asc-comp/leaderboard');
        expect(response.status).toBe(200);
        expect(response.body.leaderboard[0].player_name).toBe("Player B");
        expect(response.body.leaderboard[0].rank).toBe(1);
    });

    it('Test 10: should handle ties by earliest timestamp (DESC)', async () => {
        await supertest(server).post('/api/competitions/bulk').send({ competitions: [{
            name: "Tie Comp", unique_id: "tie-comp", sorting_order: "DESC",
            scores: [
                { player_name: "Priya (Late)", score: 95, timestamp: "2025-01-01 10:00:00" },
                { player_name: "Meera (Early)", score: 95, timestamp: "2025-01-01 09:00:00" }
            ]
        }]});

        const response = await supertest(server).get('/api/competitions/tie-comp/leaderboard');
        expect(response.status).toBe(200);
        expect(response.body.leaderboard[0].player_name).toBe("Meera (Early)");
        expect(response.body.leaderboard[0].rank).toBe(1);
        expect(response.body.leaderboard[1].player_name).toBe("Priya (Late)");
        expect(response.body.leaderboard[1].rank).toBe(2);
    });

    it('Test 11: should show LATEST score, not highest score', async () => {
        await supertest(server).post('/api/competitions/bulk').send({ competitions: [{
            name: "Latest Comp", unique_id: "latest-comp", sorting_order: "DESC",
            scores: [
                { player_name: "Player A", score: 999, timestamp: "2025-01-01 09:00:00" }, // Older, higher score
                { player_name: "Player B", score: 90, timestamp: "2025-01-01 10:00:00" },
                { player_name: "Player A", score: 50, timestamp: "2025-01-01 11:00:00" }  // Newer, lower score
            ]
        }]});
        
        const response = await supertest(server).get('/api/competitions/latest-comp/leaderboard');
        
        expect(response.status).toBe(200);
        expect(response.body.leaderboard.length).toBe(2);
        // Player B is rank 1 because their latest score (90) is > Player A's latest score (50)
        expect(response.body.leaderboard[0].player_name).toBe("Player B");
        expect(response.body.leaderboard[0].score).toBe(90);
        expect(response.body.leaderboard[1].player_name).toBe("Player A");
        expect(response.body.leaderboard[1].score).toBe(50);
    });

    it('Test 12: should filter leaderboard by start and end date', async () => {
        await supertest(server).post('/api/competitions/bulk').send({ competitions: [{
            name: "Date Comp", unique_id: "date-comp", sorting_order: "DESC",
            scores: [
                { player_name: "Player A (Today)", score: 100, timestamp: new Date().toISOString() },
                { player_name: "Player B (Last Year)", score: 200, timestamp: "2024-01-01 10:00:00" }
            ]
        }]});

        const today = new Date().toISOString().split('T')[0];
        const response = await supertest(server)
            .get(`/api/competitions/date-comp/leaderboard?start=${today}`);
        
        expect(response.status).toBe(200);
        expect(response.body.leaderboard.length).toBe(1);
        expect(response.body.leaderboard[0].player_name).toBe("Player A (Today)");
    });

    it('Test 13: should return 404 for a non-existent leaderboard', async () => {
        const response = await supertest(server).get('/api/competitions/fake-comp/leaderboard');
        expect(response.status).toBe(404);
        expect(response.body.message).toBe("Competition not found");
    });


    // --- Group 4: Player Endpoints ---

    it('Test 14: should get the correct rank for a player', async () => {
        await supertest(server).post('/api/competitions/bulk').send({ competitions: [{
            name: "Rank Comp", unique_id: "rank-comp", sorting_order: "DESC",
            scores: [
                { player_name: "Player A", score: 100 },
                { player_name: "Player B", score: 50 }
            ]
        }]});
        
        const response = await supertest(server)
            .get('/api/competitions/rank-comp/players/Player B/rank');
        
        expect(response.status).toBe(200);
        expect(response.body.rank).toBe(2);
        expect(response.body.score).toBe(50);
    });

    it('Test 15: should return the correct (tied) rank', async () => {
        await supertest(server).post('/api/competitions/bulk').send({ competitions: [{
            name: "Rank Comp", unique_id: "rank-comp", sorting_order: "DESC",
            scores: [
                { player_name: "Player A", score: 100 },
                { player_name: "Player B (Tie)", score: 90 },
                { player_name: "Player C (Tie)", score: 90 }
            ]
        }]});
        
        const resB = await supertest(server).get('/api/competitions/rank-comp/players/Player B (Tie)/rank');
        const resC = await supertest(server).get('/api/competitions/rank-comp/players/Player C (Tie)/rank');
        
        expect(resB.status).toBe(200);
        expect(resC.status).toBe(200);
        expect(resB.body.rank).toBe(2); 
        expect(resC.body.rank).toBe(2);
    });

    it('Test 16: should get neighbors for a mid-rank player', async () => {
        await supertest(server).post('/api/competitions/bulk').send({ competitions: [{
            name: "Neighbor Comp", unique_id: "neighbor-comp", sorting_order: "DESC",
            scores: [
                { player_name: "Player A", score: 100 }, // Rank 1
                { player_name: "Player B", score: 90 },  // Rank 2
                { player_name: "Player C", score: 80 },  // Rank 3 (Our target)
                { player_name: "Player D", score: 70 },  // Rank 4
                { player_name: "Player E", score: 60 }   // Rank 5
            ]
        }]});

        const response = await supertest(server)
            .get('/api/competitions/neighbor-comp/neighbours/Player C');
        
        expect(response.status).toBe(200);
        expect(response.body.player.player_name).toBe("Player C");
        expect(response.body.above_players.length).toBe(2);
        expect(response.body.below_players.length).toBe(2);
        expect(response.body.above_players[0].player_name).toBe("Player B"); // Closest above
    });

    it('Test 17: should get neighbors for the #1 ranked player (no one above)', async () => {
        await supertest(server).post('/api/competitions/bulk').send({ competitions: [{
            name: "Neighbor Comp", unique_id: "neighbor-comp", sorting_order: "DESC",
            scores: [
                { player_name: "Player A", score: 100 }, // Rank 1 (Our target)
                { player_name: "Player B", score: 90 }
            ]
        }]});
        
        const response = await supertest(server)
            .get('/api/competitions/neighbor-comp/neighbours/Player A');
        
        expect(response.status).toBe(200);
        expect(response.body.player.player_name).toBe("Player A");
        expect(response.body.above_players.length).toBe(0);
        expect(response.body.below_players.length).toBe(1);
    });

    it('Test 18: should get a players score history for one competition', async () => {
        await supertest(server).post('/api/competitions').send({
            name: "Test Comp", unique_id: "test-comp-1", sorting_order: "DESC"
        });

        await supertest(server).post('/api/competitions/test-comp-1/scores')
            .send({ player_name: "Meera", score: 50 });
        
        await sleep(1001); // Wait for 1.001 seconds to ensure a new timestamp

        await supertest(server).post('/api/competitions/test-comp-1/scores')
            .send({ player_name: "Meera", score: 100 });

        const response = await supertest(server)
            .get('/api/competitions/test-comp-1/players/Meera/scores');
        
        expect(response.status).toBe(200);
        expect(response.body.submission_count).toBe(2);
        expect(response.body.latest_score).toBe(100);
    });


    // --- Group 5: Admin Workflow (Finalize, Snapshots, Reset) ---

    it('Test 19: should finalize a competition (create snapshot, history, update status)', async () => {
        // 1. Setup
        await supertest(server).post('/api/competitions/bulk').send({ competitions: [{
            name: "Finalize Comp", unique_id: "finalize-comp", sorting_order: "DESC",
            scores: [ { player_name: "Player F", score: 100 } ]
        }]});

        // 2. Finalize
        const finResponse = await supertest(server)
            .post('/api/competitions/finalize-comp/finalize')
            .expect(200);
        
        expect(finResponse.body.message).toBe("Competition finalized and saved");
        expect(finResponse.body.final_leaderboard[0].player_name).toBe("Player F");

        // 3. Check Snapshots
        const snapResponse = await supertest(server)
            .get('/api/competitions/finalize-comp/snapshots')
            .expect(200);
        
        expect(snapResponse.body.total_snapshots).toBe(1);
        expect(snapResponse.body.snapshots[0].results[0].player_name).toBe("Player F");

        // 4. Check Player Career History
        const careerResponse = await supertest(server)
            .get('/api/competitions/players/Player F/history')
            .expect(200);
        
        expect(careerResponse.body.competitions_participated).toBe(1);
        expect(careerResponse.body.history[0].competition).toBe("Finalize Comp");
        
        // 5. Check Competition Status
        const compResponse = await supertest(server).get('/api/competitions').expect(200);
        expect(compResponse.body.competitions[0].status).toBe("completed");
    });

    it('Test 20: should reset a competition (delete all data)', async () => {
        // 1. Setup (using finalize test)
        await supertest(server).post('/api/competitions/bulk').send({ competitions: [{
            name: "Reset Comp", unique_id: "reset-comp", sorting_order: "DESC",
            scores: [ { player_name: "Player R", score: 100 } ]
        }]});
        await supertest(server).post('/api/competitions/reset-comp/finalize');

        // 2. Reset
        const response = await supertest(server)
            .post('/api/competitions/reset-comp/reset')
            .expect(200);
        
        expect(response.body.message).toContain("successfully reset");
        expect(response.body.records_deleted.scores).toBe(1);
        expect(response.body.records_deleted.snapshots).toBe(1);
        expect(response.body.records_deleted.player_history).toBe(1);
        expect(response.body.new_status).toBe("active");

        // 3. Verify data is gone
        const scores = await db.query("SELECT * FROM scores");
        const snaps = await db.query("SELECT * FROM competition_snapshots");
        const history = await db.query("SELECT * FROM player_history");
        
        expect(scores[0].length).toBe(0);
        expect(snaps[0].length).toBe(0);
        expect(history[0].length).toBe(0);
    });

    // --- Group 6: Security, Validation & Misc ---

    it('Test 21: should be protected from SQL Injection in params', async () => {
        const attackPayload = "' OR 1=1; --";
        const response = await supertest(server)
            .get(`/api/competitions/${attackPayload}/leaderboard`);
        
        expect(response.status).toBe(404);
        expect(response.body.message).toBe("Competition not found");
    });

    it('Test 22: should fetch all competitions', async () => {
        await supertest(server).post('/api/competitions').send({
            name: "Comp 1", unique_id: "comp-1", sorting_order: "DESC"
        });
        await supertest(server).post('/api/competitions').send({
            name: "Comp 2", unique_id: "comp-2", sorting_order: "ASC"
        });

        const response = await supertest(server).get('/api/competitions');
        expect(response.status).toBe(200);
        expect(response.body.total).toBe(2);
        expect(response.body.competitions.length).toBe(2);
    });

    it('Test 23: should fetch only active competitions using query param', async () => {
        await supertest(server).post('/api/competitions').send({
            name: "Active Comp", unique_id: "active-comp", sorting_order: "DESC"
        });
        await supertest(server).post('/api/competitions').send({
            name: "Done Comp", unique_id: "done-comp", sorting_order: "ASC"
        });
        await supertest(server).post('/api/competitions/done-comp/finalize');

        const response = await supertest(server).get('/api/competitions?status=active');
        expect(response.status).toBe(200);
        expect(response.body.total).toBe(1);
        expect(response.body.competitions[0].name).toBe("Active Comp");
    });

    it('Test 24: should get neighbors for last place player (no one below)', async () => {
        await supertest(server).post('/api/competitions/bulk').send({ competitions: [{
            name: "Neighbor Comp", unique_id: "neighbor-comp", sorting_order: "DESC",
            scores: [
                { player_name: "Player A", score: 100 },
                { player_name: "Player B", score: 90 } // Last place
            ]
        }]});
        
        const response = await supertest(server)
            .get('/api/competitions/neighbor-comp/neighbours/Player B');
        
        expect(response.status).toBe(200);
        expect(response.body.player.player_name).toBe("Player B");
        expect(response.body.above_players.length).toBe(1);
        expect(response.body.below_players.length).toBe(0);
    });

    it('Test 25: should return 400 Bad Request for non-numeric score', async () => {
        await supertest(server).post('/api/competitions').send({
            name: "Test Comp", unique_id: "test-comp-1", sorting_order: "DESC"
        });
        
        const response = await supertest(server)
            .post('/api/competitions/test-comp-1/scores')
            .send({ player_name: "Cheater", score: "hello" }); // Invalid score

        expect(response.status).toBe(400);
        expect(response.body.message).toBe("Score must be a number.");
    });

    it('Test 26: should handle a large bulk payload (500 scores) without failing', async () => {
        console.log('Starting large volume test (500 scores)...');
        
        // 1. Generate a large payload
        const scores = [];
        for (let i = 0; i < 500; i++) {
            scores.push({
                player_name: `VolumeUser ${i}`,
                score: Math.floor(Math.random() * 1000)
            });
        }
        
        const bulkPayload = {
            "competitions": [
                {
                    "name": "Large Volume Test",
                    "unique_id": "volume-test-1",
                    "sorting_order": "DESC",
                    "scores": scores
                }
            ]
        };

        // 2. Send the entire payload in one request
        const response = await supertest(server)
            .post('/api/competitions/bulk')
            .send(bulkPayload);

        // 3. Assert: Did the server handle it and not crash?
        expect(response.status).toBe(200);
        expect(response.body.message).toBe("Payload processed successfully");
        expect(response.body.scores_added.length).toBe(500);

        // 4. Assert: Is the data really in the database?
        const [dbScores] = await db.query("SELECT COUNT(*) as count FROM scores");
        const [dbPlayers] = await db.query("SELECT COUNT(*) as count FROM players");
        
        expect(dbScores[0].count).toBe(500);
        expect(dbPlayers[0].count).toBe(500);
        
        console.log('Large volume test passed.');
    }, 15000); // 15-second timeout for this slow test
});