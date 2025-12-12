import { Request, Response, NextFunction } from 'express';
import { fileService } from '../services/file.service';
import { AppError, ErrorCode } from '../utils/errors';
import { FileType } from '@prisma/client';

// Extend Request type to include file (Multer)
interface MulterRequest extends Request {
    file?: Express.Multer.File;
}

export class FileController {
    /**
     * Upload an image
     */
    async uploadImage(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const multerReq = req as MulterRequest;
            if (!multerReq.file) {
                throw new AppError(ErrorCode.VALIDATION_ERROR, 'No file uploaded', 400);
            }

            if (!req.adminId) {
                throw AppError.unauthorized();
            }

            const result = await fileService.uploadFile(
                req.adminId,
                multerReq.file,
                FileType.image
            );

            // Need to handle BigInt serialization
            const serialized = JSON.parse(JSON.stringify(result, (_, v) =>
                typeof v === 'bigint' ? v.toString() : v
            ));

            res.status(201).json(serialized);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Upload a 3D model
     */
    async uploadModel(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const multerReq = req as MulterRequest;
            if (!multerReq.file) {
                throw new AppError(ErrorCode.VALIDATION_ERROR, 'No file uploaded', 400);
            }

            if (!req.adminId) {
                throw AppError.unauthorized();
            }

            const result = await fileService.uploadFile(
                req.adminId,
                multerReq.file,
                FileType.model
            );

            const serialized = JSON.parse(JSON.stringify(result, (_, v) =>
                typeof v === 'bigint' ? v.toString() : v
            ));

            res.status(201).json(serialized);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Upload an AR mesh
     */
    async uploadMesh(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const multerReq = req as MulterRequest;
            if (!multerReq.file) {
                throw new AppError(ErrorCode.VALIDATION_ERROR, 'No file uploaded', 400);
            }

            if (!req.adminId) {
                throw AppError.unauthorized();
            }

            const result = await fileService.uploadFile(
                req.adminId,
                multerReq.file,
                FileType.mesh
            );

            const serialized = JSON.parse(JSON.stringify(result, (_, v) =>
                typeof v === 'bigint' ? v.toString() : v
            ));

            res.status(201).json(serialized);
        } catch (error) {
            next(error);
        }
    }

    /**
     * List uploaded files
     */
    async listFiles(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.adminId) {
                throw AppError.unauthorized();
            }

            const page = parseInt(req.query.page as string || '1', 10);
            const limit = parseInt(req.query.limit as string || '10', 10);
            const type = req.query.type as FileType | undefined;

            const result = await fileService.findAll(req.adminId, page, limit, type);

            const serialized = JSON.parse(JSON.stringify(result, (_, v) =>
                typeof v === 'bigint' ? v.toString() : v
            ));

            res.status(200).json(serialized);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete a file
     */
    async deleteFile(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            if (!req.adminId) {
                throw AppError.unauthorized();
            }

            const { id } = req.params;
            await fileService.deleteFile(id, req.adminId);

            res.status(200).json({ message: 'File deleted successfully' });
        } catch (error) {
            next(error);
        }
    }
}

export const fileController = new FileController();
