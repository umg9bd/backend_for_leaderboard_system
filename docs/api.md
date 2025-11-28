# Leaderboard System API Documentation

Welcome to the Leaderboard System API. This document provides a detailed guide for interacting with the API, which is built to create, manage, and display leaderboard data for various competitions.

## Base URL

All API endpoints are prefixed with the following base URL:

```
http://localhost:3000/api/competitions
```

## Data Models

The API interacts with the following main data structures:

### Competition
Represents an event.

- `id` (Integer): Primary Key
- `name` (String): Display name (e.g., "Hackathon 2025")
- `unique_id` (String): URL-friendly identifier (e.g., "hackathon2025")
- `score_type` (String): e.g., "points"
- `sorting_order` (Enum): ASC (lower is better) or DESC (higher is better)
- `status` (Enum): active, completed, archived

### Player
A participant.

- `id` (Integer): Primary Key
- `name` (String): Unique player name

### Score
A single score entry.

- `id` (Integer): Primary Key
- `competition_id` (Integer): Foreign key to competitions
- `player_id` (Integer): Foreign key to players
- `score` (Integer): The score value
- `timestamp` (Datetime): When the score was submitted

## Endpoints

### 1. Competition Management

Endpoints for creating and viewing competitions.

#### GET `/`

Fetches a list of all competitions.

**Query Parameters:**
- `status` (String, Optional): Filter by status. Accepts `active`, `completed`, or `archived`. Defaults to all if not provided.

**Success Response (200 OK):**

```json
{
  "total": 2,
  "competitions": [
    {
      "id": 1,
      "name": "Hackathon 2025",
      "unique_id": "hackathon2025",
      "score_type": "points",
      "sorting_order": "DESC",
      "status": "active",
      "start_date": null,
      "end_date": null,
      "created_at": "2025-11-17T10:00:00.000Z"
    },
    {
      "id": 2,
      "name": "Code Golf",
      "unique_id": "codegolf",
      "score_type": "lines",
      "sorting_order": "ASC",
      "status": "completed",
      "start_date": "2024-01-01T00:00:00.000Z",
      "end_date": "2024-01-02T00:00:00.000Z",
      "created_at": "2024-01-01T10:00:00.000Z"
    }
  ]
}
```

#### POST `/`

Creates a new competition.

**Request Body:**

```json
{
  "name": "New Weekly Challenge",
  "unique_id": "weekly-challenge-1",
  "sorting_order": "DESC",
  "score_type": "points",
  "start_date": "2025-12-01",
  "end_date": "2025-12-07"
}
```

**Success Response (201 Created):**

```json
{
  "message": "Competition created",
  "competition": {
    "id": 3,
    "name": "New Weekly Challenge",
    "unique_id": "weekly-challenge-1",
    "score_type": "points",
    "sorting_order": "DESC",
    "status": "active"
  }
}
```

**Error Responses:**
- **400 Bad Request**: Missing required fields (name, unique_id, sorting_order).
- **409 Conflict**: A competition with that unique_id already exists.

#### POST `/bulk`

Initializes one or more competitions and can optionally add scores to them.

**Request Body:**

```json
{
  "competitions": [
    {
      "name": "Bulk Comp 1",
      "unique_id": "bulk-comp-1",
      "sorting_order": "DESC",
      "scores": [
        { "player_name": "Meera", "score": 100, "timestamp": "2025-01-01 09:00:00" },
        { "player_name": "Priya", "score": 95, "timestamp": "2025-01-01 10:00:00" }
      ]
    }
  ]
}
```

**Success Response (200 OK):**

```json
{
  "message": "Payload processed successfully",
  "competitions_created": [
    {
      "id": 4,
      "name": "Bulk Comp 1",
      "unique_id": "bulk-comp-1"
    }
  ],
  "scores_added": [
    {
      "competition": "bulk-comp-1",
      "player_name": "Meera",
      "score": 100,
      "timestamp": "2025-01-01 09:00:00"
    },
    {
      "competition": "bulk-comp-1",
      "player_name": "Priya",
      "score": 95,
      "timestamp": "2025-01-01 10:00:00"
    }
  ],
  "debug_info": "Check server console for timestamp logs"
}
```

### 2. Leaderboard & Scoring

