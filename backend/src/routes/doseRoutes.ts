import { Router } from "express";
import {
  createDose,
  getDoses,
  getTodayDoses,
  getDoseById,
  updateDose,
  deleteDose,
} from "../controllers/doseController";

const router = Router();

router.post("/", createDose);
router.get("/", getDoses);
router.get("/today", getTodayDoses);
router.get("/:id", getDoseById);
router.put("/:id", updateDose);
router.delete("/:id", deleteDose);

export default router;
