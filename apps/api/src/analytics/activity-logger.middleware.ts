import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuditLogService } from '../audit-log/audit-log.service';
import { AuditAction, AuditResource, AuditSeverity } from '../entities/audit-log.entity';

@Injectable()
export class ActivityLoggerMiddleware implements NestMiddleware {
  constructor(private readonly auditLogService: AuditLogService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const originalSend = res.send;

    // Override res.send to capture response time
    res.send = function (body) {
      const duration = Date.now() - startTime;
      
      // Log the activity asynchronously (don't block the response)
      setImmediate(async () => {
        try {
          const user = (req as any).user;
          if (user && user.userId) {
            const action = this.determineAction(req.method, req.path);
            const resource = this.determineResource(req.path);
            const severity = this.determineSeverity(res.statusCode, req.path);
            const isSuccess = res.statusCode >= 200 && res.statusCode < 400;

            await this.auditLogService.log(
              action,
              resource,
              user.userId,
              this.extractResourceId(req),
              this.generateDescription(req, res),
              {
                method: req.method,
                path: req.path,
                statusCode: res.statusCode,
                userAgent: req.get('User-Agent'),
                query: req.query,
                body: this.sanitizeBody(req.body),
              },
              req.ip,
              req.get('User-Agent'),
              severity,
              user.username,
              user.role,
              user.department,
              (req as any).sessionID,
              duration,
              isSuccess,
              isSuccess ? undefined : `HTTP ${res.statusCode}`,
            );
          }
        } catch (error) {
          console.error('Failed to log activity:', error);
        }
      });

      return originalSend.call(this, body);
    }.bind(res);

    next();
  }

  private determineAction(method: string, path: string): AuditAction {
    if (path.includes('/auth/login')) return AuditAction.LOGIN;
    if (path.includes('/auth/logout')) return AuditAction.LOGOUT;
    if (path.includes('/analytics')) return AuditAction.VIEW;
    
    switch (method) {
      case 'GET':
        return AuditAction.VIEW;
      case 'POST':
        return AuditAction.CREATE;
      case 'PUT':
      case 'PATCH':
        return AuditAction.UPDATE;
      case 'DELETE':
        return AuditAction.DELETE;
      default:
        return AuditAction.VIEW;
    }
  }

  private determineResource(path: string): AuditResource {
    if (path.includes('/tasks')) return AuditResource.TASK;
    if (path.includes('/users')) return AuditResource.USER;
    if (path.includes('/auth')) return AuditResource.AUTH;
    if (path.includes('/analytics')) return AuditResource.ANALYTICS;
    if (path.includes('/audit-log')) return AuditResource.SYSTEM;
    return AuditResource.SYSTEM;
  }

  private determineSeverity(statusCode: number, path: string): AuditSeverity {
    if (statusCode >= 500) return AuditSeverity.CRITICAL;
    if (statusCode >= 400) return AuditSeverity.HIGH;
    if (path.includes('/analytics') || path.includes('/audit-log')) return AuditSeverity.MEDIUM;
    return AuditSeverity.LOW;
  }

  private extractResourceId(req: Request): string | undefined {
    const pathSegments = req.path.split('/');
    const lastSegment = pathSegments[pathSegments.length - 1];
    
    // Check if the last segment looks like a UUID or ID
    if (lastSegment && (lastSegment.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) || 
        lastSegment.match(/^\d+$/))) {
      return lastSegment;
    }
    
    return undefined;
  }

  private generateDescription(req: Request, res: Response): string {
    const method = req.method;
    const path = req.path;
    const statusCode = res.statusCode;
    
    const action = this.determineAction(method, path);
    const resource = this.determineResource(path);
    
    const resourceName = resource.replace('_', ' ').toLowerCase();
    const actionName = action.replace('_', ' ').toLowerCase();
    
    return `${actionName} ${resourceName} - ${method} ${path} (${statusCode})`;
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
    const sanitized = { ...body };
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }
}
