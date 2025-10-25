import { Router } from "express";
import {
  blackboardInit,
  blackboardRead,
  blackboardWrite,
} from "../blackboard/blackboard.service";
import { requireAuth } from "../../middleware/auth";

const router = Router();
router.use(requireAuth);

router.post("/blackboard.write", async (req, res, next) => {
  try {
    const { examId, path, value, category } = req.body;
    await blackboardInit(examId);
    await blackboardWrite(examId, { path, value, category });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.post("/blackboard.read", async (req, res, next) => {
  try {
    const { examId, path } = req.body;
    await blackboardInit(examId);
    const out = await blackboardRead(examId, path);
    res.json(out);
  } catch (e) {
    next(e);
  }
});

router.post("/router.switch_agent", async (req, res) => {
  // tu si môžeš logovať analytics alebo UI stav
  res.json({ ok: true, current_agent: req.body.target });
});

router.post("/qa.raise_conflict", async (req, res) => {
  // MVP: len zaloguj / ulož do zoznamu konfliktov (môžeš doplniť set/list v redis)
  res.json({ ok: true });
});

router.post("/checkpoint.mark", async (req, res) => {
  res.json({ ok: true, marker: `[[COMPLETE: ${req.body.section}]]` });
});

router.post("/ehr.export", async (req, res) => {
  // TODO: mapovanie blackboard → FHIR
  res.json({ ok: true, bundle_id: `bundle-${req.body.examId}` });
});

export default router;
