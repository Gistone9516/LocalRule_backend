import { Router } from 'express';
import { visitController } from '../controllers/visit.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * /visits:
 *   post:
 *     summary: 방문 세션 시작 (게스트용)
 *     tags: [Visits]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StartVisitRequest'
 *     responses:
 *       201:
 *         description: 방문 세션 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/GuestVisit'
 */
router.post('/', visitController.startVisit.bind(visitController));

/**
 * @swagger
 * /visits/{id}:
 *   get:
 *     summary: 방문 정보 조회
 *     tags: [Visits]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: 방문 정보 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/GuestVisit'
 */
router.get('/:id', visitController.findById.bind(visitController));

/**
 * @swagger
 * /visits/{id}/end:
 *   patch:
 *     summary: 방문 세션 종료
 *     tags: [Visits]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: 방문 종료 성공 (체류 시간 기록됨)
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/GuestVisit'
 */
router.patch('/:id/end', visitController.endVisit.bind(visitController));

/**
 * @swagger
 * /visits/{id}/events:
 *   post:
 *     summary: 방문 중 이벤트 로그
 *     tags: [Visits]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LogEventRequest'
 *     responses:
 *       201:
 *         description: 이벤트 로그 성공
 */
router.post('/:id/events', visitController.logEvent.bind(visitController));

/**
 * @swagger
 * /visits/{id}/logs:
 *   get:
 *     summary: 방문 로그 조회
 *     tags: [Visits]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: 로그 조회 성공
 */
router.get('/:id/logs', visitController.getVisitLogs.bind(visitController));

export default router;

// Space-related visit routes (require authentication)
export const spaceVisitRouter = Router({ mergeParams: true });

// These routes are mounted under /api/v1/spaces/:spaceId
spaceVisitRouter.use(authMiddleware);

/**
 * @swagger
 * /spaces/{spaceId}/visits:
 *   get:
 *     summary: 공간의 방문 기록 조회
 *     tags: [Visits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: spaceId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: 방문 기록 조회 성공
 */
spaceVisitRouter.get('/', visitController.findBySpaceId.bind(visitController));

/**
 * @swagger
 * /spaces/{spaceId}/stats:
 *   get:
 *     summary: 공간 통계 조회
 *     tags: [Visits]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: spaceId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 시작 날짜
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: 종료 날짜
 *     responses:
 *       200:
 *         description: 통계 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/SpaceStats'
 */
spaceVisitRouter.get('/stats', visitController.getStats.bind(visitController));
