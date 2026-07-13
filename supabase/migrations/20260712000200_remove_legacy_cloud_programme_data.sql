begin;

-- Pearl's current privacy promise is that health context, programme state,
-- workouts, check-ups and micro-checks are not stored online. Older backend
-- prototypes used the tables below. Remove them before online profiles are
-- enabled so an existing Supabase project cannot retain or accept data that
-- the current app says is device-only.
--
-- This intentionally omits CASCADE. If an unknown view, function or table
-- still depends on one of these retired stores, deployment must stop for a
-- manual retention/privacy review instead of silently deleting that object.
drop table if exists
  public.movement_block_reports,
  public.micro_checks,
  public.training_session_completions,
  public.training_state,
  public.movement_blocks,
  public.movement_checkups;

commit;
