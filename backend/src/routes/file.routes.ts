import { Router } from 'express';
import { fileController } from '../controllers/file.controller';
import { uploadImage, uploadModel } from '../middleware/upload.middleware';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * @swagger
 * /upload/image:
 *   post:
 *     summary: 이미지 파일 업로드
 *     tags: [Upload]
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
 *       201:
 *         description: 업로드 성공
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/FileUpload'
 *       400:
 *         description: 잘못된 요청 (파일 형식, 크기 등)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/image', uploadImage.single('file'), fileController.uploadImage);

/**
 * @swagger
 * /upload/model:
 *   post:
 *     summary: 3D 모델 파일 업로드
 *     tags: [Upload]
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
 *       201:
 *         description: 업로드 성공
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/FileUpload'
 *       400:
 *         description: 잘못된 요청 (파일 형식, 크기 등)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/model', uploadModel.single('file'), fileController.uploadModel);

/**
 * @swagger
 * /upload:
 *   get:
 *     summary: 업로드된 파일 목록 조회
 *     tags: [Upload]
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
 *           default: 20
 *         description: 페이지 당 항목 수
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [image, model]
 *         description: 파일 타입 필터
 *     responses:
 *       200:
 *         description: 목록 조회 성공
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
 *                         files:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/FileUpload'
 *                         total:
 *                           type: integer
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 */
router.get('/', fileController.listFiles);

/**
 * @swagger
 * /upload/{id}:
 *   delete:
 *     summary: 파일 삭제
 *     tags: [Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: 파일 ID
 *     responses:
 *       200:
 *         description: 삭제 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: 파일을 찾을 수 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/:id', fileController.deleteFile);

export default router;
