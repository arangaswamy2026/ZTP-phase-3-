# ZTP Prototype — Team Collaboration Guide

This document explains how we work together on this project going forward, using Claude Code in the terminal. No git commands need to be memorized — simply type the instructions below to Claude Code, in plain English, at the right moment.

**Shared repository (single source of truth):**
https://github.com/arangaswamy2026/ZTP-phase-3-

## One-time setup

1. Open a terminal and navigate to your local project folder.
2. If this is your first time working from this repository, tell Claude Code:
   > "Clone https://github.com/arangaswamy2026/ZTP-phase-3- and set it up."
3. If you already have a local copy pointing to a different repository, tell Claude Code:
   > "Change my git remote origin to https://github.com/arangaswamy2026/ZTP-phase-3- and pull the latest main branch."

## The one rule to remember

Never make changes directly on the `main` branch. Always start new work on its own branch. This is what prevents one person's work from silently overwriting the other's.

## Scenario 1 — Starting a new piece of work

- Say: **"Create a new branch for [describe the change]."**
- Then continue as usual — ask Claude Code to add flows, edit pages, update content, etc.

## Scenario 2 — You are done and ready to share your work

- Say: **"Commit this and open a pull request."**
- Claude Code will save your changes and publish them to GitHub as a named, reviewable request.

## Scenario 3 — Reviewing your teammate's work

- Say: **"Show me what changed in [her/his pull request]."**
- Claude Code will summarize the changes in plain language before anything is merged.
- If it looks good, say: **"Merge it."**
- If not, describe what should change instead, and ask for another pass.

## Scenario 4 — Starting your day / picking up work after a time-zone gap

- Say: **"Pull the latest changes before I start."**
- This brings in anything merged while you were away, so you always start from the current version.

## Scenario 5 — You and your teammate both touched the same page

- Say: **"Check for conflicts before merging."**
- Claude Code will identify exactly which lines differ and ask which version to keep, rather than silently choosing one.

## Scenario 6 — Updating the shared preview link

- Nothing to do manually. Once a pull request is merged into `main`, GitHub automatically rebuilds and republishes the preview link used for PM reviews.

## Quick reference

| When | Say this to Claude Code |
|---|---|
| Starting new work | "Create a new branch for [change]." |
| Finished, ready to share | "Commit this and open a pull request." |
| Reviewing teammate's work | "Show me what changed in this pull request." |
| Approving | "Merge it." |
| Start of day / after time away | "Pull the latest changes before I start." |
| Same page edited by both | "Check for conflicts before merging." |
