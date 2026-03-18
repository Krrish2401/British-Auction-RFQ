import { Router } from "express";
import { listBids, submitBid } from "../controllers/bid.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

export const bidRouter = Router();

bidRouter.get("/:rfqId/bids", authMiddleware, listBids);
bidRouter.post("/:rfqId/bids", authMiddleware, requireRole("SUPPLIER"), submitBid);
