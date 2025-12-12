
import { FileService } from '../../src/services/file.service';
import { FileType } from '@prisma/client';

// Mock Prisma
const mockPrisma = {
    fileUpload: {
        create: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
    },
} as any;

describe('FileService Unit Test', () => {
    let fileService: FileService;

    beforeEach(() => {
        jest.clearAllMocks();
        fileService = new FileService(mockPrisma);
    });

    describe('uploadFile', () => {
        it('should create file upload record', async () => {
            const mockFile = {
                filename: 'stored-name.png',
                originalname: 'original.png',
                mimetype: 'image/png',
                size: 1024,
            } as any;

            const mockResult = {
                id: 'file-id',
                adminId: 'admin-id',
                fileType: FileType.image,
                originalName: 'original.png',
                storedName: 'stored-name.png',
                fileUrl: '/uploads/stored-name.png',
                mimeType: 'image/png',
                fileSize: BigInt(1024),
                status: 'completed',
                createdAt: new Date(),
            };

            mockPrisma.fileUpload.create.mockResolvedValue(mockResult);

            const result = await fileService.uploadFile('admin-id', mockFile, FileType.image);

            expect(mockPrisma.fileUpload.create).toHaveBeenCalledWith({
                data: {
                    adminId: 'admin-id',
                    fileType: FileType.image,
                    originalName: 'original.png',
                    storedName: 'stored-name.png',
                    fileUrl: '/uploads/stored-name.png',
                    mimeType: 'image/png',
                    fileSize: BigInt(1024),
                    status: 'completed',
                },
            });

            expect(result.id).toBe('file-id');
        });
    });
});
