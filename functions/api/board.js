// GET /api/board?game=phish&period=day|week|all[&team=CODE]   Leaderboard.
// GET /api/board?game=*&period=week                            Champion of each game.
import { guard, getBoard } from "../../backend/core.mjs";
export const onRequestGet = ({ request, env }) => guard(getBoard, request, env);
