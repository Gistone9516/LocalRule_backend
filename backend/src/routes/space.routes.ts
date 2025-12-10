import { Router } from 'express';
import { spaceController } from '../controllers/space.controller';
import { qrController } from '../controllers/qr.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All space routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /spaces:
 *   post:
 *     summary: 새 공간 생성
 *     tags: [Spaces]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSpaceRequest'
 *     responses:
 *       201:
 *         description: 공간 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Space'
 *       400:
 *         description: 유효하지 않은 요청 (SPACE_LIMIT_EXCEEDED)
 */
router.post('/', spaceController.create.bind(spaceController));

/**
 * @swagger
 * /spaces:
 *   get:
 *     summary: 공간 목록 조회
 *     tags: [Spaces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 페이지 번호
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 페이지당 항목 수
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published, archived]
 *         description: 공간 상태 필터
 *     responses:
 *       200:
 *         description: 공간 목록 조회 성공
 */
router.get('/', spaceController.findAll.bind(spaceController));

/**
 * @swagger
 * /spaces/{id}:
 *   get:
 *     summary: 공간 상세 조회
 *     tags: [Spaces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 공간 ID
 *     responses:
 *       200:
 *         description: 공간 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Space'
 *       404:
 *         description: 공간을 찾을 수 없음
 */
router.get('/:id', spaceController.findById.bind(spaceController));

/**
 * @swagger
 * /spaces/{id}:
 *   put:
 *     summary: 공간 수정
 *     tags: [Spaces]
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
 *             $ref: '#/components/schemas/CreateSpaceRequest'
 *     responses:
 *       200:
 *         description: 공간 수정 성공
 */
router.put('/:id', spaceController.update.bind(spaceController));

/**
 * @swagger
 * /spaces/{id}:
 *   delete:
 *     summary: 공간 삭제 (소프트 삭제)
 *     tags: [Spaces]
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
 *         description: 공간 삭제 성공
 */
router.delete('/:id', spaceController.delete.bind(spaceController));

/**
 * @swagger
 * /spaces/{id}/status:
 *   patch:
 *     summary: 공간 상태 변경
 *     tags: [Spaces]
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
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [draft, published, archived]
 *     responses:
 *       200:
 *         description: 상태 변경 성공
 */
router.patch('/:id/status', spaceController.updateStatus.bind(spaceController));

/**
 * @swagger
 * /spaces/{id}/restore:
 *   post:
 *     summary: 삭제된 공간 복구
 *     tags: [Spaces]
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
 *         description: 공간 복구 성공
 */
router.post('/:id/restore', spaceController.restore.bind(spaceController));

/**
 * @swagger
 * /spaces/{id}/floor-plan:
 *   put:
 *     summary: 평면도 데이터 업데이트
 *     tags: [Spaces]
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
 *             type: object
 *             properties:
 *               walls:
 *                 type: array
 *                 items:
 *                   type: object
 *               doors:
 *                 type: array
 *                 items:
 *                   type: object
 *               windows:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: 평면도 업데이트 성공
 */
router.put('/:id/floor-plan', spaceController.updateFloorPlan.bind(spaceController));

/**
 * @swagger
 * /spaces/{spaceId}/qr:
 *   post:
 *     summary: QR 코드 생성
 *     tags: [Spaces]
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
 *       201:
 *         description: QR 코드 생성 성공
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/QRCode'
 */
router.post('/:spaceId/qr', qrController.generate.bind(qrController));

/**
 * @swagger
 * /spaces/{spaceId}/qr:
 *   get:
 *     summary: 공간의 QR 코드 조회
 *     tags: [Spaces]
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
 *         description: QR 코드 조회 성공
 */
router.get('/:spaceId/qr', qrController.getBySpaceId.bind(qrController));

/**
 * @swagger
 * /spaces/{spaceId}/qr:
 *   delete:
 *     summary: QR 코드 삭제
 *     tags: [Spaces]
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
 *         description: QR 코드 삭제 성공
 */
router.delete('/:spaceId/qr', qrController.delete.bind(qrController));

export default router;
