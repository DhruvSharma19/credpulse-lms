import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';
import { BUSINESS_RULES, HTTP_STATUS } from '../constants';
import { sendError } from '../utils/apiResponse.util';

const uploadDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanBasename = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    cb(null, `salary_slip_${cleanBasename}_${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes: readonly string[] = BUSINESS_RULES.ALLOWED_SALARY_SLIP_MIMES;
  if (!allowedMimes.includes(file.mimetype)) {
    cb(
      new Error(
        `Invalid file type '${file.mimetype}'. Only PDF, JPG, and PNG files are accepted.`
      )
    );
    return;
  }
  cb(null, true);
};

const multerUpload = multer({
  storage,
  limits: {
    fileSize: BUSINESS_RULES.MAX_SALARY_SLIP_SIZE_BYTES,
  },
  fileFilter,
}).single('salarySlip');

export const uploadSalarySlip = (req: Request, res: Response, next: NextFunction): void => {
  multerUpload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        sendError(
          res,
          `File size exceeds 5 MB limit. Please upload a smaller document.`,
          [err.message],
          HTTP_STATUS.BAD_REQUEST
        );
        return;
      }
      sendError(res, `Upload error: ${err.message}`, undefined, HTTP_STATUS.BAD_REQUEST);
      return;
    } else if (err) {
      sendError(res, err.message, undefined, HTTP_STATUS.BAD_REQUEST);
      return;
    }

    if (!req.file) {
      sendError(
        res,
        'Salary slip file is required. Please attach a PDF, JPG, or PNG under 5 MB.',
        undefined,
        HTTP_STATUS.BAD_REQUEST
      );
      return;
    }

    next();
  });
};
