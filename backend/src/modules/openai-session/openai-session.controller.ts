import { Router } from "express";
import { TOOLS } from "../tools/tools.schema";
import { blackboardInit } from "../blackboard/blackboard.service";
import { requireAuth } from "../../middleware/auth";
import Joi from "joi";
import { ValidationError } from "../../middleware/errorHandler";
import { ANAMNESIS_SYSTEM_PROMPT } from "../../prompts";

const router = Router();
router.use(requireAuth);

const sessionSchema = Joi.object({
  voice: Joi.string().required(),
  examId: Joi.string().required(),
  locale: Joi.string().required(),
});

router.post("/", async (req, res, next) => {
  try {
    const { error, value } = sessionSchema.validate(req.body);
    if (error) {
      throw new ValidationError("Invalid input", error.details);
    }

    const openApiKey = process.env.OPENAI_API_KEY;

    if (!openApiKey) {
      throw new Error(`OPENAI_API_KEY is not set`);
    }

    const { voice, examId, locale } = value;

    await blackboardInit(examId, locale);

    const r = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview",
        voice,
        modalities: ["audio", "text"],
        instructions: ANAMNESIS_SYSTEM_PROMPT,
        tool_choice: "auto",
        tools: TOOLS,
      }),
    });

    if (!r.ok)
      throw new Error(`Realtime session failed: ${r.status} ${await r.text()}`);

    const data = await r.json();

    res.status(201).json({ message: "OpenAPI session created", data });
  } catch (e) {
    return next(e);
  }
});

export default router;
