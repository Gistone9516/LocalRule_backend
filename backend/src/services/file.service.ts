import fs from 'fs';
import path from 'path';
import { PrismaClient, FileType } from '@prisma/client';
import { prisma } from '../config/database';
import { AppError, ErrorCode } from '../utils/errors';
import { PaginatedResult } from '../types';
import { config } from '../config';

export interface FileData {
    id: string;
    adminId: string;
    fileType: FileType;
    originalName: string;
    storedName: string;
    fileUrl: string;
    mimeType: string;
    fileSize: bigint;
    status: string;
    createdAt: Date;
}

export class FileService {
    private prisma: PrismaClient;

    constructor(prismaClient: PrismaClient = prisma) {
        this.prisma = prismaClient;
    }

    /**
     * Save file upload metadata to database
     */
    async uploadFile(
        adminId: string,
        file: Express.Multer.File,
        fileType: FileType
    ): Promise<FileData> {
        // Construct public URL - assuming static file serving is set up
        const fileUrl = `/uploads/${file.filename}`;

        const fileUpload = await this.prisma.fileUpload.create({
            data: {
                adminId,
                fileType,
                originalName: file.originalname,
                storedName: file.filename,
                fileUrl,
                mimeType: file.mimetype,
                fileSize: BigInt(file.size), // Prisma handles BigInt
                status: 'completed',
            },
        });

        return this.mapToFileData(fileUpload);
    }

    /**
     * Find all files for an admin with pagination
     */
    async findAll(
        adminId: string,
        page: number = 1,
        limit: number = 10,
        fileType?: FileType
    ): Promise<PaginatedResult<FileData>> {
        const skip = (page - 1) * limit;
        const where: any = { adminId };

        if (fileType) {
            where.fileType = fileType;
        }

        const [files, total] = await Promise.all([
            this.prisma.fileUpload.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.fileUpload.count({ where }),
        ]);

        return {
            data: files.map((f: any) => this.mapToFileData(f)),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Delete a file
     */
    async deleteFile(id: string, adminId: string): Promise<void> {
        const file = await this.prisma.fileUpload.findUnique({
            where: { id },
        });

        if (!file) {
            throw new AppError(ErrorCode.NOT_FOUND, 'File not found', 404);
        }

        if (file.adminId !== adminId) {
            throw AppError.forbidden('You do not have permission to delete this file');
        }

        // Delete database record
        await this.prisma.fileUpload.delete({
            where: { id },
        });

        // Delete file from disk
        const filePath = path.join(config.upload.dir, file.storedName);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }

    private mapToFileData(file: any): FileData {
        return {
            id: file.id,
            adminId: file.adminId,
            fileType: file.fileType,
            originalName: file.originalName,
            storedName: file.storedName,
            fileUrl: file.fileUrl,
            mimeType: file.mimeType,
            fileSize: file.fileSize,
            status: file.status,
            createdAt: file.createdAt,
        };
    }
}

export const fileService = new FileService();
