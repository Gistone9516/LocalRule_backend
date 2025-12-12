import { Router } from 'express';
import { mlController } from '../controllers/ml.controller';
import { uploadImage } from '../middleware/upload.middleware';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Apply auth middleware
router.use(authMiddleware);

/**
 * @swagger
 * /ml/detect:
 *   post:
 *     summary: 이미지에서 객체 인식 (Mock)
 *     tags: [ML]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: 객체 인식 성공
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
 *                         objects:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               label:
 *                                 type: string
 *                               confidence:
 *                                 type: number
 *                               boundingBox:
 *                                 type: object
 *                                 properties:
 *                                   x:
 *                                     type: number
 *                                   y:
 *                                     type: number
 *                                   width:
 *                                     type: number
 *                                   height:
 *                                     type: number
 *       400:
 *         description: 이미지가 없음
 */
router.post('/detect', uploadImage.single('file'), mlController.detect.bind(mlController));

export default router;
