import { Router } from 'express';
import { objectController } from '../controllers/object.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

/**
 * @swagger
 * /object-types:
 *   get:
 *     summary: 객체 타입 목록 조회
 *     tags: [Objects]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: 카테고리 필터
 *     responses:
 *       200:
 *         description: 객체 타입 목록 조회 성공
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
 *                         $ref: '#/components/schemas/ObjectType'
 */
router.get('/object-types', objectController.getObjectTypes.bind(objectController));

// All other object routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /spaces/{spaceId}/objects:
 *   post:
 *     summary: 공간에 객체 생성
 *     tags: [Objects]
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
 *             $ref: '#/components/schemas/CreateObjectRequest'
 *     responses:
 *       201:
 *         description: 객체 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/SpaceObject'
 *       400:
 *         description: 유효하지 않은 요청 (OBJECT_LIMIT_EXCEEDED)
 */
router.post(
  '/spaces/:spaceId/objects',
  objectController.create.bind(objectController)
);

/**
 * @swagger
 * /spaces/{spaceId}/objects:
 *   get:
 *     summary: 공간의 객체 목록 조회
 *     tags: [Objects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: spaceId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: 객체 목록 조회 성공
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
 *                         $ref: '#/components/schemas/SpaceObject'
 */
router.get(
  '/spaces/:spaceId/objects',
  objectController.findBySpaceId.bind(objectController)
);

/**
 * @swagger
 * /objects/{id}:
 *   get:
 *     summary: 객체 상세 조회
 *     tags: [Objects]
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
 *         description: 객체 조회 성공
 *       404:
 *         description: 객체를 찾을 수 없음
 */
router.get('/objects/:id', objectController.findById.bind(objectController));

/**
 * @swagger
 * /objects/{id}:
 *   put:
 *     summary: 객체 수정
 *     tags: [Objects]
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
 *             $ref: '#/components/schemas/CreateObjectRequest'
 *     responses:
 *       200:
 *         description: 객체 수정 성공
 */
router.put('/objects/:id', objectController.update.bind(objectController));

/**
 * @swagger
 * /objects/{id}:
 *   delete:
 *     summary: 객체 삭제
 *     tags: [Objects]
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
 *         description: 객체 삭제 성공 (연관 규칙도 함께 삭제)
 */
router.delete('/objects/:id', objectController.delete.bind(objectController));

export default router;
