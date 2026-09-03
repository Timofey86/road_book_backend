import {Injectable} from "@nestjs/common";
import {PassportStrategy} from "@nestjs/passport";
import {ExtractJwt, Strategy} from "passport-jwt";
import {ConfigService} from "@nestjs/config";
import type { Request } from 'express';
import {JwtPayload} from "../../common/interfaces/jwt-user.interface";

const accessTokenExtractor = (request: Request): string | null => {
    return request?.cookies?.access_token ?? null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private readonly configService: ConfigService,) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                accessTokenExtractor,
            ]),
            ignoreExpiration: false,
            secretOrKey: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        });
    }

    validate(payload: JwtPayload) {
        return {
            id: payload.sub,
            email: payload.email,
        }
    }

}