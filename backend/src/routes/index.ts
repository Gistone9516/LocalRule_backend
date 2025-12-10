import { Router } from 'express';
import authRoutes from './auth.routes';
import spaceRoutes from './space.routes';
import objectRoutes from './object.routes';
import ruleRoutes from './rule.routes';
import triggerRoutes from './trigger.routes';
import qrRoutes from './qr.routes';
import visitRoutes, { spaceVisitRouter } from './visit.routes';
import fileRoutes from './file.routes';

const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: API 상태 확인
 *     description: API 서버의 상태를 확인합니다
 *     responses:
 *       200:
 *         description: 서버 정상 동작
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/spaces', spaceRoutes);
router.use('/', objectRoutes); // Object routes include /object-types, /spaces/:spaceId/objects, /objects/:id
router.use('/', ruleRoutes); // Rule routes include /objects/:objectId/rules, /rules/:id
router.use('/', triggerRoutes); // Trigger routes include /spaces/:spaceId/triggers, /triggers/:id
router.use('/qr', qrRoutes); // QR routes include /qr/:code, /qr/:code/scan
router.use('/visits', visitRoutes); // Visit routes include /visits, /visits/:id, /visits/:id/end, /visits/:id/events
router.use('/spaces/:spaceId/visits', spaceVisitRouter); // Space visit routes include /spaces/:spaceId/visits, /spaces/:spaceId/stats
router.use('/upload', fileRoutes);

export default router;