Endpoints for fetching leaderboards and submitting scores.

#### GET `/:unique_id/leaderboard`

Fetches the live leaderboard for a specific competition.

**URL Parameters:**
- `:unique_id` (String): The unique ID of the competition.

**Query Parameters:**
- `limit` (Integer, Optional): Number of top players to return. Defaults to 10.
- `start` (String, Optional): Start date/time filter (e.g., `2025-11-17` or `2025-11-17 09:00:00`).
- `end` (String, Optional): End date/time filter.

**Success Response (200 OK):**

```json
{
  "competition": {
    "name": "Hackathon 2025",
    "unique_id": "hackathon2025",
    "score_type": "points",
    "sorting_order": "DESC",
    "status": "active"
  },
  "time_window": {
    "period": "All-time",
    "start": null,
    "end": null
  },
  "leaderboard": [
    {
      "rank": 1,
      "player_name": "Meera",
      "score": 100,
      "timestamp": "2025-11-17T09:00:00.000Z"
    },
    {
      "rank": 2,
      "player_name": "Priya",
      "score": 95,
      "timestamp": "2025-11-17T10:00:00.000Z"
    }
  ],
  "total_results": 2
}
```

**Error Responses:**
- **404 Not Found**: Competition not found.

#### POST `/:unique_id/scores`

Submits a new score for a player. If the player doesn't exist, they are created automatically. The system only uses the latest score from a player for ranking.

**URL Parameters:**
- `:unique_id` (String): The unique ID of the competition.

**Request Body:**

```json
{
  "player_name": "NewPlayer",
  "score": 120
}
```

**Success Response (201 Created):**

```json
{
  "message": "Score recorded successfully.",
  "player_name": "NewPlayer",
  "score": 120
}
```

**Error Responses:**
- **400 Bad Request**: Missing player_name or score, or score is not a number.
- **404 Not Found**: Competition not found.

### 3. Player Statistics

Endpoints for fetching data about specific players.

#### GET `/players/:player_name/history`

Fetches a player's career history across all completed competitions they participated in.

**URL Parameters:**
- `:player_name` (String): The name of the player.

**Success Response (200 OK):**

```json
{
  "player_name": "Meera",
  "competitions_participated": 1,
  "history": [
    {
      "competition": "Code Golf",
      "competition_id": "codegolf",
      "rank": 1,
      "score": 50,
      "completed_date": "2024-01-03T11:00:00.000Z"
    }
  ]
}
```

**Error Responses:**
- **404 Not Found**: Player not found.

#### GET `/:unique_id/players/:player_name/scores`

Fetches a player's full submission history for a single competition.

**URL Parameters:**
- `:unique_id` (String): The unique ID of the competition.
- `:player_name` (String): The name of the player.

**Success Response (200 OK):**

```json
{
  "competition_id": "hackathon2025",
  "player_name": "Meera",
  "submission_count": 2,
  "scores": [
    {
      "submission": 1,
      "score": 100,
      "timestamp": "2025-11-17T09:00:00.000Z"
    },
    {
      "submission": 2,
      "score": 80,
      "timestamp": "2025-11-17T08:00:00.000Z"
    }
  ],
  "latest_score": 100
}
```

**Error Responses:**
- **404 Not Found**: Competition or player not found in this competition.

#### GET `/:unique_id/players/:player_name/rank`

Fetches a player's current rank in a specific competition based on their latest score.

**URL Parameters:**
- `:unique_id` (String): The unique ID of the competition.
- `:player_name` (String): The name of the player.

**Success Response (200 OK):**

```json
{
  "competition_id": "hackathon2025",
  "player_name": "Priya",
  "score": 95,
  "rank": 2
}
```

**Error Responses:**
- **404 Not Found**: Competition or player not found.

#### GET `/:unique_id/neighbours/:player_name`

Fetches a player's immediate neighbors (2 above and 2 below) on the leaderboard.

**URL Parameters:**
- `:unique_id` (String): The unique ID of the competition.
- `:player_name` (String): The name of the player.

**Success Response (200 OK):**

