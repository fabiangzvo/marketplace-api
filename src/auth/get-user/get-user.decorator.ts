import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

import { User } from '../../users/entities/user.entity';

export const GetUser = createParamDecorator(
  (data: string, ctx: ExecutionContext): User | undefined => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user as User | undefined;

    if (!user) return undefined;

    return (data ? user[data] : user) as User;
  },
);
