import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { AppError, ErrorCode } from '../utils/errors';
import { config } from '../config';

// Ensure upload directory exists
const uploadDir = config.upload.dir;
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        // Generate unique filename: uuid + extension
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    },
});

// File filter


// Multer instances
export const uploadImage = multer({
    storage,
    fileFilter: (_req: any, file, cb) => {
        const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowedImageTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new AppError(ErrorCode.INVALID_FILE_FORMAT, 'Invalid image format. Allowed: jpg, png, webp', 400) as any);
        }
    },
    limits: {
        fileSize: config.upload.maxImageSize, // 2MB default
    },
});

export const uploadModel = multer({
    storage,
    fileFilter: (_req: any, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const allowedModelExts = ['.glb', '.gltf', '.fbx', '.obj'];

        if (allowedModelExts.includes(ext)) {
            cb(null, true);
        } else {
            cb(new AppError(ErrorCode.INVALID_FILE_FORMAT, 'Invalid model format. Allowed: glb, gltf, fbx, obj', 400) as any);
        }
    },
    limits: {
        fileSize: config.upload.maxMeshSize, // 5MB default
    },
});
