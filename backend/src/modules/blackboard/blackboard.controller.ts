import { Router } from "express";
import {
  blackboardInit,
  blackboardRead,
  blackboardWrite,
  blackboardSummaryText,
} from "./blackboard.service";
import { requireAuth } from "../../middleware/auth";

const r = Router();
r.use(requireAuth);

r.get("/summary", async (req, res, next) => {
  try {
    const examId = String(req.query.examId || "");
    if (!examId) throw new Error("examId required");
    await blackboardInit(examId);
    const txt = await blackboardSummaryText(examId);
    res.send(txt);
  } catch (e) {
    next(e);
  }
});

r.post("/write", async (req, res, next) => {
  try {
    const { examId, path, value, category } = req.body;
    if (!examId || !path || typeof value === "undefined" || !category) {
      return res
        .status(400)
        .json({ error: "examId, path, value, category required" });
    }
    await blackboardInit(examId);
    await blackboardWrite(examId, { path, value, category });
    res.json({ ok: true });
  } catch (e) {
    return next(e);
  }
});

r.get("/read", async (req, res, next) => {
  try {
    const examId = String(req.query.examId || "");
    const path = req.query.path ? String(req.query.path) : undefined;
    const out = await blackboardRead(examId, path);
    res.json(out);
  } catch (e) {
    next(e);
  }
});

export default r;
