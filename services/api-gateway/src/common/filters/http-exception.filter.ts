import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const rawResponse = exception instanceof HttpException
      ? exception.getResponse()
      : 'Internal server error';

    const message = this.getExceptionMessage(rawResponse);
    const code = this.getStatusCodeName(status);

    response.status(status).json({
      success: false,
      data: null,
      error: {
        code,
        message,
      },
      meta: {},
    });
  }

  private getExceptionMessage(response: string | object): string {
    if (typeof response === 'object' && response !== null) {
      const message = (response as any).message;
      if (Array.isArray(message)) {
        return message.join(', ');
      }
      return message || JSON.stringify(response);
    }
    return response;
  }

  private getStatusCodeName(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'TOO_MANY_REQUESTS';
      default:
        return 'INTERNAL_SERVER_ERROR';
    }
  }
}
