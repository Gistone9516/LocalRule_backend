import { Router } from 'express';
import { ruleController } from '../controllers/rule.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All rule routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /objects/{objectId}/rules:
 *   post:
 *     summary: 객체에 규칙 생성
 *     tags: [Rules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: objectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRuleRequest'
 *     responses:
 *       201:
 *         description: 규칙 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/LocalRule'
 *       400:
 *         description: 유효하지 않은 요청 (RULE_LIMIT_EXCEEDED, TITLE_TOO_LONG)
 */
router.post(
  '/objects/:objectId/rules',
  ruleController.create.bind(ruleController)
);

/**
 * @swagger
 * /objects/{objectId}/rules:
 *   get:
 *     summary: 객체의 규칙 목록 조회
 *     tags: [Rules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: objectId
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
 *         description: 규칙 목록 조회 성공 (우선순위 순 정렬)
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
 *                         $ref: '#/components/schemas/LocalRule'
 */
router.get(
  '/objects/:objectId/rules',
  ruleController.findByObjectId.bind(ruleController)
);

/**
 * @swagger
 * /objects/{objectId}/rules/order:
 *   put:
 *     summary: 규칙 순서 변경
 *     tags: [Rules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: objectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ruleIds
 *             properties:
 *               ruleIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       200:
 *         description: 순서 변경 성공
 */
router.put(
  '/objects/:objectId/rules/order',
  ruleController.updateOrder.bind(ruleController)
);

/**
 * @swagger
 * /rules/{id}:
 *   get:
 *     summary: 규칙 상세 조회
 *     tags: [Rules]
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
 *         description: 규칙 조회 성공
 *       404:
 *         description: 규칙을 찾을 수 없음
 */
router.get('/rules/:id', ruleController.findById.bind(ruleController));

/**
 * @swagger
 * /rules/{id}:
 *   put:
 *     summary: 규칙 수정
 *     tags: [Rules]
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
 *             $ref: '#/components/schemas/CreateRuleRequest'
 *     responses:
 *       200:
 *         description: 규칙 수정 성공
 */
router.put('/rules/:id', ruleController.update.bind(ruleController));

/**
 * @swagger
 * /rules/{id}:
 *   delete:
 *     summary: 규칙 삭제
 *     tags: [Rules]
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
 *         description: 규칙 삭제 성공 (연관 번역, 이미지도 함께 삭제)
 */
router.delete('/rules/:id', ruleController.delete.bind(ruleController));

export default router;
