import { Router } from 'express';
import { translateController } from '../controllers/translate.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Apply auth middleware
router.use(authMiddleware);

/**
 * @swagger
 * /translate:
 *   post:
 *     summary: 텍스트 번역 (Mock)
 *     tags: [Translate]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *               - targetLang
 *             properties:
 *               text:
 *                 type: string
 *               targetLang:
 *                 type: string
 *                 enum: [ko, en, ja, zh]
 *     responses:
 *       200:
 *         description: 번역 성공
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
 *                         translatedText:
 *                           type: string
 *                           example: "Hello [KO]"
 */
router.post('/', translateController.translate.bind(translateController));

export default router;
