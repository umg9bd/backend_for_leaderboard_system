# Leaderboard System User Guide

Welcome to the Leaderboard System! This guide will walk you through all the features of the dashboard, from viewing live scores to managing competitions as an admin.

## Getting Started: Logging In

When you first open the application, you'll see a login screen. You have two roles to choose from:

- **Login as User**: This role is for participants and viewers. You can view leaderboards, check player stats, and submit your own scores to active competitions.
- **Login as Admin**: This role is for organizers. You have all the abilities of a User, plus the power to create, manage, finalize, and reset competitions.

Choose the role that applies to you to enter the main dashboard.

## The Main Dashboard

After logging in, you'll see the main dashboard. At the top, you can see your current role (User or Admin) and a **Logout** button.

The dashboard is organized into tabs. Simply click a tab to switch to that section.

## Features for All Users

These features are available to both Users and Admins.

### Leaderboard (Main Tab)

This is the main screen where you can see the live results for active competitions.

- **Select Competition**: Use the dropdown menu to switch between different competitions.
- **Filter by Date**: If you want to see the leaderboard from a specific time frame (like "who was winning on the first day?"), you can select a **From Date** and **To Date** and click the **Filter** button.
- **Submit Your Score**: As a User, you will see a "Submit Score (Live)" section. Enter your **Player Name** and **Score**, then click **Submit Score NOW** to add your entry to the leaderboard.

### History

This tab shows the final results of competitions that have already finished.

Use the dropdown to select a competition, and the dashboard will display all its "snapshots" — the official final leaderboards from when those competitions ended.

### Player Stats

Want to see how a specific player has performed across all competitions?

1. Go to the **Player Stats** tab.
2. Type a player's name into the **Enter Player Name** box.
3. Click **Search Player**.

The dashboard will show you all the completed competitions that player participated in, along with their final rank and score for each.

### Tie-break

If two players have the same score, this tool shows you who is ranked higher. (The system automatically ranks the player who submitted their score first higher).

1. Select the **Competition**.
2. Enter the **Player Name**.
3. Click **Check Tie-break**.

The system will show you if the player is in a tie and who won the tie-break.

### Neighbours

This tool lets you see who is directly above and below a specific player on the leaderboard.

1. Select the **Competition**.
2. Enter the **Player Name**.
3. Click **View Neighbours**.

This is useful for seeing how close you are to the next rank.

## Admin-Only Features

This tab is only visible if you log in as an Admin. It gives you full control over all competitions.  
You can add competitions, submit score etc...

### Create New Competition

This form allows you to start a new competition.

- **Competition Name**: The public display name (e.g., "Hackathon 2026").
- **Unique ID**: A short, no-spaces ID for the system (e.g., "hackathon2026").
- **Score Type**: What is being measured (e.g., "points", "time", "lines").
- **Sorting Order**:
  - `DESC`: Higher is better (e.g., points).
  - `ASC`: Lower is better (e.g., golf, race time).

### Submit Score

This form allows you to manually add or correct a score for any player in any competition.

### Finalize Competition

When a competition is over, select it from this dropdown and click **Finalize & Save Snapshot**. This does two important things:

1. It locks the leaderboard.
2. It saves the final results to the **History** tab for everyone to see.

### Reset Competition

 **Warning: This is a destructive action.**

If you need to completely restart a competition, select it and click **Reset All Data**. This will delete all scores and all history for that competition, setting it back to a blank slate. This cannot be undone.

## Logging Out

Click the **Logout** button in the top-right corner at any time to return to the main login screen.
