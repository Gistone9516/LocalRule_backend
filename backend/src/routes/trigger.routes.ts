import { Router } from 'express';
import { triggerController } from '../controllers/trigger.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All trigger routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /spaces/{spaceId}/triggers:
 *   post:
 *     summary: 트리거 존 생성
 *     tags: [Triggers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: spaceId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTriggerRequest'
 *     responses:
 *       201:
 *         description: 트리거 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/TriggerZone'
 *       400:
 *         description: 유효하지 않은 요청 (TRIGGER_LIMIT_EXCEEDED, INVALID_RADIUS)
 */
router.post(
  '/spaces/:spaceId/triggers',
  triggerController.create.bind(triggerController)
);

/**
 * @swagger
 * /spaces/{spaceId}/triggers:
 *   get:
 *     summary: 공간의 트리거 목록 조회
 *     tags: [Triggers]
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
 *         name: lang
 *         schema:
 *           type: string
 *           enum: [ko, en, ja, zh]
 *         description: 번역 언어
 *     responses:
 *       200:
 *         description: 트리거 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/TriggerZone'
 */
router.get(
  '/spaces/:spaceId/triggers',
  triggerController.findBySpaceId.bind(triggerController)
);

/**
 * @swagger
 * /triggers/{id}:
 *   get:
 *     summary: 트리거 상세 조회
 *     tags: [Triggers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: 트리거 조회 성공
 *       404:
 *         description: 트리거를 찾을 수 없음
 */
router.get('/triggers/:id', triggerController.findById.bind(triggerController));

/**
 * @swagger
 * /triggers/{id}:
 *   put:
 *     summary: 트리거 수정
 *     tags: [Triggers]
 *     security:
 *       - bearerAuth: []
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
 *             $ref: '#/components/schemas/CreateTriggerRequest'
 *     responses:
 *       200:
 *         description: 트리거 수정 성공
 */
router.put('/triggers/:id', triggerController.update.bind(triggerController));

/**
 * @swagger
 * /triggers/{id}:
 *   delete:
 *     summary: 트리거 삭제
 *     tags: [Triggers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: 트리거 삭제 성공 (연관 번역도 함께 삭제)
 */
router.delete('/triggers/:id', triggerController.delete.bind(triggerController));

export default router;
