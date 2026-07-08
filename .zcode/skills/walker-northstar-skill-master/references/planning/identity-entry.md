# Invite-Only Identity Understanding Entrance

This is not a full login and registration system. It is a lightweight entrance for understanding
who came, why they came, and what answer they need.

## Target Loop

```text
invite code
-> lightweight session
-> minimal profile
-> user question
-> demand matching
-> agent answer or follow-up
-> demand event
-> feedback
-> admin review
```

## Principle

```text
light identity
strong context
weak account
serve matching
```

## Core Profile Questions

Ask no more than five core questions:

- role: who are you?
- goal: what do you want to solve?
- stuck point: where are you blocked?
- help preference: what kind of help do you want?
- current question: what are you asking now?

Optional:

- nickname
- contact

Contact must be optional.

## Storage Stages

- Local/admin prototype: Markdown, JSON, or local files.
- Online invite test: KV, database, or GitHub API write path.
- NorthStar migration: formal user database.

Do not rely on Vercel runtime file writes for online user-submitted data.

## Privacy Rules

- Explain why profile data is collected before submission.
- Profile and demand events are private or admin-only by default.
- Let users modify profile data or request deletion.
- Show admins a redacted view where contact and obvious personal privacy are hidden by default.