```json
{
  "player": {
    "player_name": "PlayerC",
    "score": 80,
    "timestamp": "2025-11-17T11:00:00.000Z"
  },
  "above_players": [
    {
      "player_name": "PlayerB",
      "score": 90,
      "timestamp": "2025-11-17T10:00:00.000Z"
    },
    {
      "player_name": "PlayerA",
      "score": 100,
      "timestamp": "2025-11-17T09:00:00.000Z"
    }
  ],
  "below_players": [
    {
      "player_name": "PlayerD",
      "score": 70,
      "timestamp": "2025-11-17T12:00:00.000Z"
    },
    {
      "player_name": "PlayerE",
      "score": 60,
      "timestamp": "2025-11-17T13:00:00.000Z"
    }
  ]
}
```

#### POST `/:unique_id/tiebreak`

Checks if a player is in a tie and explains how it was resolved (by earliest timestamp).

**URL Parameters:**
- `:unique_id` (String): The unique ID of the competition.

**Request Body:**

```json
{
  "player_name": "Priya (Late)"
}
```

**Success Response (200 OK):**

```json
{
  "message": "Tie detected and automatically handled. 'Meera (Early)' submitted first and wins the tie-break.",
  "handled": true,
  "tie_count": 2,
  "tied_players": [
    {
      "player_name": "Meera (Early)",
      "score": 95,
      "timestamp": "2025-01-01T09:00:00.000Z"
    },
    {
      "player_name": "Priya (Late)",
      "score": 95,
      "timestamp": "2025-01-01T10:00:00.000Z"
    }
  ]
}
```

### 4. Admin & History

Endpoints for managing competition state and history.

#### GET `/:unique_id/snapshots`

Fetches the historical snapshots for a competition. A snapshot is created when a competition is "finalized".

**URL Parameters:**
- `:unique_id` (String): The unique ID of the competition.

**Success Response (200 OK):**

```json
{
  "competition": "Code Golf",
  "total_snapshots": 1,
  "snapshots": [
    {
      "snapshot_id": 1,
      "date": "2024-01-03T11:00:00.000Z",
      "participants": 2,
      "results": [
        {
          "rank": 1,
          "player_name": "Meera",
          "score": 50,
          "timestamp": "2024-01-01T09:00:00.000Z"
        },
        {
          "rank": 2,
          "player_name": "Priya",
          "score": 55,
          "timestamp": "2024-01-01T10:00:00.000Z"
        }
      ]
    }
  ]
}
```

#### POST `/:unique_id/finalize`

Finalizes a competition. This does three things:

1. Calculates the final leaderboard.
2. Saves a JSON snapshot of this leaderboard to the competition_snapshots table.
3. Updates the competition's status to completed.
4. Saves the results to the player_history table for career tracking.

**URL Parameters:**
- `:unique_id` (String): The unique ID of the competition to finalize.

**Success Response (200 OK):**

```json
{
  "message": "Competition finalized and saved",
  "competition": "Hackathon 2025",
  "final_leaderboard": [
    {
      "rank": 1,
      "player_name": "Meera",
      "score": 100,
      "timestamp": "2025-11-17T09:00:00.000Z"
    }
  ],
  "participants": 1
}
```

**Error Responses:**
- **404 Not Found**: Competition not found.

#### POST `/:unique_id/reset`

Resets a competition. This is a destructive action that:

1. Deletes all scores associated with the competition.
2. Deletes all competition_snapshots.
3. Deletes all player_history records for it.
4. Sets the competition status back to active.

**URL Parameters:**
- `:unique_id` (String): The unique ID of the competition to reset.

**Success Response (200 OK):**

```json
{
  "message": "Competition 'Hackathon 2025' has been successfully reset.",
  "records_deleted": {
    "scores": 5,
    "snapshots": 1,
    "player_history": 5
  },
  "new_status": "active"
}
```

**Error Responses:**
- **404 Not Found**: Competition not found.

### 5. Debug

#### GET `/debug/all-scores`

A utility endpoint to see all scores from all competitions, in raw database format.

**Success Response (200 OK):**

```json
[
  {
    "id": 1,
    "unique_id": "hackathon2025",
    "name": "Meera",
    "score": 100,
    "timestamp": "2025-11-17T09:00:00.000Z"
  },
  {
    "id": 2,
    "unique_id": "hackathon2025",
    "name": "Priya",
    "score": 95,
    "timestamp": "2025-11-17T10:00:00.000Z"
  }
]
```