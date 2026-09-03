# Planner module

Stores each user's **Workout Planner** — a weekly, day-of-week template of
exercises (Monday → Bench Press, Incline Bench, Chest Fly, etc.), completely
separate from `WorkoutSession` history in the `workouts` module.

- One `WorkoutPlanner` document per user (`userId` is unique), with a fixed
  `days` map of the seven weekdays, each holding an ordered array of planned
  exercises.
- `GET /planner` returns the current user's planner, creating an empty one on
  first access.
- `PUT /planner/:day` replaces the full exercise list for a single weekday —
  the client sends the day's list in the order it should be saved in, and
  `order` is re-derived from array position server-side so drag/reorder
  always persists correctly.

Planned exercises never carry weight/reps/completion data — that only ever
lives on a `WorkoutSession`. The Workout Log page reads today's planner day
to pre-fill a session, but saving that session never mutates the planner.
