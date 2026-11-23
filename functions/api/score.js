// POST /api/score -> { ok, weekRank }   Submits a finished run.
import { guard, submitScore } from "../../backend/core.mjs";
export const onRequestPost = ({ request, env }) => guard(submitScore, request, env);
