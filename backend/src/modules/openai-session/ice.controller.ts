import { Router } from "express";

const router = Router();

// Ideálne získaj z ENV alebo z tajného store
router.get("/ice", (req, res) => {
  const stun = [{ urls: ["stun:stun.l.google.com:19302"] }];
  const turn = process.env.TURN_URI
    ? [
        {
          urls: [process.env.TURN_URI], // "turn:turn.yourdomain.com:3478"
          username: process.env.TURN_USER, // "TURN_USER"
          credential: process.env.TURN_PASS, // "TURN_PASS"
        },
      ]
    : [];

  res.json({ iceServers: [...stun, ...turn] });
});

export default router;
