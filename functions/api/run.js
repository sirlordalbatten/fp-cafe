// POST /api/run  -> { token, pow }   Starts a game run and returns a signed token.
import { guard, startRun } from "../../backend/core.mjs";
export const onRequestPost = ({ request, env }) => guard(startRun, request, env);
