import { Router, type IRouter } from "express";
import healthRouter from "./health";
import recordsRouter from "./records";
import usersRouter from "./users";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(recordsRouter);

export default router;
