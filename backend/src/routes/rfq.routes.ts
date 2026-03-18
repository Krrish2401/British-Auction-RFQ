import { Router } from "express";
import { createRFQ, getRFQ, listRFQs } from "../controllers/rfq.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

export const rfqRouter = Router();

rfqRouter.get("/", authMiddleware, listRFQs);
rfqRouter.post("/", authMiddleware, requireRole("BUYER"), createRFQ);
rfqRouter.get("/:rfqId", authMiddleware, getRFQ);
