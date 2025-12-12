import { Router } from 'express';
import { qrController } from '../controllers/qr.controller';

const router = Router();

/**
 * @swagger
 * /qr/{code}:
 *   get:
 *     summary: QR 코드로 공간 조회 (게스트용)
 *     tags: [QR]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: 8자리 QR 코드
 *         example: ABC12345
 *     responses:
 *       200:
 *         description: 공간 정보 조회 성공 (객체, 규칙, 트리거 포함)
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         space:
 *                           $ref: '#/components/schemas/Space'
 *                         objects:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/SpaceObject'
 *                         triggers:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/TriggerZone'
 *       404:
 *         description: QR 코드를 찾을 수 없음 (QR_NOT_FOUND)
 */
router.get('/:code', qrController.findByCode.bind(qrController));

/**
 * @swagger
 * /qr/{code}/scan:
 *   post:
 *     summary: QR 코드 스캔 (카운터 증가)
 *     tags: [QR]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: 8자리 QR 코드
 *         example: ABC12345
 *     responses:
 *       200:
 *         description: 스캔 성공 (카운터 증가됨)
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/QRCode'
 *       404:
 *         description: QR 코드를 찾을 수 없음
 */
router.post('/:code/scan', qrController.scan.bind(qrController));

export default router;
