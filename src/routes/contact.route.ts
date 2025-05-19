import { Router } from 'express';
import { identifyContactHandler } from '../controllers/contact.controller';
const router = Router();

router.post('/', identifyContactHandler);

export default router;