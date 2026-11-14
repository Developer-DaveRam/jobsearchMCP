import { Router } from "express";
import { getAllJobs, createJob, fetchAndSavePortalJobs, getMatchedJobs, updateJobStatus, getDashboardStats } from "../controller/job.controller.js";

const jobRouter = Router();

jobRouter.get("/", getAllJobs);
jobRouter.post("/", createJob);
jobRouter.post("/fetch-portals", fetchAndSavePortalJobs);
jobRouter.get("/matched", getMatchedJobs);
jobRouter.get("/stats", getDashboardStats);
jobRouter.patch("/:id", updateJobStatus);

export default jobRouter;
