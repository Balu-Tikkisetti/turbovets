import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    username: string;
    role: string;
    department?: string;
  };
}

@Injectable()
export class ActivityTrackerMiddleware implements NestMiddleware {
  constructor(private readonly authService: AuthService) {}

  use(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    // Only track activity for authenticated requests
    if (req.user && req.user.userId) {
      // Update user activity asynchronously (don't block the request)
      setImmediate(async () => {
        try {
          await this.authService.updateUserActivity(req.user.userId);
        } catch (error) {
          console.error('Failed to update user activity:', error);
        }
      });
    }

    next();
  }
}
